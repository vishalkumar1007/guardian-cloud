package authz

import (
	"context"
	"database/sql"
	"fmt"
)

// Role is a staff role as shown in the IAM catalogue.
type Role struct {
	ID           string
	Key          string
	Name         string
	Description  string
	IsSystemRole bool
}

// Grants is everything the authorization layer needs about one staff member,
// resolved once per request.
type Grants struct {
	Roles       []Role
	Patterns    []string
	Permissions map[string]struct{}
}

// Has reports whether a permission key is granted.
func (g *Grants) Has(key string) bool {
	if g == nil {
		return false
	}
	_, ok := g.Permissions[key]
	return ok
}

// ResolveAdminGrants loads a staff member's effective permissions.
//
// Effective access is the union of directly granted roles and the roles attached
// to every team they belong to. Expired and revoked grants are excluded here
// rather than by a background job, so a time-boxed elevation stops working the
// moment it lapses without anything having to run.
func ResolveAdminGrants(ctx context.Context, sqlDB *sql.DB, adminUserID string) (*Grants, error) {
	rows, err := sqlDB.QueryContext(ctx, `
		SELECT DISTINCT r.id::text, r.role_key, r.name, COALESCE(r.description,''), r.is_system_role
		FROM guardian_roles r
		WHERE r.id IN (
			SELECT ar.role_id
			FROM guardian_admin_roles ar
			WHERE ar.admin_user_id = $1
			  AND ar.revoked_at IS NULL
			  AND (ar.expires_at IS NULL OR ar.expires_at > now())
			UNION
			SELECT tr.role_id
			FROM guardian_team_roles tr
			JOIN guardian_team_members tm ON tm.team_id = tr.team_id
			WHERE tm.admin_user_id = $1
		)
		ORDER BY r.role_key
	`, adminUserID)
	if err != nil {
		return nil, fmt.Errorf("resolve admin roles: %w", err)
	}
	defer rows.Close()

	grants := &Grants{Permissions: map[string]struct{}{}}
	var roleIDs []any
	for rows.Next() {
		var role Role
		if err := rows.Scan(&role.ID, &role.Key, &role.Name, &role.Description, &role.IsSystemRole); err != nil {
			return nil, fmt.Errorf("scan role: %w", err)
		}
		grants.Roles = append(grants.Roles, role)
		roleIDs = append(roleIDs, role.ID)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read roles: %w", err)
	}
	if len(roleIDs) == 0 {
		return grants, nil
	}

	patterns, err := grantPatternsForRoles(ctx, sqlDB, roleIDs)
	if err != nil {
		return nil, err
	}
	grants.Patterns = patterns

	permissions, err := AllPermissionKeys(ctx, sqlDB)
	if err != nil {
		return nil, err
	}
	grants.Permissions = Expand(patterns, permissions)
	return grants, nil
}

func grantPatternsForRoles(ctx context.Context, sqlDB *sql.DB, roleIDs []any) ([]string, error) {
	rows, err := sqlDB.QueryContext(ctx, `
		SELECT DISTINCT grant_pattern FROM guardian_role_permissions
		WHERE role_id = ANY($1::uuid[])
	`, pgTextArray(roleIDs))
	if err != nil {
		return nil, fmt.Errorf("resolve grant patterns: %w", err)
	}
	defer rows.Close()

	var patterns []string
	for rows.Next() {
		var pattern string
		if err := rows.Scan(&pattern); err != nil {
			return nil, fmt.Errorf("scan grant pattern: %w", err)
		}
		patterns = append(patterns, pattern)
	}
	return patterns, rows.Err()
}

// AllPermissionKeys returns every permission the platform defines. Patterns are
// expanded against this, so a permission added by a migration reaches every role
// whose pattern already covers it.
func AllPermissionKeys(ctx context.Context, sqlDB *sql.DB) ([]string, error) {
	rows, err := sqlDB.QueryContext(ctx, `SELECT key FROM guardian_permissions ORDER BY key`)
	if err != nil {
		return nil, fmt.Errorf("load permissions: %w", err)
	}
	defer rows.Close()

	var keys []string
	for rows.Next() {
		var key string
		if err := rows.Scan(&key); err != nil {
			return nil, fmt.Errorf("scan permission: %w", err)
		}
		keys = append(keys, key)
	}
	return keys, rows.Err()
}

// pgTextArray renders ids as a Postgres array literal for `= ANY($1::uuid[])`.
// The values are database-sourced UUIDs, never request input, and the cast makes
// anything that is not a UUID fail rather than inject.
func pgTextArray(values []any) string {
	out := "{"
	for i, v := range values {
		if i > 0 {
			out += ","
		}
		out += fmt.Sprint(v)
	}
	return out + "}"
}
