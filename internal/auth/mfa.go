package auth

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

// MFAMethod is one enrolled second factor.
//
// SecretRef holds the sealed secret and is never serialised to a client; the
// handler layer projects only the descriptive fields.
type MFAMethod struct {
	ID         string
	MethodType string
	Label      string
	IsPrimary  bool
	SecretRef  string
	VerifiedAt *time.Time
	LastUsedAt *time.Time
	CreatedAt  time.Time
}

// ListMFAMethods returns a subject's verified, unrevoked methods.
//
// Unverified enrolments are excluded deliberately: an abandoned enrolment must
// not count towards "this account has MFA" or it would lock the owner out.
func ListMFAMethods(ctx context.Context, sqlDB *sql.DB, plane Plane, subjectID string) ([]MFAMethod, error) {
	query := fmt.Sprintf(`
		SELECT id, method_type, COALESCE(label,''), is_primary, secret_ref,
		       verified_at, last_used_at, created_at
		FROM %s
		WHERE %s = $1 AND revoked_at IS NULL AND verified_at IS NOT NULL
		ORDER BY is_primary DESC, created_at ASC
	`, plane.MFATable, plane.SubjectColumn)

	rows, err := sqlDB.QueryContext(ctx, query, subjectID)
	if err != nil {
		return nil, fmt.Errorf("list mfa methods: %w", err)
	}
	defer rows.Close()

	var methods []MFAMethod
	for rows.Next() {
		var m MFAMethod
		var verifiedAt, lastUsedAt sql.NullTime
		if err := rows.Scan(&m.ID, &m.MethodType, &m.Label, &m.IsPrimary, &m.SecretRef,
			&verifiedAt, &lastUsedAt, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan mfa method: %w", err)
		}
		if verifiedAt.Valid {
			t := verifiedAt.Time.UTC()
			m.VerifiedAt = &t
		}
		if lastUsedAt.Valid {
			t := lastUsedAt.Time.UTC()
			m.LastUsedAt = &t
		}
		methods = append(methods, m)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read mfa methods: %w", err)
	}
	return methods, nil
}

// GetMFAMethod loads one method, scoped to its owner so a caller cannot address
// somebody else's enrolment by guessing an id.
func GetMFAMethod(ctx context.Context, sqlDB *sql.DB, plane Plane, subjectID, methodID string) (*MFAMethod, error) {
	query := fmt.Sprintf(`
		SELECT id, method_type, COALESCE(label,''), is_primary, secret_ref,
		       verified_at, last_used_at, created_at
		FROM %s
		WHERE id = $1 AND %s = $2 AND revoked_at IS NULL
	`, plane.MFATable, plane.SubjectColumn)

	var m MFAMethod
	var verifiedAt, lastUsedAt sql.NullTime
	err := sqlDB.QueryRowContext(ctx, query, methodID, subjectID).Scan(
		&m.ID, &m.MethodType, &m.Label, &m.IsPrimary, &m.SecretRef,
		&verifiedAt, &lastUsedAt, &m.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, sql.ErrNoRows
	}
	if err != nil {
		return nil, fmt.Errorf("get mfa method: %w", err)
	}
	if verifiedAt.Valid {
		t := verifiedAt.Time.UTC()
		m.VerifiedAt = &t
	}
	if lastUsedAt.Valid {
		t := lastUsedAt.Time.UTC()
		m.LastUsedAt = &t
	}
	return &m, nil
}

// CreateMFAMethod records an unverified enrolment. It becomes usable only once
// the owner proves possession by submitting a correct code.
func CreateMFAMethod(ctx context.Context, tx *sql.Tx, plane Plane, subjectID, methodType, label, secretRef string) (string, error) {
	query := fmt.Sprintf(`
		INSERT INTO %s (%s, method_type, label, secret_ref)
		VALUES ($1, $2, NULLIF($3,''), $4)
		RETURNING id
	`, plane.MFATable, plane.SubjectColumn)

	var id string
	if err := tx.QueryRowContext(ctx, query, subjectID, methodType, label, secretRef).Scan(&id); err != nil {
		return "", fmt.Errorf("create mfa method: %w", err)
	}
	return id, nil
}

