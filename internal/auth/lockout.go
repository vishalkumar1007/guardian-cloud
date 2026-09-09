package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"math"
	"time"
)

// Lockout scopes. Counting by account and by source address independently means
// neither spreading attempts across many accounts from one host, nor across many
// hosts against one account, slips under the limit.
const (
	ScopeAccount = "ACCOUNT"
	ScopeIP      = "IP"
)

// LockoutPolicy is read from platform_settings.
type LockoutPolicy struct {
	// MaxFailures within Window trips a lockout.
	MaxFailures int
	Window      time.Duration
	// BaseDuration is the first lockout's length; it doubles with each
	// successive lockout for the same subject, up to MaxDuration.
	BaseDuration time.Duration
	MaxDuration  time.Duration
}

// DefaultLockoutPolicy implements the spec's "exponential backoff after 5
// failures in 10 minutes".
var DefaultLockoutPolicy = LockoutPolicy{
	MaxFailures:  5,
	Window:       10 * time.Minute,
	BaseDuration: 5 * time.Minute,
	MaxDuration:  60 * time.Minute,
}

// CheckLockout reports whether either key is currently locked.
//
// Returns a *LockedError carrying the wait, so the caller can tell the client
// how long to wait rather than leaving them to guess.
func CheckLockout(ctx context.Context, sqlDB *sql.DB, plane Plane, emailKey, ipKey string) error {
	rows, err := sqlDB.QueryContext(ctx, `
		SELECT locked_until FROM account_lockouts
		WHERE plane = $1
		  AND locked_until IS NOT NULL AND locked_until > now()
		  AND ((scope = 'ACCOUNT' AND subject_key = $2) OR (scope = 'IP' AND subject_key = $3))
	`, plane.Name, emailKey, ipKey)
	if err != nil {
		return fmt.Errorf("check lockout: %w", err)
	}
	defer rows.Close()

	var longest time.Time
	for rows.Next() {
		var lockedUntil time.Time
		if err := rows.Scan(&lockedUntil); err != nil {
			return fmt.Errorf("scan lockout: %w", err)
		}
		if lockedUntil.After(longest) {
			longest = lockedUntil
		}
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("read lockouts: %w", err)
	}

	if longest.IsZero() {
		return nil
	}
	retryAfter := int(math.Ceil(time.Until(longest).Seconds()))
	if retryAfter < 1 {
		retryAfter = 1
	}
	return &LockedError{RetryAfterSeconds: retryAfter}
}

// RecordFailure increments both counters and trips a lockout at the threshold.
//
// A failure outside the window restarts the count rather than accumulating
// forever, so an occasional typo months apart never locks anyone out.
func RecordFailure(ctx context.Context, tx *sql.Tx, plane Plane, policy LockoutPolicy, emailKey, ipKey string) error {
	for scope, key := range map[string]string{ScopeAccount: emailKey, ScopeIP: ipKey} {
		if key == "" {
			continue
		}
		if err := recordFailureFor(ctx, tx, plane, policy, scope, key); err != nil {
			return err
		}
	}
	return nil
}

