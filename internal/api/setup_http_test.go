package api_test

import (
	"net/http"
	"sync"
	"testing"
)

const setupPassword = "first-super-admin-passphrase"

// A brand-new database ships an identity but no credential, so setup must be
// offered rather than leaving the deployment with no way in.
func TestSetupRequiredOnFreshDatabase(t *testing.T) {
	env := newTestEnv(t)

	resp := env.do(http.MethodGet, "/api/v1/admin/auth/setup-status", nil)
	if resp.Status != http.StatusOK {
		t.Fatalf("setup-status = %d, body = %s", resp.Status, resp.Raw)
	}
	if resp.Body["setup_required"] != true {
		t.Errorf("setup_required = %v, want true on a fresh database", resp.Body["setup_required"])
	}
}

func TestCompleteSetupCreatesFirstSuperAdmin(t *testing.T) {
	env := newTestEnv(t)

	resp := env.do(http.MethodPost, "/api/v1/admin/auth/setup", map[string]string{
		"email":        "founder@guardian.local",
		"display_name": "Founding Admin",
		"password":     setupPassword,
	})
	if resp.Status != http.StatusCreated {
		t.Fatalf("setup = %d, body = %s", resp.Status, resp.Raw)
	}

	// Setup must close behind itself.
	status := env.do(http.MethodGet, "/api/v1/admin/auth/setup-status", nil)
	if status.Body["setup_required"] != false {
		t.Error("setup must not remain available once an admin exists")
	}

	// And the account it created must actually be a working super admin.
	login := env.do(http.MethodPost, "/api/v1/admin/auth/login", map[string]string{
		"email": "founder@guardian.local", "password": setupPassword,
	})
	// MFA is optional by default, so the first sign-in issues a session.
	if login.Body["status"] != "authenticated" {
		t.Fatalf("first login status = %v, want authenticated (%s)", login.Body["status"], login.Raw)
	}
	if token, ok := login.Body["csrf_token"].(string); ok {
		env.csrf = token
	}
	if me := env.do(http.MethodGet, "/api/v1/admin/auth/me", nil); me.Status != http.StatusOK {
		t.Fatalf("/me after setup login = %d (%s)", me.Status, me.Raw)
	}

	var roles int
	if err := env.DB.QueryRow(`
		SELECT count(*) FROM guardian_admin_roles ar
		JOIN guardian_roles r ON r.id = ar.role_id
		JOIN guardian_admin_users u ON u.id = ar.admin_user_id
		WHERE u.email = $1 AND r.role_key = 'SUPER_ADMIN' AND ar.revoked_at IS NULL
	`, "founder@guardian.local").Scan(&roles); err != nil {
		t.Fatalf("query roles: %v", err)
	}
	if roles != 1 {
		t.Errorf("expected the new account to hold SUPER_ADMIN, got %d grants", roles)
	}
}

// Choosing the seeded address must adopt that row rather than failing on the
// unique email constraint.
func TestSetupAdoptsSeededIdentity(t *testing.T) {
	env := newTestEnv(t)

	resp := env.do(http.MethodPost, "/api/v1/admin/auth/setup", map[string]string{
		"email":        "superadmin@guardian.local",
		"display_name": "Adopted Admin",
		"password":     setupPassword,
	})
	if resp.Status != http.StatusCreated {
		t.Fatalf("setup = %d, body = %s", resp.Status, resp.Raw)
	}

	var count int
	if err := env.DB.QueryRow(
		`SELECT count(*) FROM guardian_admin_users WHERE email = $1`,
		"superadmin@guardian.local").Scan(&count); err != nil {
		t.Fatalf("count: %v", err)
	}
	if count != 1 {
		t.Errorf("expected the seeded row to be adopted, found %d accounts", count)
	}
}

