package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"guardian-cloud/internal/crypto"
)

// Identity is an account as loaded for authentication, together with its
// password credential.
type Identity struct {
	ID     string
	Email  string
	Name   string
	Status string

	EmailVerifiedAt *time.Time

	// MFARequired is the per-account override. The global policy is the floor:
	// an account may be forced to use MFA even when policy does not demand it,
	// but never exempted when it does.
	MFARequired bool

	CredentialID       string
	CredentialHash     string
	MustChangePassword bool
}

// HasPassword reports whether a usable password credential exists. An SSO-only
// account has none.
func (i *Identity) HasPassword() bool { return i.CredentialHash != "" }

// LoadIdentityByEmail resolves an account and its password credential.
//
// Returns ErrUnknownAccount when there is no match. Callers MUST still burn the
// equivalent CPU (see VerifyIdentityPassword) before responding, or the faster
// unknown-account path enumerates which addresses are registered.
func LoadIdentityByEmail(ctx context.Context, sqlDB *sql.DB, plane Plane, email string) (*Identity, error) {
	// Two columns exist only on the staff side: mfa_required on the account, and
	// must_change on the credential (staff receive admin-set passwords through
	// invitations). Both are selected as literal false on the customer plane so
	// one scan target serves both.
	mfaColumn, mustChangeColumn, mustChangeSource := "false", "false", "false"
	if plane.IsAdmin() {
		mfaColumn = "u.mfa_required"
		mustChangeColumn = "COALESCE(c.must_change, false)"
		mustChangeSource = "must_change"
	}

	// The credential join is LATERAL so an account with no password (SSO-only,
	// or invited but not yet accepted) still loads, and can be told apart from
	// an account that does not exist.
	query := fmt.Sprintf(`
		SELECT u.id, u.email, COALESCE(u.display_name,''), u.status, u.email_verified_at,
		       %s, COALESCE(c.id::text,''), COALESCE(c.secret_hash,''), %s
		FROM %s u
		LEFT JOIN LATERAL (
			SELECT id, secret_hash, %s AS must_change
			FROM %s
			WHERE %s = u.id AND credential_type = 'PASSWORD' AND revoked_at IS NULL
			ORDER BY created_at DESC
			LIMIT 1
		) c ON true
		WHERE u.email = $1 AND u.deleted_at IS NULL
	`,
		mfaColumn, mustChangeColumn,
		plane.UsersTable,
		mustChangeSource,
		plane.CredentialsTable, plane.SubjectColumn,
	)

	var (
		identity        Identity
		emailVerifiedAt sql.NullTime
	)
	err := sqlDB.QueryRowContext(ctx, query, NormalizeEmail(email)).Scan(
		&identity.ID, &identity.Email, &identity.Name, &identity.Status, &emailVerifiedAt,
		&identity.MFARequired, &identity.CredentialID, &identity.CredentialHash,
		&identity.MustChangePassword,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrUnknownAccount
	}
	if err != nil {
		return nil, fmt.Errorf("load identity: %w", err)
	}

	if emailVerifiedAt.Valid {
		t := emailVerifiedAt.Time.UTC()
		identity.EmailVerifiedAt = &t
	}
	return &identity, nil
}

// LoadIdentityByID resolves an account by primary key, for flows that already
// hold an identity (MFA challenge completion, SSO callback, password change).
func LoadIdentityByID(ctx context.Context, sqlDB *sql.DB, plane Plane, subjectID string) (*Identity, error) {
	mfaColumn := "false"
	if plane.IsAdmin() {
		mfaColumn = "mfa_required"
	}

	query := fmt.Sprintf(`
		SELECT id, email, COALESCE(display_name,''), status, email_verified_at, %s
		FROM %s WHERE id = $1 AND deleted_at IS NULL
	`, mfaColumn, plane.UsersTable)

	var (
		identity        Identity
		emailVerifiedAt sql.NullTime
	)
	err := sqlDB.QueryRowContext(ctx, query, subjectID).Scan(
		&identity.ID, &identity.Email, &identity.Name, &identity.Status,
		&emailVerifiedAt, &identity.MFARequired,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrUnknownAccount
	}
	if err != nil {
		return nil, fmt.Errorf("load identity: %w", err)
	}
	if emailVerifiedAt.Valid {
		t := emailVerifiedAt.Time.UTC()
		identity.EmailVerifiedAt = &t
	}
	return &identity, nil
}

