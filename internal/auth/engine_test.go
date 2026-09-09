package auth_test

import (
	"context"
	"database/sql"
	"errors"
	"testing"
	"time"

	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/authtest"
	"guardian-cloud/internal/db"
)

const testPassword = "correct-horse-battery-staple"

func seedCustomer(t *testing.T, ctx context.Context, sqlDB *sql.DB, email string) string {
	t.Helper()
	var id string
	if err := sqlDB.QueryRowContext(ctx, `
		INSERT INTO users (email, display_name, email_verified_at)
		VALUES ($1, 'Test Customer', now()) RETURNING id::text
	`, email).Scan(&id); err != nil {
		t.Fatalf("seed customer: %v", err)
	}
	setPassword(t, ctx, sqlDB, auth.CustomerPlane, id)
	return id
}

func seedAdmin(t *testing.T, ctx context.Context, sqlDB *sql.DB, email string) string {
	t.Helper()
	var id string
	if err := sqlDB.QueryRowContext(ctx, `
		INSERT INTO guardian_admin_users (email, display_name, email_verified_at)
		VALUES ($1, 'Test Admin', now()) RETURNING id::text
	`, email).Scan(&id); err != nil {
		t.Fatalf("seed admin: %v", err)
	}
	setPassword(t, ctx, sqlDB, auth.AdminPlane, id)
	return id
}

func setPassword(t *testing.T, ctx context.Context, sqlDB *sql.DB, plane auth.Plane, subjectID string) {
	t.Helper()
	if err := db.InTx(ctx, sqlDB, func(tx *sql.Tx) error {
		return auth.SetPassword(ctx, tx, plane, subjectID, testPassword)
	}); err != nil {
		t.Fatalf("set password: %v", err)
	}
}

func issue(t *testing.T, ctx context.Context, sqlDB *sql.DB, plane auth.Plane, subjectID string, policy auth.SessionPolicy) *auth.IssuedSession {
	t.Helper()
	var session *auth.IssuedSession
	err := db.InTx(ctx, sqlDB, func(tx *sql.Tx) error {
		var err error
		session, err = auth.IssueSession(ctx, tx, plane, policy, auth.IssueOptions{
			SubjectID: subjectID,
			IPAddress: "198.51.100.10",
			UserAgent: "go-test",
		})
		return err
	})
	if err != nil {
		t.Fatalf("issue session: %v", err)
	}
	return session
}

// freezeClock pins auth.Now so idle and expiry behaviour can be tested without
// sleeping, and restores it afterwards.
func freezeClock(t *testing.T, at time.Time) func(time.Time) {
	t.Helper()
	original := auth.Now
	t.Cleanup(func() { auth.Now = original })

	current := at
	auth.Now = func() time.Time { return current }
	return func(next time.Time) { current = next }
}

func TestLoadIdentityByEmail(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)
	seedCustomer(t, ctx, sqlDB, "person@example.com")

	identity, err := auth.LoadIdentityByEmail(ctx, sqlDB, auth.CustomerPlane, "person@example.com")
	if err != nil {
		t.Fatalf("LoadIdentityByEmail: %v", err)
	}
	if !identity.HasPassword() {
		t.Error("a seeded identity should carry its password credential")
	}
	if identity.Status != "ACTIVE" {
		t.Errorf("status = %q, want ACTIVE", identity.Status)
	}

	// The email column is CITEXT, so case must not matter.
	if _, err := auth.LoadIdentityByEmail(ctx, sqlDB, auth.CustomerPlane, "PERSON@Example.COM"); err != nil {
		t.Errorf("lookup should be case-insensitive: %v", err)
	}

	if _, err := auth.LoadIdentityByEmail(ctx, sqlDB, auth.CustomerPlane, "nobody@example.com"); !errors.Is(err, auth.ErrUnknownAccount) {
		t.Errorf("unknown email should give ErrUnknownAccount, got %v", err)
	}
}

// An account with no password must load, and be distinguishable from one that
// does not exist — that is what lets an invited-but-unaccepted staff member be
// handled correctly rather than looking like a typo.
func TestLoadIdentityWithoutCredential(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)

	identity, err := auth.LoadIdentityByEmail(ctx, sqlDB, auth.AdminPlane, "superadmin@guardian.local")
	if err != nil {
		t.Fatalf("the seeded superadmin should load: %v", err)
	}
	if identity.HasPassword() {
		t.Error("the seeded superadmin must ship without a password")
	}
	if err := auth.VerifyIdentityPassword(identity, "anything"); !errors.Is(err, auth.ErrInvalidCredentials) {
		t.Errorf("a credential-less account must not authenticate, got %v", err)
	}
}

