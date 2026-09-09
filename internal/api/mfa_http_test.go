package api_test

import (
	"net/http"
	"testing"
	"time"

	"guardian-cloud/internal/mfa"
)

// enrolTOTP walks the enrolment flow and returns the shared secret and the
// recovery codes it issued.
func (e *testEnv) enrolTOTP(t *testing.T) (secret string, recoveryCodes []string) {
	t.Helper()

	start := e.do(http.MethodPost, "/api/v1/admin/auth/mfa/totp", map[string]string{"label": "Test phone"})
	if start.Status != http.StatusCreated {
		t.Fatalf("start enrolment = %d, body = %s", start.Status, start.Raw)
	}

	secret, _ = start.Body["secret"].(string)
	methodID, _ := start.Body["mfa_method_id"].(string)
	if secret == "" || methodID == "" {
		t.Fatalf("enrolment response missing secret or id: %s", start.Raw)
	}
	if uri, _ := start.Body["otpauth_uri"].(string); uri == "" {
		t.Error("enrolment should return an otpauth URI for the QR code")
	}

	code, err := mfa.Code(secret, time.Now())
	if err != nil {
		t.Fatalf("compute code: %v", err)
	}

	verify := e.do(http.MethodPost, "/api/v1/admin/auth/mfa/totp/"+methodID+"/verify",
		map[string]string{"code": code})
	if verify.Status != http.StatusOK {
		t.Fatalf("verify enrolment = %d, body = %s", verify.Status, verify.Raw)
	}

	for _, c := range verify.Body["recovery_codes"].([]any) {
		recoveryCodes = append(recoveryCodes, c.(string))
	}
	return secret, recoveryCodes
}

// The whole point of the feature: enrol, sign out, and prove the password alone
// is no longer enough.
func TestMFAEnrollThenLoginRequiresCode(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")
	env.loginAdmin("staff@guardian.local")

	secret, recoveryCodes := env.enrolTOTP(t)
	if len(recoveryCodes) != mfa.RecoveryCodeCount {
		t.Errorf("got %d recovery codes, want %d", len(recoveryCodes), mfa.RecoveryCodeCount)
	}

	env.do(http.MethodPost, "/api/v1/admin/auth/logout", nil)
	env.csrf = ""

	// Password alone now yields a challenge, not a session.
	login := env.loginAdmin("staff@guardian.local")
	if login.Body["status"] != "mfa_required" {
		t.Fatalf("status = %v, want mfa_required (body: %s)", login.Body["status"], login.Raw)
	}
	if me := env.do(http.MethodGet, "/api/v1/admin/auth/me", nil); me.Status != http.StatusUnauthorized {
		t.Fatalf("/me mid-challenge = %d, want 401", me.Status)
	}

	// A wrong code is refused.
	if bad := env.do(http.MethodPost, "/api/v1/admin/auth/login/mfa",
		map[string]string{"code": "000000", "method": "TOTP"}); bad.Status != http.StatusUnauthorized {
		t.Errorf("wrong code = %d, want 401", bad.Status)
	}

	code, err := mfa.Code(secret, time.Now())
	if err != nil {
		t.Fatalf("compute code: %v", err)
	}
	done := env.do(http.MethodPost, "/api/v1/admin/auth/login/mfa",
		map[string]string{"code": code, "method": "TOTP"})
	if done.Status != http.StatusOK || done.Body["status"] != "authenticated" {
		t.Fatalf("mfa verify = %d, body = %s", done.Status, done.Raw)
	}

	if token, ok := done.Body["csrf_token"].(string); ok {
		env.csrf = token
	}
	if me := env.do(http.MethodGet, "/api/v1/admin/auth/me", nil); me.Status != http.StatusOK {
		t.Errorf("/me after MFA = %d, want 200", me.Status)
	}
}

