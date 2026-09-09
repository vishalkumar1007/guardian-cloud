package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"guardian-cloud/internal/crypto"
)

// Now is the engine's time source. Tests replace it to exercise idle timeout and
// lockout backoff without sleeping.
var Now = time.Now

// SessionPolicy is the lifetime configuration read from platform_settings.
type SessionPolicy struct {
	// AbsoluteDays caps total session lifetime regardless of activity.
	AbsoluteDays int
	// IdleMinutes ends a session that has gone quiet. Zero disables idle expiry.
	IdleMinutes int
	// RenewWithinDays extends a session that is used while close to expiry, so
	// active people are not logged out on a fixed schedule.
	RenewWithinDays int
}

// DefaultSessionPolicy matches the spec's F1.5 lifetimes, with the idle timeout
// from the frontend's existing sessionTimeoutMinutes setting.
var DefaultSessionPolicy = SessionPolicy{AbsoluteDays: 30, IdleMinutes: 30, RenewWithinDays: 7}

// touchInterval throttles last_activity_at writes. Without it every
// authenticated request becomes a write. The cost is that idle expiry is
// accurate to within one interval, which is stated in the setting's help text.
const touchInterval = 60 * time.Second

// IssueOptions describes the session being created.
type IssueOptions struct {
	SubjectID string
	IPAddress string
	UserAgent string
	// AuthMethod is PASSWORD, SSO or RECOVERY_CODE.
	AuthMethod string
	// MFASatisfied records that a challenge was completed. A session is only
	// ever created after MFA succeeds, so this is true whenever MFA applied.
	MFASatisfied bool
	// ActiveTenantID is a UI convenience on the customer plane, never used for
	// authorization.
	ActiveTenantID string
}

// IssuedSession carries the values handed to the client. The raw token and CSRF
// token exist only here and in the response cookies; the database holds digests.
type IssuedSession struct {
	SessionID string
	Token     string
	CSRFToken string
	ExpiresAt time.Time
}

// IssueSession creates a session row inside the caller's transaction.
func IssueSession(ctx context.Context, tx *sql.Tx, plane Plane, policy SessionPolicy, opts IssueOptions) (*IssuedSession, error) {
	token, tokenHash, err := crypto.NewOpaqueToken()
	if err != nil {
		return nil, err
	}
	csrfToken, csrfHash, err := crypto.NewOpaqueToken()
	if err != nil {
		return nil, err
	}

	if policy.AbsoluteDays <= 0 {
		policy.AbsoluteDays = DefaultSessionPolicy.AbsoluteDays
	}
	expiresAt := Now().UTC().Add(time.Duration(policy.AbsoluteDays) * 24 * time.Hour)

	authMethod := opts.AuthMethod
	if authMethod == "" {
		authMethod = "PASSWORD"
	}
	var mfaSatisfiedAt any
	if opts.MFASatisfied {
		mfaSatisfiedAt = Now().UTC()
	}

	// issued_at and last_activity_at are written explicitly from the Go clock
	// rather than left to the column default, so every session timestamp comes
	// from one source and idle expiry cannot be skewed by API/database drift.
	issuedAt := Now().UTC()

	columns := "(" + plane.SubjectColumn + ", token_hash, csrf_token_hash, expires_at, mfa_satisfied_at, auth_method, ip_address, user_agent, issued_at, last_activity_at"
	values := "($1, $2, $3, $4, $5, $6, NULLIF($7,'')::inet, NULLIF($8,''), $9, $9"
	args := []any{opts.SubjectID, tokenHash, csrfHash, expiresAt, mfaSatisfiedAt, authMethod, opts.IPAddress, opts.UserAgent, issuedAt}

	if plane.HasTenantContext {
		columns += ", active_tenant_id"
		values += ", $10"
		args = append(args, nullIfEmpty(opts.ActiveTenantID))
	}
	columns += ")"
	values += ")"

	query := fmt.Sprintf(`INSERT INTO %s %s VALUES %s RETURNING id`, plane.SessionsTable, columns, values)

	var sessionID string
	if err := tx.QueryRowContext(ctx, query, args...).Scan(&sessionID); err != nil {
		return nil, fmt.Errorf("issue session: %w", err)
	}

	return &IssuedSession{
		SessionID: sessionID,
		Token:     token,
		CSRFToken: csrfToken,
		ExpiresAt: expiresAt,
	}, nil
}