// The endpoint creates a SUPER_ADMIN without authentication, so a second call
// must be refused.
func TestSetupCannotRunTwice(t *testing.T) {
	env := newTestEnv(t)

	first := env.do(http.MethodPost, "/api/v1/admin/auth/setup", map[string]string{
		"email": "founder@guardian.local", "password": setupPassword,
	})
	if first.Status != http.StatusCreated {
		t.Fatalf("first setup = %d, body = %s", first.Status, first.Raw)
	}

	second := env.do(http.MethodPost, "/api/v1/admin/auth/setup", map[string]string{
		"email": "attacker@evil.example", "password": "another-long-passphrase",
	})
	if second.Status != http.StatusConflict {
		t.Fatalf("second setup = %d, want 409 (%s)", second.Status, second.Raw)
	}

	var exists int
	if err := env.DB.QueryRow(
		`SELECT count(*) FROM guardian_admin_users WHERE email = $1`,
		"attacker@evil.example").Scan(&exists); err != nil {
		t.Fatalf("count: %v", err)
	}
	if exists != 0 {
		t.Error("a refused setup must not create an account")
	}
}

// The one-way latch, tested directly: revoking every credential must NOT
// re-open unauthenticated super-admin creation on a live system.
func TestSetupStaysClosedAfterCredentialsRevoked(t *testing.T) {
	env := newTestEnv(t)

	if resp := env.do(http.MethodPost, "/api/v1/admin/auth/setup", map[string]string{
		"email": "founder@guardian.local", "password": setupPassword,
	}); resp.Status != http.StatusCreated {
		t.Fatalf("setup = %d", resp.Status)
	}

	if _, err := env.DB.Exec(`UPDATE guardian_admin_credentials SET revoked_at = now()`); err != nil {
		t.Fatalf("revoke credentials: %v", err)
	}

	status := env.do(http.MethodGet, "/api/v1/admin/auth/setup-status", nil)
	if status.Body["setup_required"] != false {
		t.Error("setup must stay closed once completed, even with no live credentials")
	}

	retry := env.do(http.MethodPost, "/api/v1/admin/auth/setup", map[string]string{
		"email": "attacker@evil.example", "password": "another-long-passphrase",
	})
	if retry.Status != http.StatusConflict {
		t.Errorf("setup after credential revocation = %d, want 409", retry.Status)
	}
}

// Two operators hitting Create at the same moment must not both succeed.
func TestConcurrentSetupCreatesOneAdmin(t *testing.T) {
	env := newTestEnv(t)

	const attempts = 5
	statuses := make([]int, attempts)
	var wg sync.WaitGroup

	for i := 0; i < attempts; i++ {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			client := newTestClientFor(t, env)
			resp := client.do(http.MethodPost, "/api/v1/admin/auth/setup", map[string]any{
				"email":    "founder@guardian.local",
				"password": setupPassword,
			})
			statuses[index] = resp.Status
		}(i)
	}
	wg.Wait()

	created := 0
	for _, status := range statuses {
		if status == http.StatusCreated {
			created++
		}
	}
	if created != 1 {
		t.Errorf("expected exactly 1 successful setup, got %d (statuses: %v)", created, statuses)
	}

	var admins int
	if err := env.DB.QueryRow(
		`SELECT count(*) FROM guardian_admin_credentials WHERE revoked_at IS NULL`).Scan(&admins); err != nil {
		t.Fatalf("count credentials: %v", err)
	}
	if admins != 1 {
		t.Errorf("expected exactly 1 credential, got %d", admins)
	}
}

func TestSetupRejectsWeakPasswordAndBadEmail(t *testing.T) {
	env := newTestEnv(t)

	cases := []struct {
		name     string
		email    string
		password string
	}{
		{"short password", "founder@guardian.local", "short"},
		{"common password", "founder@guardian.local", "password123"},
		{"malformed email", "not-an-email", setupPassword},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			resp := env.do(http.MethodPost, "/api/v1/admin/auth/setup", map[string]string{
				"email": tc.email, "password": tc.password,
			})
			if resp.Status != http.StatusBadRequest {
				t.Errorf("status = %d, want 400 (%s)", resp.Status, resp.Raw)
			}
		})
	}

	// A rejected attempt must leave setup open, not half-consume it.
	status := env.do(http.MethodGet, "/api/v1/admin/auth/setup-status", nil)
	if status.Body["setup_required"] != true {
		t.Error("a rejected setup attempt must leave setup available")
	}
}

// Once bootstrapped from the shell, the browser screen must not still offer
// unauthenticated super-admin creation.
func TestSeededAdminWithCredentialClosesSetup(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")

	status := env.do(http.MethodGet, "/api/v1/admin/auth/setup-status", nil)
	if status.Body["setup_required"] != false {
		t.Error("an existing usable credential must close setup")
	}
}
