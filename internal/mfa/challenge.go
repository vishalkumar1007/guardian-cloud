package mfa

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"guardian-cloud/internal/crypto"
)

// Challenge purposes.
const (
	PurposeLogin      = "LOGIN"
	PurposeEnrollment = "ENROLLMENT"
	PurposeStepUp     = "STEP_UP"
)

// MaxChallengeAttempts bounds guesses against a single challenge. Six digits is
// a million possibilities, but a challenge lives for minutes and an unbounded
// retry loop would still be worth an attacker's time.
const MaxChallengeAttempts = 5

// ChallengeTTL is how long a half-authenticated state may persist.
const ChallengeTTL = 5 * time.Minute

var (
	ErrChallengeNotFound = errors.New("mfa: challenge not found")
	ErrChallengeExpired  = errors.New("mfa: challenge expired or already used")
	ErrTooManyAttempts   = errors.New("mfa: too many attempts")
)

// Challenge is a pending second-factor verification.
//
// It deliberately lives in its own table rather than as a flag on a session row:
// nothing that reads sessions can mistake it for an authenticated caller.
type Challenge struct {
	ID           string
	Plane        string
	SubjectID    string
	Purpose      string
	EmailCodeRef string
	Attempts     int
	ExpiresAt    time.Time
}

// IssueChallenge creates a pending challenge and returns the raw token for the
// short-lived challenge cookie.
//
// emailCodeRef holds a sealed emailed one-time code, or "" when the code will be
// derived from an enrolled TOTP secret.
func IssueChallenge(ctx context.Context, tx *sql.Tx, plane, subjectID, purpose, emailCodeRef, ip, userAgent string) (string, string, error) {
	token, tokenHash, err := crypto.NewOpaqueToken()
	if err != nil {
		return "", "", err
	}

	var id string
	err = tx.QueryRowContext(ctx, `
		INSERT INTO mfa_challenges
			(plane, subject_id, token_hash, purpose, email_code_ref, expires_at, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, NULLIF($5,''), now() + $6::interval, NULLIF($7,'')::inet, NULLIF($8,''))
		RETURNING id
	`,
		plane, subjectID, tokenHash, purpose, emailCodeRef,
		fmt.Sprintf("%d seconds", int(ChallengeTTL.Seconds())), ip, userAgent,
	).Scan(&id)
	if err != nil {
		return "", "", fmt.Errorf("issue mfa challenge: %w", err)
	}
	return token, id, nil
}

// LoadChallenge resolves a raw challenge token.
//
// Expiry and prior consumption both surface as ErrChallengeExpired: a replayed
// token and a stale one are the same story to the client, and telling them apart
// would confirm that a token was once valid.
func LoadChallenge(ctx context.Context, sqlDB *sql.DB, plane, rawToken string) (*Challenge, error) {
	if rawToken == "" {
		return nil, ErrChallengeNotFound
	}

	var (
		c            Challenge
		emailCodeRef sql.NullString
		consumedAt   sql.NullTime
	)
	err := sqlDB.QueryRowContext(ctx, `
		SELECT id, plane, subject_id, purpose, email_code_ref, attempts, expires_at, consumed_at
		FROM mfa_challenges
		WHERE token_hash = $1 AND plane = $2
	`, crypto.HashToken(rawToken), plane).Scan(
		&c.ID, &c.Plane, &c.SubjectID, &c.Purpose, &emailCodeRef, &c.Attempts, &c.ExpiresAt, &consumedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrChallengeNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("load mfa challenge: %w", err)
	}

	c.EmailCodeRef = emailCodeRef.String
	if consumedAt.Valid || !c.ExpiresAt.After(time.Now().UTC()) {
		return nil, ErrChallengeExpired
	}
	if c.Attempts >= MaxChallengeAttempts {
		return nil, ErrTooManyAttempts
	}
	return &c, nil
}

// RecordChallengeAttempt increments the guess counter. Called before verifying,
// so an attempt is counted even if the request is abandoned mid-flight.
func RecordChallengeAttempt(ctx context.Context, tx *sql.Tx, challengeID string) error {
	if _, err := tx.ExecContext(ctx,
		`UPDATE mfa_challenges SET attempts = attempts + 1 WHERE id = $1`,
		challengeID,
	); err != nil {
		return fmt.Errorf("record challenge attempt: %w", err)
	}
	return nil
}

// ConsumeChallenge marks a challenge spent.
//
// The WHERE consumed_at IS NULL guard makes it single-use under concurrency:
// two simultaneous submissions of the same valid code yield one success.
func ConsumeChallenge(ctx context.Context, tx *sql.Tx, challengeID string) error {
	var id string
	err := tx.QueryRowContext(ctx, `
		UPDATE mfa_challenges SET consumed_at = now()
		WHERE id = $1 AND consumed_at IS NULL
		RETURNING id
	`, challengeID).Scan(&id)

	if errors.Is(err, sql.ErrNoRows) {
		return ErrChallengeExpired
	}
	if err != nil {
		return fmt.Errorf("consume mfa challenge: %w", err)
	}
	return nil
}

// UpdateChallengeEmailCode replaces the sealed emailed code, for "resend".
// It also resets the attempt counter, since the codes being guessed are gone.
func UpdateChallengeEmailCode(ctx context.Context, tx *sql.Tx, challengeID, emailCodeRef string) error {
	if _, err := tx.ExecContext(ctx, `
		UPDATE mfa_challenges
		SET email_code_ref = $2, attempts = 0, expires_at = now() + $3::interval
		WHERE id = $1 AND consumed_at IS NULL
	`, challengeID, emailCodeRef, fmt.Sprintf("%d seconds", int(ChallengeTTL.Seconds()))); err != nil {
		return fmt.Errorf("update challenge code: %w", err)
	}
	return nil
}

// ExtendChallenge pushes expires_at forward by ChallengeTTL.
//
// Used when mid-login TOTP enrolment starts: scanning a QR and confirming a
// code routinely takes longer than the original login challenge window, and
// without this the verify step would fail with "authentication required"
// after the user already holds a valid authenticator code.
func ExtendChallenge(ctx context.Context, tx *sql.Tx, challengeID string) error {
	res, err := tx.ExecContext(ctx, `
		UPDATE mfa_challenges
		SET expires_at = now() + $2::interval
		WHERE id = $1 AND consumed_at IS NULL
	`, challengeID, fmt.Sprintf("%d seconds", int(ChallengeTTL.Seconds())))
	if err != nil {
		return fmt.Errorf("extend mfa challenge: %w", err)
	}
	n, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("extend mfa challenge rows: %w", err)
	}
	if n == 0 {
		return ErrChallengeExpired
	}
	return nil
}
