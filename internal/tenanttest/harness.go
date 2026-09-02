package tenanttest

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
)

// Harness helps Phase 1 isolation tests: create two PERSONAL tenants and
// assert that tenant-scoped queries always include tenant_id.
type Harness struct {
	DB       *sql.DB
	UserA    string
	UserB    string
	TenantA  string
	TenantB  string
	RoleID   string
}

// Bootstrap creates two users and two PERSONAL tenants with PERSONAL_OWNER memberships.
func Bootstrap(ctx context.Context, db *sql.DB) (*Harness, error) {
	h := &Harness{DB: db}

	err := db.QueryRowContext(ctx, `SELECT id::text FROM roles WHERE name = 'PERSONAL_OWNER' AND tenant_id IS NULL`).Scan(&h.RoleID)
	if err != nil {
		return nil, fmt.Errorf("lookup PERSONAL_OWNER role: %w", err)
	}

	if err := db.QueryRowContext(ctx, `
		INSERT INTO users (email, display_name, email_verified_at)
		VALUES ('isolation-a@guardian.test', 'Isolation A', now())
		RETURNING id::text`).Scan(&h.UserA); err != nil {
		return nil, fmt.Errorf("create user A: %w", err)
	}
	if err := db.QueryRowContext(ctx, `
		INSERT INTO users (email, display_name, email_verified_at)
		VALUES ('isolation-b@guardian.test', 'Isolation B', now())
		RETURNING id::text`).Scan(&h.UserB); err != nil {
		return nil, fmt.Errorf("create user B: %w", err)
	}

	if err := db.QueryRowContext(ctx, `
		INSERT INTO tenants (type, name, owner_user_id)
		VALUES ('PERSONAL', 'Tenant A', $1::uuid)
		RETURNING id::text`, h.UserA).Scan(&h.TenantA); err != nil {
		return nil, fmt.Errorf("create tenant A: %w", err)
	}
	if err := db.QueryRowContext(ctx, `
		INSERT INTO tenants (type, name, owner_user_id)
		VALUES ('PERSONAL', 'Tenant B', $1::uuid)
		RETURNING id::text`, h.UserB).Scan(&h.TenantB); err != nil {
		return nil, fmt.Errorf("create tenant B: %w", err)
	}

	if _, err := db.ExecContext(ctx, `
		INSERT INTO memberships (user_id, tenant_id, role_id)
		VALUES ($1::uuid, $2::uuid, $3::uuid)`, h.UserA, h.TenantA, h.RoleID); err != nil {
		return nil, fmt.Errorf("membership A: %w", err)
	}
	if _, err := db.ExecContext(ctx, `
		INSERT INTO memberships (user_id, tenant_id, role_id)
		VALUES ($1::uuid, $2::uuid, $3::uuid)`, h.UserB, h.TenantB, h.RoleID); err != nil {
		return nil, fmt.Errorf("membership B: %w", err)
	}

	return h, nil
}

// RequireTenantFilter fails the test when a query string omits tenant_id.
// Use this in repository helpers during Phase 1 to catch accidental cross-tenant reads.
func RequireTenantFilter(t *testing.T, query string) {
	t.Helper()
	if !containsTenantID(query) {
		t.Fatalf("tenant isolation: query must filter by tenant_id:\n%s", query)
	}
}

func containsTenantID(q string) bool {
	for i := 0; i+8 < len(q); i++ {
		chunk := q[i : i+9]
		if equalFoldASCII(chunk, "tenant_id") {
			return true
		}
	}
	return false
}

func equalFoldASCII(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := 0; i < len(a); i++ {
		ca, cb := a[i], b[i]
		if ca >= 'A' && ca <= 'Z' {
			ca += 'a' - 'A'
		}
		if cb >= 'A' && cb <= 'Z' {
			cb += 'a' - 'A'
		}
		if ca != cb {
			return false
		}
	}
	return true
}