// A spent challenge must not be reusable, or a captured request could be
// replayed into a second session.
func TestMFAChallengeIsSingleUse(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")
	env.loginAdmin("staff@guardian.local")

	secret, _ := env.enrolTOTP(t)
	env.do(http.MethodPost, "/api/v1/admin/auth/logout", nil)
	env.csrf = ""

	env.loginAdmin("staff@guardian.local")
	code, _ := mfa.Code(secret, time.Now())

	if first := env.do(http.MethodPost, "/api/v1/admin/auth/login/mfa",
		map[string]string{"code": code, "method": "TOTP"}); first.Status != http.StatusOK {
		t.Fatalf("first verify = %d, body = %s", first.Status, first.Raw)
	}

	// The cookie is cleared on success, so the replay carries no challenge and
	// is refused as expired rather than granting a second session.
	replay := env.do(http.MethodPost, "/api/v1/admin/auth/login/mfa",
		map[string]string{"code": code, "method": "TOTP"})
	if replay.Status != http.StatusGone {
		t.Errorf("replayed challenge = %d, want 410", replay.Status)
	}
}

func TestRecoveryCodeSignsInAndIsSingleUse(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")
	env.loginAdmin("staff@guardian.local")

	_, recoveryCodes := env.enrolTOTP(t)
	env.do(http.MethodPost, "/api/v1/admin/auth/logout", nil)
	env.csrf = ""

	env.loginAdmin("staff@guardian.local")
	used := recoveryCodes[0]

	done := env.do(http.MethodPost, "/api/v1/admin/auth/login/mfa",
		map[string]string{"code": used, "method": "RECOVERY_CODE"})
	if done.Status != http.StatusOK || done.Body["status"] != "authenticated" {
		t.Fatalf("recovery code sign-in = %d, body = %s", done.Status, done.Raw)
	}

	// The session records how it was obtained, so an operator reviewing the
	// audit trail can see a recovery code was used.
	if token, ok := done.Body["csrf_token"].(string); ok {
		env.csrf = token
	}
	me := env.do(http.MethodGet, "/api/v1/admin/auth/me", nil)
	session, _ := me.Body["session"].(map[string]any)
	if session["auth_method"] != "RECOVERY_CODE" {
		t.Errorf("auth_method = %v, want RECOVERY_CODE", session["auth_method"])
	}

	env.do(http.MethodPost, "/api/v1/admin/auth/logout", nil)
	env.csrf = ""

	// The same code must not work twice.
	env.loginAdmin("staff@guardian.local")
	reuse := env.do(http.MethodPost, "/api/v1/admin/auth/login/mfa",
		map[string]string{"code": used, "method": "RECOVERY_CODE"})
	if reuse.Status == http.StatusOK {
		t.Error("a recovery code must not be usable twice")
	}
}

// Removing the last factor while policy requires MFA would lock the account out
// of its own protection; it has to be refused.
func TestCannotRemoveLastMFAMethodUnderPolicy(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")
	env.loginAdmin("staff@guardian.local")
	env.enrolTOTP(t)

	// Set the requirement on the account rather than in platform_settings: the
	// settings store caches for a minute, so a global change would not reliably
	// be visible to the very next request and the test would be flaky.
	if _, err := env.DB.Exec(
		`UPDATE guardian_admin_users SET mfa_required = true WHERE email = $1`,
		"staff@guardian.local"); err != nil {
		t.Fatalf("require mfa: %v", err)
	}

	list := env.do(http.MethodGet, "/api/v1/admin/auth/mfa", nil)
	items, _ := list.Body["items"].([]any)
	if len(items) != 1 {
		t.Fatalf("expected 1 enrolled method, got %d (%s)", len(items), list.Raw)
	}
	methodID := items[0].(map[string]any)["id"].(string)

	resp := env.do(http.MethodDelete, "/api/v1/admin/account/mfa/"+methodID,
		map[string]string{"password": testPassword})
	if resp.Status != http.StatusConflict {
		t.Fatalf("removing the last factor = %d, want 409 (%s)", resp.Status, resp.Raw)
	}

	// And it must still be there.
	after := env.do(http.MethodGet, "/api/v1/admin/auth/mfa", nil)
	remaining, _ := after.Body["items"].([]any)
	if len(remaining) != 1 {
		t.Errorf("the factor should not have been removed, got %d", len(remaining))
	}
}

