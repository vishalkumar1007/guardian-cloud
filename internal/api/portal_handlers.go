package api

import (
	"database/sql"
	"errors"
	"net/http"

	"guardian-cloud/internal/audit"
	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/db"
)

// PortalHandler serves the customer's own personal workspace.
//
// Every query resolves the tenant from the caller's membership rather than from
// anything the client sent. That is the single most important rule in the
// system: "never accept a client-supplied tenant_id as authorization".
type PortalHandler struct {
	*Env
}

// Overview is the personal dashboard payload: who you are, which tenant you own,
// what you are paying for, and how many devices you have.
func (h *PortalHandler) Overview(w http.ResponseWriter, r *http.Request) {
	principal := auth.PrincipalForPlane(r.Context(), auth.CustomerPlane)
	if principal == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	ctx := r.Context()

	var (
		tenantID, tenantName, tenantStatus string
		planName, subStatus                sql.NullString
		deviceLimit                        sql.NullInt64
		periodEnd                          sql.NullTime
	)

	// Tenant comes from the membership row, never from a parameter.
	err := h.DB.QueryRowContext(ctx, `
		SELECT t.id::text, t.name, t.status,
		       p.name, s.status, s.seat_or_device_limit, s.current_period_end
		FROM memberships m
		JOIN tenants t ON t.id = m.tenant_id
		LEFT JOIN subscriptions s
		       ON s.tenant_id = t.id AND s.status IN ('TRIALING','ACTIVE','PAST_DUE')
		LEFT JOIN plans p ON p.id = s.plan_id
		WHERE m.user_id = $1 AND m.status = 'ACTIVE' AND t.type = 'PERSONAL'
		ORDER BY m.joined_at ASC
		LIMIT 1
	`, principal.SubjectID).Scan(
		&tenantID, &tenantName, &tenantStatus,
		&planName, &subStatus, &deviceLimit, &periodEnd,
	)

	// A session with no membership is a 403, never a 500: the account exists but
	// owns nothing, which is a legitimate state to report cleanly.
	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusForbidden, map[string]string{
			"error": "this account has no workspace yet",
		})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load your workspace"})
		return
	}

	var deviceCount int
	if err := h.DB.QueryRowContext(ctx,
		`SELECT count(*) FROM devices WHERE tenant_id = $1`, tenantID).Scan(&deviceCount); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to count devices"})
		return
	}

	methods, err := auth.ListMFAMethods(ctx, h.DB, auth.CustomerPlane, principal.SubjectID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load account"})
		return
	}

	subscription := map[string]any{}
	if subStatus.Valid {
		subscription["status"] = subStatus.String
		subscription["plan"] = planName.String
		if deviceLimit.Valid {
			subscription["device_limit"] = deviceLimit.Int64
		}
		if periodEnd.Valid {
			subscription["current_period_end"] = periodEnd.Time.UTC().Format(timeLayout)
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"user": map[string]any{
			"id":             principal.SubjectID,
			"email":          principal.Email,
			"display_name":   principal.Name,
			"mfa_enabled":    len(methods) > 0,
			"email_verified": h.emailVerified(r, principal.SubjectID),
		},
		"tenant": map[string]any{
			"id":     tenantID,
			"name":   tenantName,
			"status": tenantStatus,
		},
		"subscription": subscription,
		"devices": map[string]any{
			"count": deviceCount,
			// Drives the spec's "Add your first device" empty state.
			"needs_first_device": deviceCount == 0,
		},
	})
}

func (h *PortalHandler) emailVerified(r *http.Request, userID string) bool {
	identity, err := auth.LoadIdentityByID(r.Context(), h.DB, auth.CustomerPlane, userID)
	if err != nil {
		return false
	}
	return identity.EmailVerifiedAt != nil
}

type updateProfileRequest struct {
	DisplayName string `json:"display_name"`
}

// UpdateProfile changes the caller's display name.
func (h *PortalHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	principal := auth.PrincipalForPlane(r.Context(), auth.CustomerPlane)
	if principal == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}

	var req updateProfileRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	ctx := r.Context()

	if err := db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		if _, err := tx.ExecContext(ctx, `
			UPDATE users SET display_name = NULLIF($2,''), updated_at = now() WHERE id = $1
		`, principal.SubjectID, req.DisplayName); err != nil {
			return err
		}
		return audit.Write(ctx, tx, audit.Entry{
			ActorPlane: audit.PlaneCustomer,
			ActorType:  audit.ActorUser,
			ActorID:    &principal.SubjectID,
			Action:     "profile.updated",
			TargetType: "user",
			TargetID:   &principal.SubjectID,
			IPAddress:  ClientIPString(ctx),
			UserAgent:  r.UserAgent(),
			RequestID:  RequestIDFromContext(ctx),
		})
	}); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not update your profile"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"display_name": req.DisplayName})
}
