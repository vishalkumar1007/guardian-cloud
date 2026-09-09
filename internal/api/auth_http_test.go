package api_test

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"guardian-cloud/internal/api"
	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/authtest"
	"guardian-cloud/internal/config"
	"guardian-cloud/internal/crypto"
	"guardian-cloud/internal/db"
	"guardian-cloud/internal/mail"
)

const (
	testOrigin   = "http://127.0.0.1:5175"
	testPassword = "guardian-test-passphrase"
)

// testEnv is a running API backed by a throwaway database.
type testEnv struct {
	t      *testing.T
	DB     *sql.DB
	Server *httptest.Server
	client *http.Client
	csrf   string
}

func newTestEnv(t *testing.T) *testEnv {
	t.Helper()
	sqlDB := authtest.Postgres(t)

	key := make([]byte, 32)
	sealer, err := crypto.NewSealer(base64.StdEncoding.EncodeToString(key))
	if err != nil {
		t.Fatalf("sealer: %v", err)
	}

	cfg := &config.Config{
		PublicWebURL: testOrigin,
		// Explicit so the test asserts against exactly one known origin.
		CORSAllowedOrigins: []string{testOrigin},
		// Legacy fallbacks off, so these tests measure real session behaviour
		// and not the header shim that is on its way out.
		AuthLegacyMode:   config.LegacyModeOff,
		AuthCookieSecure: false,
	}

	server := httptest.NewServer(api.NewRouter(api.RouterDeps{
		DB:     sqlDB,
		Config: cfg,
		Sealer: sealer,
		Mailer: mail.New("", "", "", "", ""),
	}))
	t.Cleanup(server.Close)

	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatalf("cookie jar: %v", err)
	}

	return &testEnv{
		t:      t,
		DB:     sqlDB,
		Server: server,
		client: &http.Client{Jar: jar},
	}
}

// newTestClientFor returns a second client against the same server, standing in
// for another browser or device.
func newTestClientFor(t *testing.T, env *testEnv) *testEnv {
	t.Helper()
	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatalf("cookie jar: %v", err)
	}
	return &testEnv{
		t:      t,
		DB:     env.DB,
		Server: env.Server,
		client: &http.Client{Jar: jar},
	}
}

type response struct {
	Status int
	Body   map[string]any
	Raw    string
}