// UpdateMFASecret stores the sealed secret for an enrolment.
//
// Separate from creation because the seal is bound to the method id as
// additional authenticated data, so the row must exist before its secret can be
// sealed. That binding is what stops a sealed secret being moved to another row.
func UpdateMFASecret(ctx context.Context, tx *sql.Tx, plane Plane, methodID, secretRef string) error {
	query := fmt.Sprintf(`UPDATE %s SET secret_ref = $2 WHERE id = $1`, plane.MFATable)
	if _, err := tx.ExecContext(ctx, query, methodID, secretRef); err != nil {
		return fmt.Errorf("update mfa secret: %w", err)
	}
	return nil
}

// VerifyMFAMethod marks an enrolment complete. The first verified method for a
// subject becomes primary, so there is always exactly one default.
func VerifyMFAMethod(ctx context.Context, tx *sql.Tx, plane Plane, subjectID, methodID string) error {
	query := fmt.Sprintf(`
		UPDATE %s SET verified_at = now(),
		    is_primary = NOT EXISTS (
		        SELECT 1 FROM %s
		        WHERE %s = $2 AND id <> $1 AND revoked_at IS NULL AND verified_at IS NOT NULL
		    )
		WHERE id = $1 AND %s = $2 AND revoked_at IS NULL
	`, plane.MFATable, plane.MFATable, plane.SubjectColumn, plane.SubjectColumn)

	if _, err := tx.ExecContext(ctx, query, methodID, subjectID); err != nil {
		return fmt.Errorf("verify mfa method: %w", err)
	}
	return nil
}

// TouchMFAMethod records a successful use, which is what makes "last used"
// meaningful on the security page.
func TouchMFAMethod(ctx context.Context, tx *sql.Tx, plane Plane, methodID string) error {
	query := fmt.Sprintf(`UPDATE %s SET last_used_at = now() WHERE id = $1`, plane.MFATable)
	if _, err := tx.ExecContext(ctx, query, methodID); err != nil {
		return fmt.Errorf("touch mfa method: %w", err)
	}
	return nil
}

// RevokeMFAMethod removes one enrolment.
func RevokeMFAMethod(ctx context.Context, tx *sql.Tx, plane Plane, subjectID, methodID string) error {
	query := fmt.Sprintf(`
		UPDATE %s SET revoked_at = now(), is_primary = false
		WHERE id = $1 AND %s = $2 AND revoked_at IS NULL
	`, plane.MFATable, plane.SubjectColumn)
	if _, err := tx.ExecContext(ctx, query, methodID, subjectID); err != nil {
		return fmt.Errorf("revoke mfa method: %w", err)
	}
	return nil
}

// RevokeAllMFAMethods clears every enrolment, used by the IAM "reset MFA"
// action when someone loses their authenticator.
func RevokeAllMFAMethods(ctx context.Context, tx *sql.Tx, plane Plane, subjectID string) error {
	query := fmt.Sprintf(`
		UPDATE %s SET revoked_at = now(), is_primary = false
		WHERE %s = $1 AND revoked_at IS NULL
	`, plane.MFATable, plane.SubjectColumn)
	if _, err := tx.ExecContext(ctx, query, subjectID); err != nil {
		return fmt.Errorf("revoke mfa methods: %w", err)
	}
	return nil
}

// CountVerifiedMFAMethods counts usable factors.
//
// lockSubject serialises concurrent callers by taking a row lock on the owner
// first. The "you cannot remove your last factor" check needs it: without
// serialisation two simultaneous deletions each see two methods, each decide
// they are not the last, and the account ends up with none.
//
// The lock is taken on the owner rather than on the methods because Postgres
// does not allow FOR UPDATE alongside an aggregate.
func CountVerifiedMFAMethods(ctx context.Context, tx *sql.Tx, plane Plane, subjectID string, lockSubject bool) (int, error) {
	if lockSubject {
		lock := fmt.Sprintf(`SELECT 1 FROM %s WHERE id = $1 FOR UPDATE`, plane.UsersTable)
		var one int
		if err := tx.QueryRowContext(ctx, lock, subjectID).Scan(&one); err != nil {
			return 0, fmt.Errorf("lock subject for mfa count: %w", err)
		}
	}

	query := fmt.Sprintf(`
		SELECT count(*) FROM %s
		WHERE %s = $1 AND revoked_at IS NULL AND verified_at IS NOT NULL
	`, plane.MFATable, plane.SubjectColumn)

	var count int
	if err := tx.QueryRowContext(ctx, query, subjectID).Scan(&count); err != nil {
		return 0, fmt.Errorf("count mfa methods: %w", err)
	}
	return count, nil
}
