package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"guardian-cloud/internal/crypto"
)

type BootstrapHandler struct {
	DB *sql.DB
}

type bootstrapStatusResponse struct {
	NeedsSetup  bool   `json:"needs_setup"`
	IsCompleted bool   `json:"is_completed"`
	CompletedAt string `json:"completed_at,omitempty"`
}

type setupRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
}

type setupResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	UserID  string `json:"user_id"`
	Email   string `json:"email"`
}

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

func (h *BootstrapHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	var isCompleted bool
	var completedAt sql.NullTime

	err := h.DB.QueryRowContext(r.Context(), `
		SELECT is_completed, completed_at
		FROM platform_bootstrap
		WHERE id = '00000000-0000-4000-8000-000000000000'
	`).Scan(&isCompleted, &completedAt)

	if err == sql.ErrNoRows {
		// If table exists but row missing, needs setup
		writeJSON(w, http.StatusOK, bootstrapStatusResponse{
			NeedsSetup:  true,
			IsCompleted: false,
		})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": fmt.Sprintf("failed to query bootstrap state: %v", err),
		})
		return
	}

	resp := bootstrapStatusResponse{
		NeedsSetup:  !isCompleted,
		IsCompleted: isCompleted,
	}
	if completedAt.Valid {
		resp.CompletedAt = completedAt.Time.UTC().Format(time.RFC3339)
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *BootstrapHandler) Setup(w http.ResponseWriter, r *http.Request) {
	// 1. First check if bootstrap is already completed
	var isCompleted bool
	err := h.DB.QueryRowContext(r.Context(), `
		SELECT is_completed
		FROM platform_bootstrap
		WHERE id = '00000000-0000-4000-8000-000000000000'
	`).Scan(&isCompleted)

	if err != nil && err != sql.ErrNoRows {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "database error checking bootstrap state",
		})
		return
	}

	if isCompleted {
		writeJSON(w, http.StatusGone, map[string]string{
			"error": "Platform setup has already been completed. Further setup is permanently locked.",
		})
		return
	}

	// 2. Decode and validate request
	var req setupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.DisplayName = strings.TrimSpace(req.DisplayName)

	if req.Email == "" || !emailRegex.MatchString(req.Email) {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "valid email address is required",
		})
		return
	}

	if len(req.Password) < 10 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "password must be at least 10 characters long",
		})
		return
	}

	if req.DisplayName == "" {
		req.DisplayName = "Super Administrator"
	}

	// 3. Hash password using Argon2id
	hash, err := crypto.HashPassword(req.Password)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to hash password",
		})
		return
	}

	// 4. Atomic transaction
	tx, err := h.DB.BeginTx(r.Context(), nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to start transaction",
		})
		return
	}
	defer tx.Rollback()

	// Double check lock with SELECT FOR UPDATE on singleton
	var lockedCompleted bool
	err = tx.QueryRowContext(r.Context(), `
		SELECT is_completed
		FROM platform_bootstrap
		WHERE id = '00000000-0000-4000-8000-000000000000'
		FOR UPDATE
	`).Scan(&lockedCompleted)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to acquire bootstrap lock",
		})
		return
	}

	if lockedCompleted {
		writeJSON(w, http.StatusGone, map[string]string{
			"error": "Platform setup has already been completed.",
		})
		return
	}

	// Insert or update root user
	var userID string
	err = tx.QueryRowContext(r.Context(), `
		INSERT INTO users (email, email_verified_at, display_name, status)
		VALUES ($1, now(), $2, 'ACTIVE')
		ON CONFLICT (email) DO UPDATE
		SET email_verified_at = now(), display_name = EXCLUDED.display_name, status = 'ACTIVE'
		RETURNING id
	`, req.Email, req.DisplayName).Scan(&userID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": fmt.Sprintf("failed to create user: %v", err),
		})
		return
	}

	// Insert credentials
	_, err = tx.ExecContext(r.Context(), `
		INSERT INTO user_credentials (user_id, credential_type, secret_hash)
		VALUES ($1, 'PASSWORD', $2)
	`, userID, hash)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": fmt.Sprintf("failed to store credentials: %v", err),
		})
		return
	}

	// Grant SUPER_ADMIN in platform_admins
	_, err = tx.ExecContext(r.Context(), `
		INSERT INTO platform_admins (user_id, role, granted_at)
		VALUES ($1, 'SUPER_ADMIN', now())
		ON CONFLICT DO NOTHING
	`, userID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": fmt.Sprintf("failed to grant platform admin: %v", err),
		})
		return
	}

	// Audit log entry
	meta, _ := json.Marshal(map[string]any{
		"action":     "PLATFORM_SETUP",
		"email":      req.Email,
		"ip":         r.RemoteAddr,
		"user_agent": r.UserAgent(),
	})

	_, err = tx.ExecContext(r.Context(), `
		INSERT INTO audit_logs (tenant_id, actor_type, actor_id, action, target_type, target_id, metadata, occurred_at)
		VALUES (NULL, 'SUPER_ADMIN', $1, 'PLATFORM_SETUP', 'USER', $1, $2, now())
	`, userID, meta)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": fmt.Sprintf("failed to write audit log: %v", err),
		})
		return
	}

	// Lock bootstrap
	ip := r.RemoteAddr
	if colon := strings.LastIndex(ip, ":"); colon != -1 {
		ip = ip[:colon]
	}
	if ip == "[" || ip == "" || strings.Contains(ip, "localhost") {
		ip = "127.0.0.1"
	}

	_, err = tx.ExecContext(r.Context(), `
		UPDATE platform_bootstrap
		SET is_completed = true,
		    completed_at = now(),
		    super_admin_id = $1,
		    setup_user_agent = $2
		WHERE id = '00000000-0000-4000-8000-000000000000'
	`, userID, r.UserAgent())

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": fmt.Sprintf("failed to finalize bootstrap state: %v", err),
		})
		return
	}

	if err := tx.Commit(); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to commit setup transaction",
		})
		return
	}

	writeJSON(w, http.StatusCreated, setupResponse{
		Status:  "success",
		Message: "Platform root super-admin initialized successfully. Setup is now permanently locked.",
		UserID:  userID,
		Email:   req.Email,
	})
}