// VerifyIdentityPassword checks a password against an identity.
//
// identity may be nil, meaning the address does not exist. In that case the
// password is still verified against a dummy hash so the unknown-account path
// costs the same wall time as a wrong password. Both return
// ErrInvalidCredentials, and callers must render both identically.
func VerifyIdentityPassword(identity *Identity, password string) error {
	if identity == nil || !identity.HasPassword() {
		crypto.ConstantTimeDummyVerify(password)
		return ErrInvalidCredentials
	}

	ok, err := crypto.VerifyPassword(password, identity.CredentialHash)
	if err != nil {
		// A malformed stored hash is a data problem, not a wrong password;
		// surfacing it as invalid credentials keeps it out of the client's view.
		return ErrInvalidCredentials
	}
	if !ok {
		return ErrInvalidCredentials
	}
	return nil
}

// CheckAccountStatus rejects accounts that exist but may not sign in.
func CheckAccountStatus(identity *Identity) error {
	switch identity.Status {
	case "ACTIVE":
		return nil
	case "SUSPENDED":
		return ErrAccountSuspended
	default:
		// DISABLED, PENDING, and anything a future migration adds.
		return ErrAccountDisabled
	}
}

// Decision is the outcome of the policy step of login.
type Decision string

const (
	// DecisionAuthenticated means a session may be issued immediately.
	DecisionAuthenticated Decision = "authenticated"
	// DecisionMFARequired means a challenge must be completed first.
	DecisionMFARequired Decision = "mfa_required"
	// DecisionMFAEnrollmentRequired means policy demands a second factor and
	// this account has none, so it must enrol before it can finish signing in.
	DecisionMFAEnrollmentRequired Decision = "mfa_enrollment_required"
)

// DecideMFA determines what has to happen after a correct password.
//
// policyRequires is the global requireMfa* setting. The account's own
// MFARequired flag can only tighten it, never relax it.
func DecideMFA(identity *Identity, enrolled []MFAMethod, policyRequires bool) Decision {
	if len(enrolled) > 0 {
		return DecisionMFARequired
	}
	if policyRequires || identity.MFARequired {
		return DecisionMFAEnrollmentRequired
	}
	return DecisionAuthenticated
}

// SetPassword replaces an identity's password credential inside the caller's
// transaction.
//
// The previous credential is revoked rather than deleted, so the history of when
// a password last changed survives in the audit trail.
func SetPassword(ctx context.Context, tx *sql.Tx, plane Plane, subjectID, password string) error {
	hash, err := crypto.HashPassword(password)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	revoke := fmt.Sprintf(`
		UPDATE %s SET revoked_at = now()
		WHERE %s = $1 AND credential_type = 'PASSWORD' AND revoked_at IS NULL
	`, plane.CredentialsTable, plane.SubjectColumn)
	if _, err := tx.ExecContext(ctx, revoke, subjectID); err != nil {
		return fmt.Errorf("revoke previous credential: %w", err)
	}

	insert := fmt.Sprintf(`
		INSERT INTO %s (%s, credential_type, secret_hash)
		VALUES ($1, 'PASSWORD', $2)
	`, plane.CredentialsTable, plane.SubjectColumn)
	if _, err := tx.ExecContext(ctx, insert, subjectID, hash); err != nil {
		return fmt.Errorf("store credential: %w", err)
	}
	return nil
}

// TouchCredential records a successful password use.
func TouchCredential(ctx context.Context, tx *sql.Tx, plane Plane, credentialID string) error {
	if credentialID == "" {
		return nil
	}
	query := fmt.Sprintf(`UPDATE %s SET last_used_at = now() WHERE id = $1`, plane.CredentialsTable)
	if _, err := tx.ExecContext(ctx, query, credentialID); err != nil {
		return fmt.Errorf("touch credential: %w", err)
	}
	return nil
}

// RecordLogin stamps the successful sign-in time shown in the IAM staff table.
func RecordLogin(ctx context.Context, tx *sql.Tx, plane Plane, subjectID string) error {
	if !plane.IsAdmin() {
		return nil // the customer users table has no last_login_at column
	}
	if _, err := tx.ExecContext(ctx,
		`UPDATE guardian_admin_users SET last_login_at = now() WHERE id = $1`, subjectID,
	); err != nil {
		return fmt.Errorf("record login time: %w", err)
	}
	return nil
}