// LookupSession resolves a raw session token to its principal.
//
// The token is only ever matched in this plane's sessions table, which is what
// makes cross-plane isolation structural: a customer token presented on an admin
// route does not exist here, so it cannot be mistaken for a weaker credential.
func LookupSession(ctx context.Context, sqlDB *sql.DB, plane Plane, rawToken string, policy SessionPolicy) (*Principal, error) {
	if rawToken == "" {
		return nil, ErrNoSession
	}

	tenantColumn := "NULL::uuid"
	if plane.HasTenantContext {
		tenantColumn = "s.active_tenant_id"
	}

	query := fmt.Sprintf(`
		SELECT s.id, s.%s, s.issued_at, s.expires_at, s.last_activity_at,
		       s.revoked_at, s.mfa_satisfied_at, s.auth_method,
		       COALESCE(s.csrf_token_hash,''), %s,
		       u.email, COALESCE(u.display_name, ''), u.status
		FROM %s s
		JOIN %s u ON u.id = s.%s
		WHERE s.token_hash = $1 AND u.deleted_at IS NULL
	`, plane.SubjectColumn, tenantColumn, plane.SessionsTable, plane.UsersTable, plane.SubjectColumn)

	var (
		sessionID, subjectID, email, name, status, authMethod string
		csrfTokenHash                                         string
		issuedAt, expiresAt, lastActivityAt                   time.Time
		revokedAt, mfaSatisfiedAt                             sql.NullTime
		activeTenantID                                        sql.NullString
	)

	err := sqlDB.QueryRowContext(ctx, query, crypto.HashToken(rawToken)).Scan(
		&sessionID, &subjectID, &issuedAt, &expiresAt, &lastActivityAt,
		&revokedAt, &mfaSatisfiedAt, &authMethod, &csrfTokenHash, &activeTenantID,
		&email, &name, &status,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNoSession
	}
	if err != nil {
		return nil, fmt.Errorf("look up session: %w", err)
	}

	now := Now().UTC()

	if revokedAt.Valid {
		return nil, ErrSessionExpired
	}
	if !expiresAt.After(now) {
		return nil, ErrSessionExpired
	}
	// Distinguished from absolute expiry so the client can explain why, and so
	// an idle timeout does not look like a bug to the person it logs out.
	idleExpiresAt := idleDeadline(lastActivityAt, policy)
	if !idleExpiresAt.IsZero() && !idleExpiresAt.After(now) {
		return nil, ErrSessionIdle
	}
	if status != "ACTIVE" {
		return nil, ErrAccountDisabled
	}

	return &Principal{
		Plane:          plane,
		SubjectID:      subjectID,
		Email:          email,
		Name:           name,
		SessionID:      sessionID,
		CSRFTokenHash:  csrfTokenHash,
		IssuedAt:       issuedAt.UTC(),
		ExpiresAt:      expiresAt.UTC(),
		LastActivityAt: lastActivityAt.UTC(),
		IdleExpiresAt:  idleExpiresAt,
		MFASatisfied:   mfaSatisfiedAt.Valid,
		AuthMethod:     authMethod,
		ActiveTenantID: activeTenantID.String,
		Permissions:    map[string]struct{}{},
	}, nil
}

// TouchSession records activity and applies sliding renewal.
//
// Both are throttled to one write per touchInterval, so a burst of requests
// costs a single update. Failures are returned but callers treat them as
// non-fatal: a missed activity bump must not fail the request it accompanies.
func TouchSession(ctx context.Context, sqlDB *sql.DB, plane Plane, p *Principal, policy SessionPolicy) error {
	now := Now().UTC()
	if now.Sub(p.LastActivityAt) < touchInterval {
		return nil
	}

	// Renew only when the session is close enough to expiry to be worth it,
	// rather than pushing the horizon on every request.
	renew := policy.RenewWithinDays > 0 &&
		p.ExpiresAt.Sub(now) < time.Duration(policy.RenewWithinDays)*24*time.Hour

	// Timestamps come from the Go clock rather than SQL now(), so every session
	// time is written and compared against the same source. Mixing the two would
	// make idle expiry depend on clock drift between the API and the database.
	query := fmt.Sprintf(`UPDATE %s SET last_activity_at = $2 WHERE id = $1 AND revoked_at IS NULL`, plane.SessionsTable)
	args := []any{p.SessionID, now}

	if renew {
		absolute := policy.AbsoluteDays
		if absolute <= 0 {
			absolute = DefaultSessionPolicy.AbsoluteDays
		}
		newExpiry := now.Add(time.Duration(absolute) * 24 * time.Hour)
		query = fmt.Sprintf(`
			UPDATE %s SET last_activity_at = $2, expires_at = $3, renewed_at = $2
			WHERE id = $1 AND revoked_at IS NULL
		`, plane.SessionsTable)
		args = append(args, newExpiry)
		p.ExpiresAt = newExpiry
	}

	if _, err := sqlDB.ExecContext(ctx, query, args...); err != nil {
		return fmt.Errorf("touch session: %w", err)
	}
	p.LastActivityAt = now
	p.IdleExpiresAt = idleDeadline(now, policy)
	return nil
}

