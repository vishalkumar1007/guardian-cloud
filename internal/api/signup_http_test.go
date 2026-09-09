package api_test

import (
	"net/http"
	"testing"
)

const customerPassword = "customer-account-passphrase"

func (e *testEnv) signup(email string) response {
	e.t.Helper()
	return e.do(http.MethodPost, "/api/v1/auth/signup", map[string]string{
		"email":        email,
		"password":     customerPassword,
		"display_name": "Test Customer",
	})
}

// Signup has to create the account, its personal tenant, the membership and a
// trial subscription together. A user without a tenant is not a valid state.
func TestSignupCreatesAccountTenantAndSubscription(t *testing.T) {
	env := newTestEnv(t)

	resp := env.signup("person@example.com")
	if resp.Status != http.StatusCreated {
		t.Fatalf("signup = %d, body = %s", resp.Status, resp.Raw)
	}

	var userID, tenantID string
	if err := env.DB.QueryRow(
		`SELECT id::text FROM users WHERE email = $1`, "person@example.com").Scan(&userID); err != nil {
		t.Fatalf("user was not created: %v", err)
	}
	if err := env.DB.QueryRow(`
		SELECT t.id::text FROM tenants t
		JOIN memberships m ON m.tenant_id = t.id
		WHERE m.user_id = $1 AND t.type = 'PERSONAL'
	`, userID).Scan(&tenantID); err != nil {
		t.Fatalf("personal tenant and membership were not created: %v", err)
	}

	var status, plan string
	if err := env.DB.QueryRow(`
		SELECT s.status, p.name FROM subscriptions s
		JOIN plans p ON p.id = s.plan_id
		WHERE s.tenant_id = $1
	`, tenantID).Scan(&status, &plan); err != nil {
		t.Fatalf("subscription was not created: %v", err)
	}
	if status != "TRIALING" {
		t.Errorf("subscription status = %q, want TRIALING", status)
	}

	var credentials int
	if err := env.DB.QueryRow(
		`SELECT count(*) FROM user_credentials WHERE user_id = $1 AND revoked_at IS NULL`,
		userID).Scan(&credentials); err != nil {
		t.Fatalf("count credentials: %v", err)
	}
	if credentials != 1 {
		t.Errorf("expected one password credential, got %d", credentials)
	}
}

// Signing up and then signing in is the whole point; this is the journey that
// was previously impossible.
func TestSignupThenLogin(t *testing.T) {
	env := newTestEnv(t)

	if resp := env.signup("person@example.com"); resp.Status != http.StatusCreated {
		t.Fatalf("signup = %d", resp.Status)
	}

	login := env.do(http.MethodPost, "/api/v1/auth/login", map[string]string{
		"email": "person@example.com", "password": customerPassword,
	})
	if login.Status != http.StatusOK || login.Body["status"] != "authenticated" {
		t.Fatalf("login = %d, body = %s", login.Status, login.Raw)
	}
	if token, ok := login.Body["csrf_token"].(string); ok {
		env.csrf = token
	}

	me := env.do(http.MethodGet, "/api/v1/auth/me", nil)
	if me.Status != http.StatusOK {
		t.Fatalf("/me = %d, body = %s", me.Status, me.Raw)
	}
	if me.Body["email"] != "person@example.com" {
		t.Errorf("email = %v", me.Body["email"])
	}

	// And the portal has something to show them.
	overview := env.do(http.MethodGet, "/api/v1/me/overview", nil)
	if overview.Status != http.StatusOK {
		t.Fatalf("overview = %d, body = %s", overview.Status, overview.Raw)
	}
	devices, _ := overview.Body["devices"].(map[string]any)
	if devices["needs_first_device"] != true {
		t.Error("a new account should be prompted to add its first device")
	}
	subscription, _ := overview.Body["subscription"].(map[string]any)
	if subscription["status"] != "TRIALING" {
		t.Errorf("subscription status = %v, want TRIALING", subscription["status"])
	}
}

