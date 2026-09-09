package api

import (
	"context"
	"crypto/subtle"
	"fmt"
	"net/http"
	"strings"

	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/crypto"
	"guardian-cloud/internal/mail"
)

// emailCodeValidMinutes matches mfa.ChallengeTTL and is stated in the message so
// the recipient knows how long they have.
const emailCodeValidMinutes = 5

// newSealedEmailCode mints a one-time code and its sealed form.
//
// The plaintext is returned for the email and never persisted; the database
// holds only the sealed value, bound to the subject so it cannot be replayed
// against a different account.
func (e *Env) newSealedEmailCode(subjectID string) (code string, sealed string, err error) {
	code, err = crypto.NewNumericCode(6)
	if err != nil {
		return "", "", err
	}
	sealed, err = e.Sealer.Seal(code, "mfa-challenge:"+subjectID)
	if err != nil {
		return "", "", err
	}
	return code, sealed, nil
}

func mailEmailOTP(code string) (subject, body string) {
	return mail.EmailOTP(code, emailCodeValidMinutes)
}

// constantTimeEqual compares two secrets without leaking their contents through
// timing.
func constantTimeEqual(expected, supplied string) bool {
	return subtle.ConstantTimeCompare([]byte(expected), []byte(strings.TrimSpace(supplied))) == 1
}

// rotateCSRF mints a fresh CSRF token bound to an existing session.
//
// Needed because only the digest is stored: after a page reload the frontend has
// no copy of the token, and it cannot be recovered — only replaced.
func (e *Env) rotateCSRF(r *http.Request, plane auth.Plane, principal *auth.Principal) (string, error) {
	token, hash, err := crypto.NewOpaqueToken()
	if err != nil {
		return "", err
	}

	query := fmt.Sprintf(`UPDATE %s SET csrf_token_hash = $2 WHERE id = $1 AND revoked_at IS NULL`, plane.SessionsTable)
	if _, err := e.DB.ExecContext(r.Context(), query, principal.SessionID, hash); err != nil {
		return "", fmt.Errorf("rotate csrf token: %w", err)
	}

	principal.CSRFTokenHash = hash
	return token, nil
}

// adminRole is the summary shape returned by /me.
type adminRole struct {
	ID   string `json:"id"`
	Key  string `json:"key"`
	Name string `json:"name"`
}

// adminRoles lists a staff member's live role grants.
func (e *Env) adminRoles(ctx context.Context, adminUserID string) ([]adminRole, error) {
	rows, err := e.DB.QueryContext(ctx, `
		SELECT DISTINCT r.id::text, r.role_key, r.name
		FROM guardian_roles r
		WHERE r.id IN (
			SELECT ar.role_id FROM guardian_admin_roles ar
			WHERE ar.admin_user_id = $1 AND ar.revoked_at IS NULL
			  AND (ar.expires_at IS NULL OR ar.expires_at > now())
			UNION
			SELECT tr.role_id FROM guardian_team_roles tr
			JOIN guardian_team_members tm ON tm.team_id = tr.team_id
			WHERE tm.admin_user_id = $1
		)
		ORDER BY r.role_key
	`, adminUserID)
	if err != nil {
		return nil, fmt.Errorf("load admin roles: %w", err)
	}
	defer rows.Close()

	roles := []adminRole{}
	for rows.Next() {
		var role adminRole
		if err := rows.Scan(&role.ID, &role.Key, &role.Name); err != nil {
			return nil, fmt.Errorf("scan admin role: %w", err)
		}
		roles = append(roles, role)
	}
	return roles, rows.Err()
}

// mfaMethodResponse projects an enrolled factor for the API.
//
// Deliberately omits SecretRef: the sealed secret must never reach a client,
// and building the response by hand rather than tagging the struct keeps that
// decision visible.
func mfaMethodResponse(m auth.MFAMethod) map[string]any {
	out := map[string]any{
		"id":          m.ID,
		"method_type": m.MethodType,
		"label":       m.Label,
		"is_primary":  m.IsPrimary,
		"created_at":  m.CreatedAt.UTC().Format(timeLayout),
	}
	if m.VerifiedAt != nil {
		out["verified_at"] = m.VerifiedAt.Format(timeLayout)
	}
	if m.LastUsedAt != nil {
		out["last_used_at"] = m.LastUsedAt.Format(timeLayout)
	}
	return out
}

// timeLayout matches the format the existing platform handlers already emit.
const timeLayout = "2006-01-02T15:04:05Z"