// RevokeSession ends one session.
func RevokeSession(ctx context.Context, tx *sql.Tx, plane Plane, sessionID, reason string) error {
	query := fmt.Sprintf(`
		UPDATE %s SET revoked_at = now(), revoked_reason = $2
		WHERE id = $1 AND revoked_at IS NULL
	`, plane.SessionsTable)
	if _, err := tx.ExecContext(ctx, query, sessionID, reason); err != nil {
		return fmt.Errorf("revoke session: %w", err)
	}
	return nil
}

// RevokeSessionsForSubject ends every live session for one identity.
//
// exceptSessionID keeps the caller's own session alive — used for a password
// change, where signing yourself out of the page you are on is hostile. Pass an
// empty string for a password reset or suspension, where everything must go.
func RevokeSessionsForSubject(ctx context.Context, tx *sql.Tx, plane Plane, subjectID, exceptSessionID, reason string) (int64, error) {
	query := fmt.Sprintf(`
		UPDATE %s SET revoked_at = now(), revoked_reason = $2
		WHERE %s = $1 AND revoked_at IS NULL AND ($3 = '' OR id <> $3::uuid)
	`, plane.SessionsTable, plane.SubjectColumn)

	result, err := tx.ExecContext(ctx, query, subjectID, reason, exceptSessionID)
	if err != nil {
		return 0, fmt.Errorf("revoke sessions: %w", err)
	}
	count, _ := result.RowsAffected()
	return count, nil
}

// SessionSummary describes a live session for the account-security screen.
type SessionSummary struct {
	ID             string
	IPAddress      string
	UserAgent      string
	AuthMethod     string
	IssuedAt       time.Time
	LastActivityAt time.Time
	ExpiresAt      time.Time
}

// ListSessions returns a subject's live sessions, most recently active first.
func ListSessions(ctx context.Context, sqlDB *sql.DB, plane Plane, subjectID string) ([]SessionSummary, error) {
	query := fmt.Sprintf(`
		SELECT id, COALESCE(host(ip_address),''), COALESCE(user_agent,''), auth_method,
		       issued_at, last_activity_at, expires_at
		FROM %s
		WHERE %s = $1 AND revoked_at IS NULL AND expires_at > now()
		ORDER BY last_activity_at DESC
	`, plane.SessionsTable, plane.SubjectColumn)

	rows, err := sqlDB.QueryContext(ctx, query, subjectID)
	if err != nil {
		return nil, fmt.Errorf("list sessions: %w", err)
	}
	defer rows.Close()

	var sessions []SessionSummary
	for rows.Next() {
		var s SessionSummary
		if err := rows.Scan(&s.ID, &s.IPAddress, &s.UserAgent, &s.AuthMethod,
			&s.IssuedAt, &s.LastActivityAt, &s.ExpiresAt); err != nil {
			return nil, fmt.Errorf("scan session: %w", err)
		}
		sessions = append(sessions, s)
	}
	return sessions, rows.Err()
}

// SessionBelongsTo reports whether a session is the subject's own.
//
// Callers answer "no" with 404 rather than 403: a distinct response would
// confirm that somebody else's session id exists.
func SessionBelongsTo(ctx context.Context, sqlDB *sql.DB, plane Plane, sessionID, subjectID string) (bool, error) {
	// The id comes from a URL path. Checked here so malformed input is "not
	// found" rather than a Postgres cast error surfacing as a 500.
	if !isUUID(sessionID) {
		return false, nil
	}

	query := fmt.Sprintf(`SELECT 1 FROM %s WHERE id = $1 AND %s = $2`, plane.SessionsTable, plane.SubjectColumn)

	var one int
	err := sqlDB.QueryRowContext(ctx, query, sessionID, subjectID).Scan(&one)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("check session ownership: %w", err)
	}
	return true, nil
}

func idleDeadline(lastActivityAt time.Time, policy SessionPolicy) time.Time {
	if policy.IdleMinutes <= 0 {
		return time.Time{}
	}
	return lastActivityAt.UTC().Add(time.Duration(policy.IdleMinutes) * time.Minute)
}

// isUUID validates the canonical 8-4-4-4-12 hex form.
func isUUID(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i, c := range s {
		switch i {
		case 8, 13, 18, 23:
			if c != '-' {
				return false
			}
		default:
			isHex := (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')
			if !isHex {
				return false
			}
		}
	}
	return true
}

func nullIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}