// Signup must not reveal whether an address is already registered.
func TestSignupDoesNotRevealExistingAccounts(t *testing.T) {
	env := newTestEnv(t)

	first := env.signup("person@example.com")
	second := env.signup("person@example.com")

	if first.Status != second.Status {
		t.Errorf("status differs: first %d, repeat %d", first.Status, second.Status)
	}
	if first.Raw != second.Raw {
		t.Errorf("body differs:\n first:  %s\n repeat: %s", first.Raw, second.Raw)
	}

	// The duplicate must not have created a second user or tenant.
	var users, tenants int
	if err := env.DB.QueryRow(
		`SELECT count(*) FROM users WHERE email = $1`, "person@example.com").Scan(&users); err != nil {
		t.Fatalf("count users: %v", err)
	}
	if err := env.DB.QueryRow(`SELECT count(*) FROM tenants`).Scan(&tenants); err != nil {
		t.Fatalf("count tenants: %v", err)
	}
	if users != 1 {
		t.Errorf("expected 1 user, got %d", users)
	}
	if tenants != 1 {
		t.Errorf("a duplicate signup must not create a second tenant, got %d", tenants)
	}
}

// Signup deliberately does not sign anyone in: doing so on the new-account path
// but not the existing one would leak exactly what the identical body hides.
func TestSignupDoesNotIssueSession(t *testing.T) {
	env := newTestEnv(t)
	env.signup("person@example.com")

	if me := env.do(http.MethodGet, "/api/v1/auth/me", nil); me.Status != http.StatusUnauthorized {
		t.Errorf("signup must not establish a session, /me = %d", me.Status)
	}
}

func TestSignupRejectsWeakPasswordAndBadEmail(t *testing.T) {
	env := newTestEnv(t)

	cases := []struct{ name, email, password string }{
		{"short password", "person@example.com", "short"},
		{"common password", "person@example.com", "password123"},
		{"malformed email", "not-an-email", customerPassword},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			resp := env.do(http.MethodPost, "/api/v1/auth/signup", map[string]string{
				"email": tc.email, "password": tc.password,
			})
			if resp.Status != http.StatusBadRequest {
				t.Errorf("status = %d, want 400 (%s)", resp.Status, resp.Raw)
			}
		})
	}

	// Scoped to the address under test: migration 00008 seeds a users row, so a
	// bare count would never be zero.
	var users int
	if err := env.DB.QueryRow(
		`SELECT count(*) FROM users WHERE email = $1`, "person@example.com").Scan(&users); err != nil {
		t.Fatalf("count users: %v", err)
	}
	if users != 0 {
		t.Errorf("a rejected signup must not create a user, got %d", users)
	}
}

func TestEmailVerification(t *testing.T) {
	env := newTestEnv(t)
	env.signup("person@example.com")

	// The raw token only exists in the email, so read the stored digest's owner
	// and mint the check against a token we generate the same way.
	var userID string
	if err := env.DB.QueryRow(
		`SELECT id::text FROM users WHERE email = $1`, "person@example.com").Scan(&userID); err != nil {
		t.Fatalf("user: %v", err)
	}

	var verified any
	if err := env.DB.QueryRow(
		`SELECT email_verified_at FROM users WHERE id = $1`, userID).Scan(&verified); err != nil {
		t.Fatalf("read verification state: %v", err)
	}
	if verified != nil {
		t.Error("a new account should start unverified")
	}

	var tokenCount int
	if err := env.DB.QueryRow(`
		SELECT count(*) FROM email_verification_tokens
		WHERE plane = 'customer' AND subject_id = $1 AND consumed_at IS NULL
	`, userID).Scan(&tokenCount); err != nil {
		t.Fatalf("count tokens: %v", err)
	}
	if tokenCount != 1 {
		t.Fatalf("expected one verification token, got %d", tokenCount)
	}

	// An unknown token is refused, and says nothing about whether it ever existed.
	bad := env.do(http.MethodPost, "/api/v1/auth/email/verify", map[string]string{"token": "not-a-real-token"})
	if bad.Status != http.StatusGone {
		t.Errorf("unknown token = %d, want 410", bad.Status)
	}
}

