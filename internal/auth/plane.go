// Package auth is the authentication engine shared by both identity planes.
//
// Guardian runs two deliberately separate identity domains: customer users
// (`users`) and Guardian staff (`guardian_admin_users`). They need identical
// password, session, MFA and lockout semantics over different tables, so the
// logic is written once here and parameterised by Plane.
//
// The isolation between planes is structural rather than conditional: a session
// is only ever looked up in its own plane's table, under its own cookie name, so
// there is no code path by which a customer credential becomes a staff
// principal. See internal/api/cross_plane_test.go.
package auth

// Plane names the physical tables and cookies backing one identity plane.
//
// There are exactly two values, CustomerPlane and AdminPlane. This is a
// configuration record, not an extension point — adding a third would need the
// cross-plane isolation tests revisited first.
type Plane struct {
	// Name is the discriminator written to plane columns and audit rows.
	Name string

	UsersTable       string
	CredentialsTable string
	MFATable         string
	SessionsTable    string

	// SubjectColumn is the foreign key to UsersTable used by the credentials,
	// MFA and sessions tables. It is uniform across all three within a plane.
	SubjectColumn string

	// HasTenantContext is true where sessions carry active_tenant_id. Staff
	// sessions do not: Guardian administration is never tenant-scoped.
	HasTenantContext bool

	SessionCookie   string
	CSRFCookie      string
	ChallengeCookie string

	AuditActorType string
}

// Table and column names below are compile-time constants. They are the only
// values ever interpolated into SQL with fmt.Sprintf; every value originating
// from a request stays a $n placeholder.
var (
	CustomerPlane = Plane{
		Name:             "customer",
		UsersTable:       "users",
		CredentialsTable: "user_credentials",
		MFATable:         "mfa_methods",
		SessionsTable:    "sessions",
		SubjectColumn:    "user_id",
		HasTenantContext: true,
		SessionCookie:    "guardian_session",
		CSRFCookie:       "guardian_csrf",
		ChallengeCookie:  "guardian_mfa",
		AuditActorType:   "USER",
	}

	AdminPlane = Plane{
		Name:             "admin",
		UsersTable:       "guardian_admin_users",
		CredentialsTable: "guardian_admin_credentials",
		MFATable:         "guardian_admin_mfa_methods",
		SessionsTable:    "guardian_admin_sessions",
		SubjectColumn:    "admin_user_id",
		HasTenantContext: false,
		SessionCookie:    "guardian_admin_session",
		CSRFCookie:       "guardian_admin_csrf",
		ChallengeCookie:  "guardian_admin_mfa",
		AuditActorType:   "GUARDIAN_ADMIN",
	}
)

// IsAdmin reports whether this is the Guardian staff plane.
func (p Plane) IsAdmin() bool { return p.Name == AdminPlane.Name }
