package api

import (
	"context"
	"database/sql"
	"errors"
	"net/http"

	"guardian-cloud/internal/audit"
	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/db"
	"guardian-cloud/internal/settings"
)

// First-run setup.
//
// A brand-new deployment has no Guardian staff account that can sign in:
// migration 00018 seeds an identity but deliberately ships no credential, so
// there is no default password to guess. Setup is how the first real account is
// created from the browser instead of requiring shell access.
//
// This endpoint creates a SUPER_ADMIN without authentication, so closing it
// again correctly is the whole security story. Two independent conditions must
// both hold for it to be open:
//
//  1. No active staff account has a usable password credential.
//  2. The one-way setupCompleted flag has never been set.
//
// The second exists because the first can be made true again — revoking every
// credential, or an operator moving to SSO-only — and without the flag that
// would silently re-open unauthenticated SUPER_ADMIN creation on a live system.

// setupAdvisoryLockKey serialises concurrent setup attempts. Any constant works;
// this one is arbitrary and only has to be unique within the database.
const setupAdvisoryLockKey = 8410077

type setupRequest struct {
	Email       string `json:"email"`
	DisplayName string `json:"display_name"`
	Password    string `json:"password"`
}

// SetupStatus reports whether first-run setup is still available.
//
// Unauthenticated by necessity — the client has to know which screen to show
// before anyone can sign in. It reveals only a boolean: no account details, and
// nothing that helps an attacker on an already-configured system.
func (h *AuthHandler) SetupStatus(w http.ResponseWriter, r *http.Request) {
	required, err := h.setupRequired(r.Context(), nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to determine setup status",
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"setup_required": required})
}

// CompleteSetup creates the first Guardian super admin.
//
// MFA is optional by default: the new account can sign in with a password and
// enrol two-factor authentication later from Account security. Operators can
// still enforce MFA globally (requireMfaAdmin) or per account.
func (h *AuthHandler) CompleteSetup(w http.ResponseWriter, r *http.Request) {
	var req setupRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	ctx := r.Context()
	email := auth.NormalizeEmail(req.Email)

	if !auth.LooksLikeEmail(email) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "enter a valid email address"})
		return
	}
	if err := auth.CheckPasswordPolicy(req.Password, h.PasswordMinLength(ctx)); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	var adminID string
	err := db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		// Held until commit. Two simultaneous setup requests serialise here, so
		// the second re-reads the state the first has already changed and is
		// refused instead of creating a second super admin.
		if _, err := tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock($1)`, setupAdvisoryLockKey); err != nil {
			return err
		}

		required, err := h.setupRequired(ctx, tx)
		if err != nil {
			return err
		}
		if !required {
			return errSetupAlreadyComplete
		}

		adminID, err = h.upsertFirstAdmin(ctx, tx, email, req.DisplayName)
		if err != nil {
			return err
		}
		if err := auth.SetPassword(ctx, tx, auth.AdminPlane, adminID, req.Password); err != nil {
			return err
		}
		if err := grantSuperAdminRole(ctx, tx, adminID); err != nil {
			return err
		}

		// One-way: from here the endpoint is closed for good.
		if err := h.Settings.Set(ctx, tx, settings.KeySetupCompleted, true, &adminID); err != nil {
			return err
		}

		return audit.Write(ctx, tx, audit.Entry{
			ActorPlane: audit.PlaneAdmin,
			ActorType:  audit.ActorGuardianAdmin,
			ActorID:    &adminID,
			Action:     "platform.setup.completed",
			TargetType: "guardian_admin_user",
			TargetID:   &adminID,
			Metadata:   map[string]any{"email": email},
			IPAddress:  ClientIPString(ctx),
			UserAgent:  r.UserAgent(),
			RequestID:  RequestIDFromContext(ctx),
		})
	})

	if errors.Is(err, errSetupAlreadyComplete) {
		writeJSON(w, http.StatusConflict, map[string]string{
			"error": "Guardian has already been set up. Sign in instead.",
		})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to complete setup"})
		return
	}

	// The settings cache would otherwise keep reporting setup as available for
	// up to its TTL, and the client would bounce straight back to this screen.
	h.Settings.Invalidate()

	writeJSON(w, http.StatusCreated, map[string]any{
		"admin_user_id": adminID,
		"email":         email,
	})
}

var errSetupAlreadyComplete = errors.New("setup already complete")

// setupRequired reports whether first-run setup is still open.
//
// tx may be nil for a plain read; inside CompleteSetup it is the locking
// transaction, so the check and the write cannot be separated by a racing
// request.
func (h *AuthHandler) setupRequired(ctx context.Context, tx *sql.Tx) (bool, error) {
	// The one-way flag is checked first and on its own: once set, no credential
	// state can re-open setup.
	if h.Settings.Bool(ctx, settings.KeySetupCompleted) {
		return false, nil
	}

	const query = `
		SELECT NOT EXISTS (
			SELECT 1
			FROM guardian_admin_credentials c
			JOIN guardian_admin_users u ON u.id = c.admin_user_id
			WHERE c.credential_type = 'PASSWORD'
			  AND c.revoked_at IS NULL
			  AND u.deleted_at IS NULL
			  AND u.status = 'ACTIVE'
		)
	`

	var required bool
	var err error
	if tx != nil {
		err = tx.QueryRowContext(ctx, query).Scan(&required)
	} else {
		err = h.DB.QueryRowContext(ctx, query).Scan(&required)
	}
	if err != nil {
		return false, err
	}
	return required, nil
}

// upsertFirstAdmin adopts the seeded identity when the operator chooses its
// address, and otherwise creates a new one. Adopting matters because the email
// column is unique: a plain insert would fail against the seeded row.
func (h *AuthHandler) upsertFirstAdmin(ctx context.Context, tx *sql.Tx, email, displayName string) (string, error) {
	if displayName == "" {
		displayName = "Guardian Super Admin"
	}

	var id string
	err := tx.QueryRowContext(ctx, `
		SELECT id::text FROM guardian_admin_users WHERE email = $1
	`, email).Scan(&id)

	if err == nil {
		_, err = tx.ExecContext(ctx, `
			UPDATE guardian_admin_users
			SET display_name = $2, status = 'ACTIVE', email_verified_at = COALESCE(email_verified_at, now()),
			    deleted_at = NULL, updated_at = now()
			WHERE id = $1
		`, id, displayName)
		return id, err
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return "", err
	}

	err = tx.QueryRowContext(ctx, `
		INSERT INTO guardian_admin_users (email, display_name, email_verified_at, status, mfa_required)
		VALUES ($1, $2, now(), 'ACTIVE', false)
		RETURNING id::text
	`, email, displayName).Scan(&id)
	return id, err
}

func grantSuperAdminRole(ctx context.Context, tx *sql.Tx, adminID string) error {
	_, err := tx.ExecContext(ctx, `
		INSERT INTO guardian_admin_roles (admin_user_id, role_id)
		SELECT $1, id FROM guardian_roles WHERE role_key = 'SUPER_ADMIN'
		ON CONFLICT (admin_user_id, role_id) WHERE revoked_at IS NULL DO NOTHING
	`, adminID)
	return err
}