// Removing a factor must require the password, so an unlocked laptop is not
// enough to strip the second factor off an account.
func TestRemovingMFARequiresPassword(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")
	env.loginAdmin("staff@guardian.local")
	env.enrolTOTP(t)

	list := env.do(http.MethodGet, "/api/v1/admin/auth/mfa", nil)
	items, _ := list.Body["items"].([]any)
	methodID := items[0].(map[string]any)["id"].(string)

	resp := env.do(http.MethodDelete, "/api/v1/admin/account/mfa/"+methodID,
		map[string]string{"password": "not-the-right-password"})
	if resp.Status != http.StatusUnauthorized {
		t.Errorf("removal with a wrong password = %d, want 401", resp.Status)
	}
}

func TestListAndRevokeOwnSessions(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")
	env.loginAdmin("staff@guardian.local")

	// A second sign-in from a different client, i.e. another device.
	other := newTestClientFor(t, env)
	other.loginAdmin("staff@guardian.local")

	list := env.do(http.MethodGet, "/api/v1/admin/account/sessions", nil)
	if list.Status != http.StatusOK {
		t.Fatalf("list sessions = %d, body = %s", list.Status, list.Raw)
	}
	items, _ := list.Body["items"].([]any)
	if len(items) != 2 {
		t.Fatalf("expected 2 sessions, got %d (%s)", len(items), list.Raw)
	}

	// Exactly one must be flagged as the caller's own.
	current := 0
	for _, item := range items {
		if item.(map[string]any)["current"] == true {
			current++
		}
	}
	if current != 1 {
		t.Errorf("expected exactly 1 current session, got %d", current)
	}

	if resp := env.do(http.MethodDelete, "/api/v1/admin/account/sessions", nil); resp.Status != http.StatusOK {
		t.Fatalf("revoke others = %d, body = %s", resp.Status, resp.Raw)
	}

	// The other device is signed out; this one is not.
	if me := other.do(http.MethodGet, "/api/v1/admin/auth/me", nil); me.Status != http.StatusUnauthorized {
		t.Errorf("the other session should have been revoked, got %d", me.Status)
	}
	if me := env.do(http.MethodGet, "/api/v1/admin/auth/me", nil); me.Status != http.StatusOK {
		t.Errorf("the current session should survive, got %d", me.Status)
	}
}

func TestChangePasswordRevokesOtherSessions(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")
	env.loginAdmin("staff@guardian.local")

	other := newTestClientFor(t, env)
	other.loginAdmin("staff@guardian.local")

	resp := env.do(http.MethodPost, "/api/v1/admin/account/password", map[string]string{
		"current_password": testPassword,
		"new_password":     "a-completely-different-passphrase",
	})
	if resp.Status != http.StatusNoContent {
		t.Fatalf("change password = %d, body = %s", resp.Status, resp.Raw)
	}

	if me := other.do(http.MethodGet, "/api/v1/admin/auth/me", nil); me.Status != http.StatusUnauthorized {
		t.Errorf("other sessions should be revoked, got %d", me.Status)
	}
	if me := env.do(http.MethodGet, "/api/v1/admin/auth/me", nil); me.Status != http.StatusOK {
		t.Errorf("the current session should survive, got %d", me.Status)
	}

	// The old password must stop working, the new one must start.
	fresh := newTestClientFor(t, env)
	if old := fresh.do(http.MethodPost, "/api/v1/admin/auth/login", map[string]string{
		"email": "staff@guardian.local", "password": testPassword,
	}); old.Status != http.StatusUnauthorized {
		t.Errorf("the old password should be rejected, got %d", old.Status)
	}
	if fresh2 := newTestClientFor(t, env).do(http.MethodPost, "/api/v1/admin/auth/login", map[string]string{
		"email": "staff@guardian.local", "password": "a-completely-different-passphrase",
	}); fresh2.Status != http.StatusOK {
		t.Errorf("the new password should work, got %d", fresh2.Status)
	}
}

func TestWeakPasswordRejectedOnChange(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")
	env.loginAdmin("staff@guardian.local")

	for _, weak := range []string{"short", "password123", "aaaaaaaaaaaa"} {
		resp := env.do(http.MethodPost, "/api/v1/admin/account/password", map[string]string{
			"current_password": testPassword,
			"new_password":     weak,
		})
		if resp.Status != http.StatusBadRequest {
			t.Errorf("password %q = %d, want 400", weak, resp.Status)
		}
	}
}