func TestVerifyIdentityPassword(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)
	seedCustomer(t, ctx, sqlDB, "person@example.com")

	identity, err := auth.LoadIdentityByEmail(ctx, sqlDB, auth.CustomerPlane, "person@example.com")
	if err != nil {
		t.Fatalf("load: %v", err)
	}

	if err := auth.VerifyIdentityPassword(identity, testPassword); err != nil {
		t.Errorf("the correct password should verify: %v", err)
	}
	if err := auth.VerifyIdentityPassword(identity, "wrong-password-entirely"); !errors.Is(err, auth.ErrInvalidCredentials) {
		t.Errorf("a wrong password should give ErrInvalidCredentials, got %v", err)
	}
	// A nil identity is the unknown-account path; it must fail the same way.
	if err := auth.VerifyIdentityPassword(nil, testPassword); !errors.Is(err, auth.ErrInvalidCredentials) {
		t.Errorf("unknown account should give ErrInvalidCredentials, got %v", err)
	}
}

func TestSessionRoundTrip(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)
	userID := seedCustomer(t, ctx, sqlDB, "person@example.com")

	session := issue(t, ctx, sqlDB, auth.CustomerPlane, userID, auth.DefaultSessionPolicy)

	principal, err := auth.LookupSession(ctx, sqlDB, auth.CustomerPlane, session.Token, auth.DefaultSessionPolicy)
	if err != nil {
		t.Fatalf("LookupSession: %v", err)
	}
	if principal.SubjectID != userID {
		t.Errorf("subject = %s, want %s", principal.SubjectID, userID)
	}
	if principal.Email != "person@example.com" {
		t.Errorf("email = %s", principal.Email)
	}

	// The raw token must not be what is stored, or a database leak is a
	// wholesale session compromise.
	var stored string
	if err := sqlDB.QueryRowContext(ctx, `SELECT token_hash FROM sessions WHERE id = $1`, session.SessionID).Scan(&stored); err != nil {
		t.Fatalf("read stored token: %v", err)
	}
	if stored == session.Token {
		t.Fatal("session tokens must be stored hashed")
	}

	if _, err := auth.LookupSession(ctx, sqlDB, auth.CustomerPlane, "not-a-real-token", auth.DefaultSessionPolicy); !errors.Is(err, auth.ErrNoSession) {
		t.Errorf("a bogus token should give ErrNoSession, got %v", err)
	}
}

// The central isolation property: a customer session token must be meaningless
// on the staff plane, because it is only ever looked up in its own table.
func TestSessionsDoNotCrossPlanes(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)

	userID := seedCustomer(t, ctx, sqlDB, "person@example.com")
	adminID := seedAdmin(t, ctx, sqlDB, "staff@guardian.local")

	customerSession := issue(t, ctx, sqlDB, auth.CustomerPlane, userID, auth.DefaultSessionPolicy)
	adminSession := issue(t, ctx, sqlDB, auth.AdminPlane, adminID, auth.DefaultSessionPolicy)

	if _, err := auth.LookupSession(ctx, sqlDB, auth.AdminPlane, customerSession.Token, auth.DefaultSessionPolicy); !errors.Is(err, auth.ErrNoSession) {
		t.Error("a customer token must not resolve on the admin plane")
	}
	if _, err := auth.LookupSession(ctx, sqlDB, auth.CustomerPlane, adminSession.Token, auth.DefaultSessionPolicy); !errors.Is(err, auth.ErrNoSession) {
		t.Error("an admin token must not resolve on the customer plane")
	}

	// And the planes must use different cookie names, so the browser never even
	// offers one where the other is expected.
	if auth.CustomerPlane.SessionCookie == auth.AdminPlane.SessionCookie {
		t.Error("the two planes must not share a session cookie name")
	}
}

func TestSessionIdleTimeout(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)
	userID := seedCustomer(t, ctx, sqlDB, "person@example.com")

	start := time.Now().UTC()
	advance := freezeClock(t, start)

	policy := auth.SessionPolicy{AbsoluteDays: 30, IdleMinutes: 30, RenewWithinDays: 7}
	session := issue(t, ctx, sqlDB, auth.CustomerPlane, userID, policy)

	// Just inside the idle window.
	advance(start.Add(29 * time.Minute))
	if _, err := auth.LookupSession(ctx, sqlDB, auth.CustomerPlane, session.Token, policy); err != nil {
		t.Fatalf("session should still be live at 29 minutes: %v", err)
	}

	// Past it.
	advance(start.Add(31 * time.Minute))
	_, err := auth.LookupSession(ctx, sqlDB, auth.CustomerPlane, session.Token, policy)
	if !errors.Is(err, auth.ErrSessionIdle) {
		t.Errorf("expected ErrSessionIdle, got %v", err)
	}

	// Idle expiry must be distinguishable from absolute expiry, so the client
	// can explain to the user why they were signed out.
	if errors.Is(err, auth.ErrSessionExpired) {
		t.Error("idle expiry should not be reported as absolute expiry")
	}
}