func recordFailureFor(ctx context.Context, tx *sql.Tx, plane Plane, policy LockoutPolicy, scope, key string) error {
	if policy.MaxFailures <= 0 {
		policy = DefaultLockoutPolicy
	}

	// Lock the row first so two concurrent failures cannot both read the same
	// count and each write back the same increment.
	var failureCount, lockoutCount int
	var firstFailureAt time.Time
	err := tx.QueryRowContext(ctx, `
		SELECT failure_count, lockout_count, first_failure_at
		FROM account_lockouts
		WHERE plane = $1 AND scope = $2 AND subject_key = $3
		FOR UPDATE
	`, plane.Name, scope, key).Scan(&failureCount, &lockoutCount, &firstFailureAt)

	switch {
	case errors.Is(err, sql.ErrNoRows):
		_, err = tx.ExecContext(ctx, `
			INSERT INTO account_lockouts (plane, scope, subject_key, failure_count)
			VALUES ($1, $2, $3, 1)
			ON CONFLICT (plane, scope, subject_key) DO UPDATE
			SET failure_count = account_lockouts.failure_count + 1, last_failure_at = now()
		`, plane.Name, scope, key)
		if err != nil {
			return fmt.Errorf("record first failure: %w", err)
		}
		return nil
	case err != nil:
		return fmt.Errorf("read lockout counter: %w", err)
	}

	if Now().UTC().Sub(firstFailureAt.UTC()) > policy.Window {
		failureCount = 0
		_, err = tx.ExecContext(ctx, `
			UPDATE account_lockouts
			SET failure_count = 1, first_failure_at = now(), last_failure_at = now()
			WHERE plane = $1 AND scope = $2 AND subject_key = $3
		`, plane.Name, scope, key)
		if err != nil {
			return fmt.Errorf("reset lockout window: %w", err)
		}
		return nil
	}

	failureCount++
	if failureCount < policy.MaxFailures {
		_, err = tx.ExecContext(ctx, `
			UPDATE account_lockouts
			SET failure_count = $4, last_failure_at = now()
			WHERE plane = $1 AND scope = $2 AND subject_key = $3
		`, plane.Name, scope, key, failureCount)
		if err != nil {
			return fmt.Errorf("increment failure count: %w", err)
		}
		return nil
	}

	// Threshold reached: lock, and reset the counter so the next window starts
	// clean once the lock lifts.
	lockDuration := backoff(policy, lockoutCount)
	_, err = tx.ExecContext(ctx, `
		UPDATE account_lockouts
		SET failure_count = 0,
		    lockout_count = lockout_count + 1,
		    first_failure_at = now(),
		    last_failure_at = now(),
		    locked_until = now() + $4::interval
		WHERE plane = $1 AND scope = $2 AND subject_key = $3
	`, plane.Name, scope, key, fmt.Sprintf("%d seconds", int(lockDuration.Seconds())))
	if err != nil {
		return fmt.Errorf("apply lockout: %w", err)
	}
	return nil
}

// ClearFailures resets both counters after a successful authentication, so an
// earlier run of typos does not count against a later session.
func ClearFailures(ctx context.Context, tx *sql.Tx, plane Plane, emailKey, ipKey string) error {
	_, err := tx.ExecContext(ctx, `
		UPDATE account_lockouts
		SET failure_count = 0, lockout_count = 0, locked_until = NULL
		WHERE plane = $1
		  AND ((scope = 'ACCOUNT' AND subject_key = $2) OR (scope = 'IP' AND subject_key = $3))
	`, plane.Name, emailKey, ipKey)
	if err != nil {
		return fmt.Errorf("clear lockout counters: %w", err)
	}
	return nil
}

// backoff doubles the lockout duration for each previous lockout, capped so a
// determined attacker cannot push a legitimate user's wait out indefinitely.
func backoff(policy LockoutPolicy, priorLockouts int) time.Duration {
	base := policy.BaseDuration
	if base <= 0 {
		base = DefaultLockoutPolicy.BaseDuration
	}
	maxDuration := policy.MaxDuration
	if maxDuration <= 0 {
		maxDuration = DefaultLockoutPolicy.MaxDuration
	}

	// Bound the shift before applying it; 1<<62 overflows a Duration.
	if priorLockouts > 16 {
		priorLockouts = 16
	}
	duration := base * time.Duration(1<<uint(priorLockouts))
	if duration > maxDuration || duration <= 0 {
		return maxDuration
	}
	return duration
}

// RecordAttempt appends to the append-only login_attempts trail. This is
// operator visibility, separate from the lockout counters that do enforcement.
func RecordAttempt(ctx context.Context, tx *sql.Tx, plane Plane, email, subjectID, outcome, ip, userAgent, requestID string) error {
	_, err := tx.ExecContext(ctx, `
		INSERT INTO login_attempts (plane, email, subject_id, outcome, ip_address, user_agent, request_id)
		VALUES ($1, NULLIF($2,''), $3, $4, NULLIF($5,'')::inet, NULLIF($6,''), NULLIF($7,''))
	`, plane.Name, email, nullIfEmpty(subjectID), outcome, ip, userAgent, requestID)
	if err != nil {
		return fmt.Errorf("record login attempt: %w", err)
	}
	return nil
}
