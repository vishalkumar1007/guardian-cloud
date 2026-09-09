package auth

import (
	"context"
	"time"
)

type ctxKey string

const principalKey ctxKey = "auth_principal"

// Principal is the authenticated caller behind the current request.
//
// It is only ever constructed by session middleware after a token has been
// matched in its own plane's table, so its presence in a context is proof of
// authentication on that specific plane.
type Principal struct {
	Plane     Plane
	SubjectID string
	Email     string
	Name      string

	SessionID string
	// CSRFTokenHash is compared against the X-CSRF-Token header on unsafe
	// methods. Bound to the session rather than only to a cookie, so a stolen or
	// injected CSRF cookie alone proves nothing.
	CSRFTokenHash  string
	IssuedAt       time.Time
	ExpiresAt      time.Time
	LastActivityAt time.Time
	IdleExpiresAt  time.Time
	MFASatisfied   bool
	AuthMethod     string

	// ActiveTenantID is a UI convenience only. Authorization is always resolved
	// from memberships server-side; this field is never used as proof of access.
	ActiveTenantID string

	// Permissions holds expanded permission keys for staff principals, resolved
	// once per request. Empty on the customer plane, which uses memberships.
	Permissions map[string]struct{}

	// LegacyFallback marks a principal derived from the pre-session X-User-Id or
	// dev-token path rather than a real session. Used to report on remaining
	// legacy callers while AUTH_LEGACY_MODE is being retired.
	LegacyFallback bool
}

// Has reports whether the principal holds a permission key. Patterns are already
// expanded at load time, so this is a plain lookup.
func (p *Principal) Has(permission string) bool {
	if p == nil {
		return false
	}
	_, ok := p.Permissions[permission]
	return ok
}

// PermissionList returns the caller's permissions for the /me response, which is
// what drives menu visibility in the frontend.
func (p *Principal) PermissionList() []string {
	out := make([]string, 0, len(p.Permissions))
	for key := range p.Permissions {
		out = append(out, key)
	}
	return out
}

// WithPrincipal stores the authenticated caller on the request context.
func WithPrincipal(ctx context.Context, p *Principal) context.Context {
	return context.WithValue(ctx, principalKey, p)
}

// PrincipalFromContext returns the caller, or nil when unauthenticated.
func PrincipalFromContext(ctx context.Context) *Principal {
	if v, ok := ctx.Value(principalKey).(*Principal); ok {
		return v
	}
	return nil
}

// PrincipalForPlane returns the caller only if they authenticated on the given
// plane. Handlers serving one plane use this so a principal from the other can
// never satisfy them, even if middleware were mounted incorrectly.
func PrincipalForPlane(ctx context.Context, plane Plane) *Principal {
	p := PrincipalFromContext(ctx)
	if p == nil || p.Plane.Name != plane.Name {
		return nil
	}
	return p
}