func TestSessionTouchExtendsIdleWindow(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)
	userID := seedCustomer(t, ctx, sqlDB, "person@example.com")

	start := time.Now().UTC()
	advance := freezeClock(t, start)

	policy := auth.SessionPolicy{AbsoluteDays: 30, IdleMinutes: 30, RenewWithinDays: 7}
	session := issue(t, ctx, sqlDB, auth.CustomerPlane, userID, policy)

	// Activity at 20 minutes should push the deadline out.
	advance(start.Add(20 * time.Minute))
	principal, err := auth.LookupSession(ctx, sqlDB, auth.CustomerPlane, session.Token, policy)
	if err != nil {
		t.Fatalf("lookup at 20 minutes: %v", err)
	}
	if err := auth.TouchSession(ctx, sqlDB, auth.CustomerPlane, principal, policy); err != nil {
		t.Fatalf("TouchSession: %v", err)
	}

	// 45 minutes from the start is only 25 minutes since activity.
	advance(start.Add(45 * time.Minute))
	if _, err := auth.LookupSession(ctx, sqlDB, auth.CustomerPlane, session.Token, policy); err != nil {
		t.Errorf("an active session should survive: %v", err)
	}
}

func TestSessionAbsoluteExpiry(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)
	userID := seedCustomer(t, ctx, sqlDB, "person@example.com")

	start := time.Now().UTC()
	advance := freezeClock(t, start)

	// Idle disabled, so only the absolute cap can end this session.
	policy := auth.SessionPolicy{AbsoluteDays: 1, IdleMinutes: 0, RenewWithinDays: 0}
	session := issue(t, ctx, sqlDB, auth.CustomerPlane, userID, policy)

	advance(start.Add(25 * time.Hour))
	if _, err := auth.LookupSession(ctx, sqlDB, auth.CustomerPlane, session.Token, policy); !errors.Is(err, auth.ErrSessionExpired) {
		t.Errorf("expected ErrSessionExpired, got %v", err)
	}
}

func TestRevokeSession(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)
	userID := seedCustomer(t, ctx, sqlDB, "person@example.com")

	session := issue(t, ctx, sqlDB, auth.CustomerPlane, userID, auth.DefaultSessionPolicy)
	principal, err := auth.LookupSession(ctx, sqlDB, auth.CustomerPlane, session.Token, auth.DefaultSessionPolicy)
	if err != nil {
		t.Fatalf("lookup: %v", err)
	}

	if err := db.InTx(ctx, sqlDB, func(tx *sql.Tx) error {
		return auth.RevokeSession(ctx, tx, auth.CustomerPlane, principal.SessionID, "LOGOUT")
	}); err != nil {
		t.Fatalf("RevokeSession: %v", err)
	}

	if _, err := auth.LookupSession(ctx, sqlDB, auth.CustomerPlane, session.Token, auth.DefaultSessionPolicy); !errors.Is(err, auth.ErrSessionExpired) {
		t.Errorf("a revoked session must not resolve, got %v", err)
	}
}

// A password change signs out the other devices but must not sign out the page
// the user is currently using.
func TestRevokeSessionsForSubjectKeepsCurrent(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)
	userID := seedCustomer(t, ctx, sqlDB, "person@example.com")

	keep := issue(t, ctx, sqlDB, auth.CustomerPlane, userID, auth.DefaultSessionPolicy)
	drop := issue(t, ctx, sqlDB, auth.CustomerPlane, userID, auth.DefaultSessionPolicy)

	var revoked int64
	if err := db.InTx(ctx, sqlDB, func(tx *sql.Tx) error {
		var err error
		revoked, err = auth.RevokeSessionsForSubject(ctx, tx, auth.CustomerPlane, userID, keep.SessionID, "PASSWORD_CHANGE")
		return err
	}); err != nil {
		t.Fatalf("RevokeSessionsForSubject: %v", err)
	}
	if revoked != 1 {
		t.Errorf("revoked %d sessions, want 1", revoked)
	}

	if _, err := auth.LookupSession(ctx, sqlDB, auth.CustomerPlane, keep.Token, auth.DefaultSessionPolicy); err != nil {
		t.Errorf("the current session should survive: %v", err)
	}
	if _, err := auth.LookupSession(ctx, sqlDB, auth.CustomerPlane, drop.Token, auth.DefaultSessionPolicy); err == nil {
		t.Error("the other session should have been revoked")
	}
}