func (e *testEnv) do(method, path string, body any) response {
	e.t.Helper()

	var reader io.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			e.t.Fatalf("encode body: %v", err)
		}
		reader = bytes.NewReader(encoded)
	}

	req, err := http.NewRequest(method, e.Server.URL+path, reader)
	if err != nil {
		e.t.Fatalf("build request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", testOrigin)
	if e.csrf != "" {
		req.Header.Set("X-CSRF-Token", e.csrf)
	}

	resp, err := e.client.Do(req)
	if err != nil {
		e.t.Fatalf("%s %s: %v", method, path, err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	parsed := map[string]any{}
	_ = json.Unmarshal(raw, &parsed)
	return response{Status: resp.StatusCode, Body: parsed, Raw: string(raw)}
}

// seedAdmin creates an active staff account with a password and no MFA.
func (e *testEnv) seedAdmin(email string, roleKey string) string {
	e.t.Helper()
	ctx := context.Background()

	var id string
	if err := e.DB.QueryRowContext(ctx, `
		INSERT INTO guardian_admin_users (email, display_name, email_verified_at, status, mfa_required)
		VALUES ($1, 'Test Staff', now(), 'ACTIVE', false)
		RETURNING id::text
	`, email).Scan(&id); err != nil {
		e.t.Fatalf("seed admin: %v", err)
	}

	if err := db.InTx(ctx, e.DB, func(tx *sql.Tx) error {
		if err := auth.SetPassword(ctx, tx, auth.AdminPlane, id, testPassword); err != nil {
			return err
		}
		_, err := tx.ExecContext(ctx, `
			INSERT INTO guardian_admin_roles (admin_user_id, role_id)
			SELECT $1, id FROM guardian_roles WHERE role_key = $2
		`, id, roleKey)
		return err
	}); err != nil {
		e.t.Fatalf("seed admin credentials: %v", err)
	}
	return id
}

func (e *testEnv) loginAdmin(email string) response {
	e.t.Helper()
	resp := e.do(http.MethodPost, "/api/v1/admin/auth/login", map[string]string{
		"email": email, "password": testPassword,
	})
	if token, ok := resp.Body["csrf_token"].(string); ok {
		e.csrf = token
	}
	return resp
}

func TestAdminLoginSuccess(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")

	resp := env.loginAdmin("staff@guardian.local")
	if resp.Status != http.StatusOK {
		t.Fatalf("login status = %d, body = %s", resp.Status, resp.Raw)
	}
	if resp.Body["status"] != "authenticated" {
		t.Errorf("status = %v, want authenticated", resp.Body["status"])
	}

	me := env.do(http.MethodGet, "/api/v1/admin/auth/me", nil)
	if me.Status != http.StatusOK {
		t.Fatalf("/me status = %d, body = %s", me.Status, me.Raw)
	}
	if me.Body["email"] != "staff@guardian.local" {
		t.Errorf("email = %v", me.Body["email"])
	}

	// SUPER_ADMIN holds "*", which must expand to every seeded permission.
	permissions, _ := me.Body["permissions"].([]any)
	if len(permissions) < 20 {
		t.Errorf("SUPER_ADMIN should expand to every permission, got %d", len(permissions))
	}
}

// The session cookie must be httpOnly, so an XSS flaw cannot read it. The CSRF
// cookie deliberately must not be, because the frontend has to echo it back.
func TestSessionCookieIsHttpOnly(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")

	req, _ := http.NewRequest(http.MethodPost, env.Server.URL+"/api/v1/admin/auth/login",
		bytes.NewReader([]byte(`{"email":"staff@guardian.local","password":"`+testPassword+`"}`)))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", testOrigin)

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		t.Fatalf("login: %v", err)
	}
	defer resp.Body.Close()

	var sessionCookie, csrfCookie *http.Cookie
	for _, c := range resp.Cookies() {
		switch c.Name {
		case auth.AdminPlane.SessionCookie:
			sessionCookie = c
		case auth.AdminPlane.CSRFCookie:
			csrfCookie = c
		}
	}

	if sessionCookie == nil {
		t.Fatal("no session cookie was set")
	}
	if !sessionCookie.HttpOnly {
		t.Error("the session cookie must be HttpOnly")
	}
	if sessionCookie.SameSite != http.SameSiteLaxMode {
		t.Error("the session cookie should be SameSite=Lax")
	}
	if csrfCookie == nil {
		t.Fatal("no csrf cookie was set")
	}
	if csrfCookie.HttpOnly {
		t.Error("the csrf cookie must be readable by script to be echoed back")
	}
}

// An unknown address and a wrong password must be indistinguishable, or the
// login endpoint becomes an account-enumeration oracle.
func TestLoginIsNotAnEnumerationOracle(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("real@guardian.local", "SUPPORT_ADMIN")

	wrongPassword := env.do(http.MethodPost, "/api/v1/admin/auth/login", map[string]string{
		"email": "real@guardian.local", "password": "not-the-right-password",
	})
	unknownAccount := env.do(http.MethodPost, "/api/v1/admin/auth/login", map[string]string{
		"email": "nobody@guardian.local", "password": "not-the-right-password",
	})

	if wrongPassword.Status != unknownAccount.Status {
		t.Errorf("status differs: wrong password %d, unknown account %d",
			wrongPassword.Status, unknownAccount.Status)
	}
	if wrongPassword.Raw != unknownAccount.Raw {
		t.Errorf("response body differs:\n wrong password: %s\n unknown account: %s",
			wrongPassword.Raw, unknownAccount.Raw)
	}
	if wrongPassword.Status != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", wrongPassword.Status)
	}
}

func TestLoginLockout(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("target@guardian.local", "SUPPORT_ADMIN")

	for i := 0; i < 5; i++ {
		env.do(http.MethodPost, "/api/v1/admin/auth/login", map[string]string{
			"email": "target@guardian.local", "password": "wrong-password-here",
		})
	}

	// Even the correct password is refused while locked; otherwise the lockout
	// would only slow down an attacker who never guesses right.
	resp := env.do(http.MethodPost, "/api/v1/admin/auth/login", map[string]string{
		"email": "target@guardian.local", "password": testPassword,
	})
	if resp.Status != http.StatusLocked {
		t.Fatalf("status = %d, want 423 (body: %s)", resp.Status, resp.Raw)
	}
	if retry, ok := resp.Body["retry_after_seconds"].(float64); !ok || retry <= 0 {
		t.Errorf("lockout should report retry_after_seconds, got %v", resp.Body["retry_after_seconds"])
	}
}

func TestCSRFRequiredForStateChange(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")
	env.loginAdmin("staff@guardian.local")

	valid := env.csrf

	// Missing token.
	env.csrf = ""
	if resp := env.do(http.MethodPost, "/api/v1/admin/auth/logout", nil); resp.Status != http.StatusForbidden {
		t.Errorf("logout without a CSRF token = %d, want 403", resp.Status)
	}

	// Wrong token.
	env.csrf = "a-token-that-is-not-the-right-one"
	if resp := env.do(http.MethodPost, "/api/v1/admin/auth/logout", nil); resp.Status != http.StatusForbidden {
		t.Errorf("logout with a bad CSRF token = %d, want 403", resp.Status)
	}

	// Correct token.
	env.csrf = valid
	if resp := env.do(http.MethodPost, "/api/v1/admin/auth/logout", nil); resp.Status != http.StatusNoContent {
		t.Errorf("logout with a valid CSRF token = %d, want 204", resp.Status)
	}
}

