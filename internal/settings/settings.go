// Package settings reads and writes global platform policy.
//
// This is distinct from the admin_settings table, which stores per-user UI
// preferences. These keys govern authentication behaviour for everyone, so they
// are read on nearly every request and cached briefly in process.
package settings

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// Policy keys. Every key must appear in Defaults, which is what makes an unknown
// key on write a 400 rather than a silently ignored typo.
const (
	KeySessionTimeoutMinutes  = "sessionTimeoutMinutes"
	KeySessionAbsoluteDays    = "sessionAbsoluteDays"
	KeySessionRenewWithinDays = "sessionRenewWithinDays"
	KeyMaxFailedLogins        = "maxFailedLogins"
	KeyLockoutWindowMinutes   = "lockoutWindowMinutes"
	KeyPasswordMinLength      = "passwordMinLength"
	KeyRequireMfaAdmin        = "requireMfaAdmin"
	KeyRequireMfaCustomer     = "requireMfaCustomer"
	KeyIPAllowlistEnabled     = "ipAllowlistEnabled"
	KeySSOJitProvisioning     = "ssoJitProvisioning"

	// KeySetupCompleted is a one-way latch. Once the first super admin exists it
	// is set and never cleared, which is what permanently closes the
	// unauthenticated first-run setup endpoint.
	KeySetupCompleted = "setupCompleted"
)

// Defaults mirror migration 00016 so a missing row never leaves a policy unset.
var Defaults = map[string]any{
	KeySessionTimeoutMinutes:  float64(30),
	KeySessionAbsoluteDays:    float64(30),
	KeySessionRenewWithinDays: float64(7),
	KeyMaxFailedLogins:        float64(5),
	KeyLockoutWindowMinutes:   float64(10),
	KeyPasswordMinLength:      float64(10),
	KeyRequireMfaAdmin:        true,
	KeyRequireMfaCustomer:     false,
	KeyIPAllowlistEnabled:     false,
	KeySSOJitProvisioning:     false,
	// Absent on a fresh database, which is exactly what makes setup available.
	KeySetupCompleted: false,
}

// cacheTTL bounds how long a policy change takes to reach every request path.
// Short enough that an operator sees their change take effect while they watch,
// long enough that a hot login path is not one extra query per request.
const cacheTTL = 60 * time.Second

// Store reads platform_settings with a small in-process cache.
type Store struct {
	db *sql.DB

	mu       sync.RWMutex
	cached   map[string]any
	cachedAt time.Time
}

func NewStore(sqlDB *sql.DB) *Store {
	return &Store{db: sqlDB}
}

// All returns every policy value, with defaults filled in for absent keys.
func (s *Store) All(ctx context.Context) (map[string]any, error) {
	s.mu.RLock()
	if s.cached != nil && time.Since(s.cachedAt) < cacheTTL {
		out := make(map[string]any, len(s.cached))
		for k, v := range s.cached {
			out[k] = v
		}
		s.mu.RUnlock()
		return out, nil
	}
	s.mu.RUnlock()

	values := make(map[string]any, len(Defaults))
	for k, v := range Defaults {
		values[k] = v
	}

	rows, err := s.db.QueryContext(ctx, `SELECT key, value FROM platform_settings`)
	if err != nil {
		return nil, fmt.Errorf("query platform settings: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var key string
		var raw []byte
		if err := rows.Scan(&key, &raw); err != nil {
			return nil, fmt.Errorf("scan platform setting: %w", err)
		}
		if _, known := Defaults[key]; !known {
			continue // a key retired in code but still present in the table
		}
		var value any
		if err := json.Unmarshal(raw, &value); err != nil {
			continue // keep the default rather than failing every login on bad JSON
		}
		values[key] = value
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read platform settings: %w", err)
	}

	s.mu.Lock()
	s.cached = values
	s.cachedAt = time.Now()
	s.mu.Unlock()

	out := make(map[string]any, len(values))
	for k, v := range values {
		out[k] = v
	}
	return out, nil
}

// Int reads a numeric policy value, falling back to its default.
func (s *Store) Int(ctx context.Context, key string) int {
	values, err := s.All(ctx)
	if err != nil {
		return toInt(Defaults[key])
	}
	return toInt(values[key])
}

// Bool reads a boolean policy value, falling back to its default.
func (s *Store) Bool(ctx context.Context, key string) bool {
	values, err := s.All(ctx)
	if err != nil {
		v, _ := Defaults[key].(bool)
		return v
	}
	v, _ := values[key].(bool)
	return v
}

// Set writes one policy value inside the caller's transaction, so the change
// commits together with its audit row.
func (s *Store) Set(ctx context.Context, tx *sql.Tx, key string, value any, updatedBy *string) error {
	if _, known := Defaults[key]; !known {
		return fmt.Errorf("unknown platform setting %q", key)
	}
	encoded, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("encode platform setting %q: %w", key, err)
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO platform_settings (key, value, updated_at, updated_by)
		VALUES ($1, $2::jsonb, now(), $3)
		ON CONFLICT (key) DO UPDATE
		SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by
	`, key, string(encoded), updatedBy)
	if err != nil {
		return fmt.Errorf("write platform setting %q: %w", key, err)
	}
	return nil
}

// Invalidate drops the cache. Call it after a settings transaction commits, so
// the operator's next request reflects the change immediately.
func (s *Store) Invalidate() {
	s.mu.Lock()
	s.cached = nil
	s.mu.Unlock()
}

func toInt(v any) int {
	switch n := v.(type) {
	case float64:
		return int(n)
	case int:
		return n
	default:
		return 0
	}
}