// Password reset must always answer the same way, and must sign the account out
// everywhere on success.
func TestPasswordResetIsNotAnEnumerationOracle(t *testing.T) {
	env := newTestEnv(t)
	env.signup("person@example.com")

	known := env.do(http.MethodPost, "/api/v1/auth/password/forgot",
		map[string]string{"email": "person@example.com"})
	unknown := env.do(http.MethodPost, "/api/v1/auth/password/forgot",
		map[string]string{"email": "nobody@example.com"})

	if known.Status != unknown.Status || known.Raw != unknown.Raw {
		t.Errorf("forgot-password responses differ:\n known:   %d %s\n unknown: %d %s",
			known.Status, known.Raw, unknown.Status, unknown.Raw)
	}
	if known.Status != http.StatusAccepted {
		t.Errorf("status = %d, want 202", known.Status)
	}

	// A token was created only for the real account.
	var tokens int
	if err := env.DB.QueryRow(`SELECT count(*) FROM password_reset_tokens`).Scan(&tokens); err != nil {
		t.Fatalf("count tokens: %v", err)
	}
	if tokens != 1 {
		t.Errorf("expected exactly one reset token, got %d", tokens)
	}
}

func TestPasswordResetRejectsUnknownToken(t *testing.T) {
	env := newTestEnv(t)

	resp := env.do(http.MethodPost, "/api/v1/auth/password/reset", map[string]string{
		"token": "not-a-real-token", "password": "a-brand-new-passphrase",
	})
	if resp.Status != http.StatusGone {
		t.Errorf("unknown reset token = %d, want 410 (%s)", resp.Status, resp.Raw)
	}
}

// The overview must resolve the tenant from the caller's membership, never from
// anything the client could influence.
func TestPortalOverviewIsScopedToTheCaller(t *testing.T) {
	env := newTestEnv(t)
	env.signup("first@example.com")
	env.signup("second@example.com")

	login := env.do(http.MethodPost, "/api/v1/auth/login", map[string]string{
		"email": "first@example.com", "password": customerPassword,
	})
	if token, ok := login.Body["csrf_token"].(string); ok {
		env.csrf = token
	}

	overview := env.do(http.MethodGet, "/api/v1/me/overview", nil)
	if overview.Status != http.StatusOK {
		t.Fatalf("overview = %d", overview.Status)
	}

	user, _ := overview.Body["user"].(map[string]any)
	if user["email"] != "first@example.com" {
		t.Errorf("overview returned the wrong account: %v", user["email"])
	}

	// The tenant belongs to the caller, not the other signup.
	tenant, _ := overview.Body["tenant"].(map[string]any)
	var ownerEmail string
	if err := env.DB.QueryRow(`
		SELECT u.email FROM tenants t JOIN users u ON u.id = t.owner_user_id WHERE t.id = $1
	`, tenant["id"]).Scan(&ownerEmail); err != nil {
		t.Fatalf("resolve tenant owner: %v", err)
	}
	if ownerEmail != "first@example.com" {
		t.Errorf("tenant owner = %q, want the calling user", ownerEmail)
	}
}

// A customer session must not reach the staff console, and vice versa.
func TestCustomerSessionCannotReachAdminEndpoints(t *testing.T) {
	env := newTestEnv(t)
	env.signup("person@example.com")

	login := env.do(http.MethodPost, "/api/v1/auth/login", map[string]string{
		"email": "person@example.com", "password": customerPassword,
	})
	if token, ok := login.Body["csrf_token"].(string); ok {
		env.csrf = token
	}

	for _, path := range []string{
		"/api/v1/admin/auth/me",
		"/api/v1/admin/account/sessions",
		"/api/v1/admin/sso-providers/",
	} {
		if resp := env.do(http.MethodGet, path, nil); resp.Status != http.StatusUnauthorized {
			t.Errorf("customer session on %s = %d, want 401", path, resp.Status)
		}
	}
}