// Mid-login enrolment is the path forced when policy requires MFA and nothing
// is enrolled yet (first sign-in after setup when mfa_required is on). It must
// verify the TOTP, issue recovery codes, and hand out a session in one go.
func TestMidLoginEnrollmentCompletesSession(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")

	if _, err := env.DB.Exec(
		`UPDATE guardian_admin_users SET mfa_required = true WHERE email = $1`,
		"staff@guardian.local"); err != nil {
		t.Fatalf("require mfa: %v", err)
	}

	login := env.do(http.MethodPost, "/api/v1/admin/auth/login", map[string]string{
		"email": "staff@guardian.local", "password": testPassword,
	})
	if login.Body["status"] != "mfa_enrollment_required" {
		t.Fatalf("login status = %v, want mfa_enrollment_required (%s)", login.Body["status"], login.Raw)
	}

	start := env.do(http.MethodPost, "/api/v1/admin/auth/mfa/totp", map[string]string{"label": "Phone"})
	if start.Status != http.StatusCreated {
		t.Fatalf("start enrolment = %d, body = %s", start.Status, start.Raw)
	}
	secret, _ := start.Body["secret"].(string)
	methodID, _ := start.Body["mfa_method_id"].(string)
	if secret == "" || methodID == "" {
		t.Fatalf("enrolment response missing secret or id: %s", start.Raw)
	}

	code, err := mfa.Code(secret, time.Now())
	if err != nil {
		t.Fatalf("compute code: %v", err)
	}

	verify := env.do(http.MethodPost, "/api/v1/admin/auth/mfa/totp/"+methodID+"/verify",
		map[string]string{"code": code})
	if verify.Status != http.StatusOK {
		t.Fatalf("verify enrolment = %d, body = %s", verify.Status, verify.Raw)
	}
	if verify.Body["status"] != "authenticated" {
		t.Fatalf("verify status = %v, want authenticated (%s)", verify.Body["status"], verify.Raw)
	}
	if codes, _ := verify.Body["recovery_codes"].([]any); len(codes) != mfa.RecoveryCodeCount {
		t.Errorf("got %d recovery codes, want %d", len(codes), mfa.RecoveryCodeCount)
	}
	if token, ok := verify.Body["csrf_token"].(string); ok {
		env.csrf = token
	}

	me := env.do(http.MethodGet, "/api/v1/admin/auth/me", nil)
	if me.Status != http.StatusOK {
		t.Fatalf("/me after mid-login enrolment = %d, want 200 (%s)", me.Status, me.Raw)
	}
}

// An expired enrolment challenge must not be reported as a bad authenticator
// code — the client needs to know to start over.
func TestMidLoginEnrollmentRejectsWithoutChallenge(t *testing.T) {
	env := newTestEnv(t)
	env.seedAdmin("staff@guardian.local", "SUPER_ADMIN")
	env.loginAdmin("staff@guardian.local")

	// Session enrol creates a method, then we clear the session and try to
	// verify with neither a session nor a challenge cookie.
	start := env.do(http.MethodPost, "/api/v1/admin/auth/mfa/totp", map[string]string{"label": "Phone"})
	if start.Status != http.StatusCreated {
		t.Fatalf("start enrolment = %d, body = %s", start.Status, start.Raw)
	}
	methodID, _ := start.Body["mfa_method_id"].(string)
	secret, _ := start.Body["secret"].(string)

	env.do(http.MethodPost, "/api/v1/admin/auth/logout", nil)
	env.csrf = ""

	code, err := mfa.Code(secret, time.Now())
	if err != nil {
		t.Fatalf("compute code: %v", err)
	}
	verify := env.do(http.MethodPost, "/api/v1/admin/auth/mfa/totp/"+methodID+"/verify",
		map[string]string{"code": code})
	if verify.Status != http.StatusUnauthorized {
		t.Fatalf("verify without auth = %d, want 401 (%s)", verify.Status, verify.Raw)
	}
	if verify.Body["error"] != "authentication required" {
		t.Errorf("error = %v, want authentication required", verify.Body["error"])
	}
}