func TestLockoutAfterRepeatedFailures(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)

	policy := auth.DefaultLockoutPolicy
	const email = "target@example.com"
	const ip = "198.51.100.10"

	if err := auth.CheckLockout(ctx, sqlDB, auth.CustomerPlane, email, ip); err != nil {
		t.Fatalf("should start unlocked: %v", err)
	}

	for i := 0; i < policy.MaxFailures; i++ {
		if err := db.InTx(ctx, sqlDB, func(tx *sql.Tx) error {
			return auth.RecordFailure(ctx, tx, auth.CustomerPlane, policy, email, ip)
		}); err != nil {
			t.Fatalf("RecordFailure: %v", err)
		}
	}

	err := auth.CheckLockout(ctx, sqlDB, auth.CustomerPlane, email, ip)
	if !errors.Is(err, auth.ErrLockedOut) {
		t.Fatalf("expected lockout after %d failures, got %v", policy.MaxFailures, err)
	}

	// The client needs a concrete wait to show a countdown.
	var locked *auth.LockedError
	if !errors.As(err, &locked) || locked.RetryAfterSeconds <= 0 {
		t.Errorf("lockout should report a positive retry delay, got %v", err)
	}

	// Clearing on success is what stops an old run of typos counting forever.
	if err := db.InTx(ctx, sqlDB, func(tx *sql.Tx) error {
		return auth.ClearFailures(ctx, tx, auth.CustomerPlane, email, ip)
	}); err != nil {
		t.Fatalf("ClearFailures: %v", err)
	}
	if err := auth.CheckLockout(ctx, sqlDB, auth.CustomerPlane, email, ip); err != nil {
		t.Errorf("should be unlocked after a success: %v", err)
	}
}

// Lockout counters are per plane, so hammering a customer address must not lock
// a staff account that happens to share the email.
func TestLockoutIsScopedPerPlane(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)

	const email = "shared@guardian.local"
	const ip = "198.51.100.10"

	for i := 0; i < auth.DefaultLockoutPolicy.MaxFailures; i++ {
		if err := db.InTx(ctx, sqlDB, func(tx *sql.Tx) error {
			return auth.RecordFailure(ctx, tx, auth.CustomerPlane, auth.DefaultLockoutPolicy, email, ip)
		}); err != nil {
			t.Fatalf("RecordFailure: %v", err)
		}
	}

	if err := auth.CheckLockout(ctx, sqlDB, auth.CustomerPlane, email, ip); !errors.Is(err, auth.ErrLockedOut) {
		t.Fatal("the customer plane should be locked")
	}
	if err := auth.CheckLockout(ctx, sqlDB, auth.AdminPlane, email, ip); err != nil {
		t.Errorf("the admin plane must be unaffected: %v", err)
	}
}

// The per-IP counter has to bite even when each attempt targets a new address,
// or spreading guesses across accounts evades the limit entirely.
func TestLockoutByIPAcrossAccounts(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)

	const ip = "203.0.113.44"
	emails := []string{"a@example.com", "b@example.com", "c@example.com", "d@example.com", "e@example.com"}

	for _, email := range emails {
		if err := db.InTx(ctx, sqlDB, func(tx *sql.Tx) error {
			return auth.RecordFailure(ctx, tx, auth.CustomerPlane, auth.DefaultLockoutPolicy, email, ip)
		}); err != nil {
			t.Fatalf("RecordFailure: %v", err)
		}
	}

	// A sixth, previously untouched account from the same source is refused.
	if err := auth.CheckLockout(ctx, sqlDB, auth.CustomerPlane, "f@example.com", ip); !errors.Is(err, auth.ErrLockedOut) {
		t.Errorf("the source address should be locked out, got %v", err)
	}
	// A different source is unaffected.
	if err := auth.CheckLockout(ctx, sqlDB, auth.CustomerPlane, "f@example.com", "198.51.100.1"); err != nil {
		t.Errorf("a different source should be unaffected: %v", err)
	}
}

