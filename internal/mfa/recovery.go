package mfa

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"strings"

	"guardian-cloud/internal/crypto"
)

const (
	// RecoveryCodeCount is how many codes are issued per enrolment. Enough that
	// losing a few is survivable, few enough to print on one card.
	RecoveryCodeCount = 10

	// recoveryCodeChars is the number of base32 characters per code. 16 chars is
	// 80 bits of entropy, comfortably beyond offline brute force, which is what
	// lets these be stored as a plain SHA-256 digest and matched by index.
	recoveryCodeChars = 16
	recoveryGroupSize = 4
)

// recoveryAlphabet is Crockford-style base32: no I, L, O or U, so a code read
// off a screen and typed by hand cannot be misread as a similar character.
const recoveryAlphabet = "ABCDEFGHJKMNPQRSTVWXYZ0123456789"

// GenerateRecoveryCodes returns fresh codes in display form. The caller shows
// them to the user exactly once and stores only their digests.
func GenerateRecoveryCodes() ([]string, error) {
	codes := make([]string, 0, RecoveryCodeCount)
	for i := 0; i < RecoveryCodeCount; i++ {
		code, err := newRecoveryCode()
		if err != nil {
			return nil, err
		}
		codes = append(codes, code)
	}
	return codes, nil
}

func newRecoveryCode() (string, error) {
	buf := make([]byte, recoveryCodeChars)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("generate recovery code: %w", err)
	}

	var sb strings.Builder
	for i, b := range buf {
		if i > 0 && i%recoveryGroupSize == 0 {
			sb.WriteByte('-')
		}
		// len(recoveryAlphabet) is 32, an exact divisor of 256, so the modulo
		// introduces no bias.
		sb.WriteByte(recoveryAlphabet[int(b)%len(recoveryAlphabet)])
	}
	return sb.String(), nil
}

// NormalizeRecoveryCode strips formatting so a code typed with or without
// dashes, in any case, matches what was stored.
func NormalizeRecoveryCode(code string) string {
	return strings.ToUpper(strings.ReplaceAll(strings.TrimSpace(code), "-", ""))
}

// ReplaceRecoveryCodes swaps a subject's codes for a new set, inside the
// caller's transaction. Regenerating always invalidates every previous code,
// including unused ones — otherwise "regenerate" would leave old paper copies
// live and the user would have no way to know.
func ReplaceRecoveryCodes(ctx context.Context, tx *sql.Tx, plane, subjectID string, codes []string) error {
	if _, err := tx.ExecContext(ctx,
		`DELETE FROM mfa_recovery_codes WHERE plane = $1 AND subject_id = $2`,
		plane, subjectID,
	); err != nil {
		return fmt.Errorf("clear recovery codes: %w", err)
	}

	for _, code := range codes {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO mfa_recovery_codes (plane, subject_id, code_hash)
			VALUES ($1, $2, $3)
		`, plane, subjectID, crypto.HashToken(NormalizeRecoveryCode(code))); err != nil {
			return fmt.Errorf("store recovery code: %w", err)
		}
	}
	return nil
}

// ConsumeRecoveryCode spends one code, returning whether it was valid.
//
// The UPDATE ... WHERE used_at IS NULL RETURNING is what makes this single-use
// under concurrency: two simultaneous attempts with the same code produce one
// affected row and one miss, with no read-then-write race.
func ConsumeRecoveryCode(ctx context.Context, tx *sql.Tx, plane, subjectID, code string) (bool, error) {
	normalized := NormalizeRecoveryCode(code)
	if normalized == "" {
		return false, nil
	}

	var id string
	err := tx.QueryRowContext(ctx, `
		UPDATE mfa_recovery_codes SET used_at = now()
		WHERE plane = $1 AND subject_id = $2 AND code_hash = $3 AND used_at IS NULL
		RETURNING id
	`, plane, subjectID, crypto.HashToken(normalized)).Scan(&id)

	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("consume recovery code: %w", err)
	}
	return true, nil
}

// CountUnusedRecoveryCodes powers the "n codes remaining" hint, which is how a
// user learns to regenerate before running out.
func CountUnusedRecoveryCodes(ctx context.Context, sqlDB *sql.DB, plane, subjectID string) (int, error) {
	var count int
	err := sqlDB.QueryRowContext(ctx, `
		SELECT count(*) FROM mfa_recovery_codes
		WHERE plane = $1 AND subject_id = $2 AND used_at IS NULL
	`, plane, subjectID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count recovery codes: %w", err)
	}
	return count, nil
}