func TestCrossOriginStateChangeRejected(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")
	env.loginAdmin("staff@guardian.local")

	req, _ := http.NewRequest(http.MethodPost, env.Server.URL+"/api/v1/admin/auth/logout", nil)
	req.Header.Set("Origin", "https://evil.example.com")
	req.Header.Set("X-CSRF-Token", env.csrf)

	resp, err := env.client.Do(req)
	if err != nil {
		t.Fatalf("request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("cross-origin logout = %d, want 403", resp.StatusCode)
	}
}

func TestLogoutRevokesSession(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")
	env.loginAdmin("staff@guardian.local")

	if resp := env.do(http.MethodPost, "/api/v1/admin/auth/logout", nil); resp.Status != http.StatusNoContent {
		t.Fatalf("logout = %d", resp.Status)
	}
	if resp := env.do(http.MethodGet, "/api/v1/admin/auth/me", nil); resp.Status != http.StatusUnauthorized {
		t.Errorf("/me after logout = %d, want 401", resp.Status)
	}
}

// The isolation property, at the HTTP boundary: a staff cookie must be
// meaningless on the customer plane and vice versa.
func TestCrossPlaneCookieRejected(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")
	env.loginAdmin("staff@guardian.local")

	if resp := env.do(http.MethodGet, "/api/v1/auth/me", nil); resp.Status != http.StatusUnauthorized {
		t.Errorf("admin cookie on the customer plane = %d, want 401", resp.Status)
	}

	// Even copied under the customer cookie name, the token is looked up only in
	// the customer sessions table, so it cannot resolve.
	adminToken := ""
	for _, c := range env.client.Jar.Cookies(mustURL(t, env.Server.URL)) {
		if c.Name == auth.AdminPlane.SessionCookie {
			adminToken = c.Value
		}
	}
	if adminToken == "" {
		t.Fatal("expected an admin session cookie")
	}

	req, _ := http.NewRequest(http.MethodGet, env.Server.URL+"/api/v1/auth/me", nil)
	req.Header.Set("Origin", testOrigin)
	req.AddCookie(&http.Cookie{Name: auth.CustomerPlane.SessionCookie, Value: adminToken})

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		t.Fatalf("request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("admin token under the customer cookie name = %d, want 401", resp.StatusCode)
	}
}

// The regression net: every authenticated route must refuse an anonymous
// caller. This is what catches a future endpoint mounted outside the protected
// group.
func TestAuthenticatedRoutesRejectAnonymous(t *testing.T) {
	env := newTestEnv(t)

	routes := []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/api/v1/admin/auth/me"},
		{http.MethodGet, "/api/v1/admin/auth/csrf"},
		{http.MethodPost, "/api/v1/admin/auth/logout"},
		{http.MethodGet, "/api/v1/auth/me"},
		{http.MethodPost, "/api/v1/auth/logout"},
	}

	for _, route := range routes {
		resp := env.do(route.method, route.path, nil)
		if resp.Status != http.StatusUnauthorized && resp.Status != http.StatusForbidden {
			t.Errorf("%s %s = %d, want 401 or 403", route.method, route.path, resp.Status)
		}
	}
}

func TestLoginWritesAuditRow(t *testing.T) {
	env := newTestEnv(t)
	adminID := env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")
	env.loginAdmin("staff@guardian.local")

	var count int
	if err := env.DB.QueryRow(`
		SELECT count(*) FROM audit_logs
		WHERE action = 'auth.login' AND actor_id = $1 AND actor_plane = 'admin'
	`, adminID).Scan(&count); err != nil {
		t.Fatalf("query audit: %v", err)
	}
	if count != 1 {
		t.Errorf("expected exactly one auth.login audit row, got %d", count)
	}

	// No audit row may carry a credential.
	var leaks int
	if err := env.DB.QueryRow(`
		SELECT count(*) FROM audit_logs WHERE metadata::text ILIKE '%' || $1 || '%'
	`, testPassword).Scan(&leaks); err != nil {
		t.Fatalf("query audit for leaks: %v", err)
	}
	if leaks != 0 {
		t.Errorf("audit metadata must never contain a password, found %d rows", leaks)
	}
}