func TestSetPasswordRevokesPrevious(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)
	userID := seedCustomer(t, ctx, sqlDB, "person@example.com")

	if err := db.InTx(ctx, sqlDB, func(tx *sql.Tx) error {
		return auth.SetPassword(ctx, tx, auth.CustomerPlane, userID, "a-brand-new-passphrase")
	}); err != nil {
		t.Fatalf("SetPassword: %v", err)
	}

	identity, err := auth.LoadIdentityByEmail(ctx, sqlDB, auth.CustomerPlane, "person@example.com")
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if err := auth.VerifyIdentityPassword(identity, "a-brand-new-passphrase"); err != nil {
		t.Errorf("the new password should verify: %v", err)
	}
	if err := auth.VerifyIdentityPassword(identity, testPassword); !errors.Is(err, auth.ErrInvalidCredentials) {
		t.Error("the old password must stop working")
	}

	// The old row is kept but revoked, so the history of the change survives.
	var live int
	if err := sqlDB.QueryRowContext(ctx, `
		SELECT count(*) FROM user_credentials WHERE user_id = $1 AND revoked_at IS NULL
	`, userID).Scan(&live); err != nil {
		t.Fatalf("count credentials: %v", err)
	}
	if live != 1 {
		t.Errorf("expected exactly one live credential, got %d", live)
	}
}

func TestMFAMethodLifecycle(t *testing.T) {
	ctx := context.Background()
	sqlDB := authtest.Postgres(t)
	adminID := seedAdmin(t, ctx, sqlDB, "staff@guardian.local")
	plane := auth.AdminPlane

	var methodID string
	if err := db.InTx(ctx, sqlDB, func(tx *sql.Tx) error {
		var err error
		methodID, err = auth.CreateMFAMethod(ctx, tx, plane, adminID, "TOTP", "Phone", "sealed-secret")
		return err
	}); err != nil {
		t.Fatalf("CreateMFAMethod: %v", err)
	}

	// An unverified enrolment must not count as protection, or an abandoned
	// setup would satisfy an MFA requirement it never actually met.
	methods, err := auth.ListMFAMethods(ctx, sqlDB, plane, adminID)
	if err != nil {
		t.Fatalf("ListMFAMethods: %v", err)
	}
	if len(methods) != 0 {
		t.Errorf("unverified methods should not be listed, got %d", len(methods))
	}

	if err := db.InTx(ctx, sqlDB, func(tx *sql.Tx) error {
		return auth.VerifyMFAMethod(ctx, tx, plane, adminID, methodID)
	}); err != nil {
		t.Fatalf("VerifyMFAMethod: %v", err)
	}

	methods, err = auth.ListMFAMethods(ctx, sqlDB, plane, adminID)
	if err != nil {
		t.Fatalf("ListMFAMethods: %v", err)
	}
	if len(methods) != 1 {
		t.Fatalf("expected 1 verified method, got %d", len(methods))
	}
	if !methods[0].IsPrimary {
		t.Error("the first verified method should become primary")
	}

	if err := db.InTx(ctx, sqlDB, func(tx *sql.Tx) error {
		count, err := auth.CountVerifiedMFAMethods(ctx, tx, plane, adminID, true)
		if err != nil {
			return err
		}
		if count != 1 {
			t.Errorf("CountVerifiedMFAMethods = %d, want 1", count)
		}
		return auth.RevokeMFAMethod(ctx, tx, plane, adminID, methodID)
	}); err != nil {
		t.Fatalf("revoke: %v", err)
	}

	methods, err = auth.ListMFAMethods(ctx, sqlDB, plane, adminID)
	if err != nil {
		t.Fatalf("ListMFAMethods: %v", err)
	}
	if len(methods) != 0 {
		t.Errorf("a revoked method should not be listed, got %d", len(methods))
	}
}

func TestDecideMFA(t *testing.T) {
	enrolled := []auth.MFAMethod{{ID: "m1", MethodType: "TOTP"}}

	tests := []struct {
		name           string
		identity       *auth.Identity
		methods        []auth.MFAMethod
		policyRequires bool
		want           auth.Decision
	}{
		{"enrolled always challenges", &auth.Identity{}, enrolled, false, auth.DecisionMFARequired},
		{"policy forces enrolment", &auth.Identity{}, nil, true, auth.DecisionMFAEnrollmentRequired},
		{"account flag forces enrolment", &auth.Identity{MFARequired: true}, nil, false, auth.DecisionMFAEnrollmentRequired},
		{"otherwise straight through", &auth.Identity{}, nil, false, auth.DecisionAuthenticated},
		// The account flag can only tighten policy, never relax it.
		{"enrolment wins over nothing", &auth.Identity{MFARequired: true}, enrolled, true, auth.DecisionMFARequired},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := auth.DecideMFA(tc.identity, tc.methods, tc.policyRequires); got != tc.want {
				t.Errorf("DecideMFA() = %v, want %v", got, tc.want)
			}
		})
	}
}