func TestFailedLoginRecordsAttempt(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")

	env.do(http.MethodPost, "/api/v1/admin/auth/login", map[string]string{
		"email": "staff@guardian.local", "password": "wrong-password-here",
	})
	env.do(http.MethodPost, "/api/v1/admin/auth/login", map[string]string{
		"email": "ghost@guardian.local", "password": "wrong-password-here",
	})

	var invalid, unknown int
	if err := env.DB.QueryRow(
		`SELECT count(*) FROM login_attempts WHERE outcome = 'INVALID_CREDENTIALS'`).Scan(&invalid); err != nil {
		t.Fatalf("query attempts: %v", err)
	}
	if err := env.DB.QueryRow(
		`SELECT count(*) FROM login_attempts WHERE outcome = 'UNKNOWN_ACCOUNT'`).Scan(&unknown); err != nil {
		t.Fatalf("query attempts: %v", err)
	}

	// Indistinguishable to the client, but recorded accurately for operators.
	if invalid != 1 {
		t.Errorf("INVALID_CREDENTIALS attempts = %d, want 1", invalid)
	}
	if unknown != 1 {
		t.Errorf("UNKNOWN_ACCOUNT attempts = %d, want 1", unknown)
	}
}

func TestSuspendedAccountCannotSignIn(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")

	if _, err := env.DB.Exec(
		`UPDATE guardian_admin_users SET status = 'SUSPENDED' WHERE email = $1`,
		"staff@guardian.local"); err != nil {
		t.Fatalf("suspend: %v", err)
	}

	resp := env.do(http.MethodPost, "/api/v1/admin/auth/login", map[string]string{
		"email": "staff@guardian.local", "password": testPassword,
	})
	if resp.Status != http.StatusForbidden {
		t.Errorf("suspended login = %d, want 403", resp.Status)
	}
}

// An account with MFA enrolled must never receive a session straight from a
// password: the response has to be a challenge, with no session cookie.
func TestLoginWithMFAEnrolledIssuesChallengeNotSession(t *testing.T) {
	env := newTestEnv(t)
	adminID := env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")

	ctx := context.Background()
	if err := db.InTx(ctx, env.DB, func(tx *sql.Tx) error {
		methodID, err := auth.CreateMFAMethod(ctx, tx, auth.AdminPlane, adminID, "TOTP", "Phone", "sealed")
		if err != nil {
			return err
		}
		return auth.VerifyMFAMethod(ctx, tx, auth.AdminPlane, adminID, methodID)
	}); err != nil {
		t.Fatalf("enrol mfa: %v", err)
	}

	resp := env.do(http.MethodPost, "/api/v1/admin/auth/login", map[string]string{
		"email": "staff@guardian.local", "password": testPassword,
	})
	if resp.Body["status"] != "mfa_required" {
		t.Fatalf("status = %v, want mfa_required (body: %s)", resp.Body["status"], resp.Raw)
	}

	// No session may exist yet.
	if me := env.do(http.MethodGet, "/api/v1/admin/auth/me", nil); me.Status != http.StatusUnauthorized {
		t.Errorf("/me during an MFA challenge = %d, want 401", me.Status)
	}

	var sessions int
	if err := env.DB.QueryRow(
		`SELECT count(*) FROM guardian_admin_sessions WHERE admin_user_id = $1`, adminID).Scan(&sessions); err != nil {
		t.Fatalf("count sessions: %v", err)
	}
	if sessions != 0 {
		t.Errorf("no session row may exist before MFA succeeds, found %d", sessions)
	}
}

func TestIdleTimeoutEndsSession(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")

	original := auth.Now
	t.Cleanup(func() { auth.Now = original })

	start := time.Now().UTC()
	auth.Now = func() time.Time { return start }
	env.loginAdmin("staff@guardian.local")

	if resp := env.do(http.MethodGet, "/api/v1/admin/auth/me", nil); resp.Status != http.StatusOK {
		t.Fatalf("/me immediately after login = %d", resp.Status)
	}

	// Past the default 30-minute idle window.
	auth.Now = func() time.Time { return start.Add(31 * time.Minute) }

	resp := env.do(http.MethodGet, "/api/v1/admin/auth/me", nil)
	if resp.Status != http.StatusUnauthorized {
		t.Fatalf("/me after idle = %d, want 401", resp.Status)
	}
	// The client needs to know why, so it can say so rather than looking broken.
	if resp.Body["reason"] != "idle_timeout" {
		t.Errorf("reason = %v, want idle_timeout", resp.Body["reason"])
	}
}

func mustURL(t *testing.T, raw string) *url.URL {
	t.Helper()
	parsed, err := url.Parse(raw)
	if err != nil {
		t.Fatalf("parse url: %v", err)
	}
	return parsed
}
