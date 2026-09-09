package api

import (
	"context"
	"crypto/subtle"
	"net/http"
	"net/netip"
	"strings"

	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/authz"
	"guardian-cloud/internal/crypto"
	"guardian-cloud/internal/netutil"
	"guardian-cloud/internal/settings"
)

// RequireSession authenticates the caller on one plane, or rejects the request.
//
// The token is looked up only in this plane's sessions table, under this plane's
// cookie name. That is what makes cross-plane isolation structural rather than a
// conditional somebody can forget: a customer cookie presented here is simply
// not present, so there is no code path by which it becomes a staff principal.
func (e *Env) RequireSession(plane auth.Plane) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			principal, err := e.resolveSession(r, plane)
			if err != nil {
				// Clear the cookies so a dead token stops being resent on every
				// subsequent request.
				auth.ClearSessionCookies(w, plane, e.CookieConfig())
				writeJSON(w, http.StatusUnauthorized, map[string]string{
					"error":  "authentication required",
					"reason": sessionFailureReason(err),
				})
				return
			}

			ctx := auth.WithPrincipal(r.Context(), principal)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// OptionalSession attaches a principal when one is present and otherwise does
// nothing.
//
// This is the migration path for the endpoints that still rely on the pre-session
// X-User-Id and dev-token seams: a real session takes precedence, and the legacy
// fallback in those handlers keeps working until AUTH_LEGACY_MODE is turned off.
func (e *Env) OptionalSession(plane auth.Plane) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			principal, err := e.resolveSession(r, plane)
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}
			next.ServeHTTP(w, r.WithContext(auth.WithPrincipal(r.Context(), principal)))
		})
	}
}

func (e *Env) resolveSession(r *http.Request, plane auth.Plane) (*auth.Principal, error) {
	token := auth.ReadCookie(r, plane.SessionCookie)
	if token == "" {
		return nil, auth.ErrNoSession
	}

	policy := e.SessionPolicy(r.Context())
	principal, err := auth.LookupSession(r.Context(), e.DB, plane, token, policy)
	if err != nil {
		return nil, err
	}

	// Activity tracking is best-effort: a failed bump must not fail the request
	// it accompanies. Worst case the idle deadline is a minute stale.
	_ = auth.TouchSession(r.Context(), e.DB, plane, principal, policy)

	if plane.IsAdmin() {
		grants, err := authz.ResolveAdminGrants(r.Context(), e.DB, principal.SubjectID)
		if err != nil {
			return nil, err
		}
		principal.Permissions = grants.Permissions
	}
	return principal, nil
}

// sessionFailureReason tells the client why it was signed out, so an idle
// timeout can be explained rather than looking like a bug.
func sessionFailureReason(err error) string {
	switch err {
	case auth.ErrSessionIdle:
		return "idle_timeout"
	case auth.ErrSessionExpired:
		return "expired"
	case auth.ErrAccountDisabled:
		return "account_disabled"
	default:
		return "no_session"
	}
}

// safeMethods do not change state and so need no CSRF token.
var safeMethods = map[string]bool{
	http.MethodGet: true, http.MethodHead: true, http.MethodOptions: true,
}

// RequireSameOrigin guards unauthenticated state-changing endpoints (login,
// password reset). They have no session yet, so there is no token to bind to and
// the Origin header is the available defence.
func (e *Env) RequireSameOrigin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if safeMethods[r.Method] {
			next.ServeHTTP(w, r)
			return
		}
		if origin := r.Header.Get("Origin"); origin != "" && !e.allowedOrigin(origin) {
			writeJSON(w, http.StatusForbidden, map[string]string{"error": "cross-origin request rejected"})
			return
		}
		next.ServeHTTP(w, r)
	})
}

// CSRFVerify protects cookie-authenticated state changes.
//
// MUST be mounted after RequireSession: it needs the principal to compare
// against, and it fails closed when there is none rather than waving the request
// through. (An earlier arrangement had it running first, which silently reduced
// every authenticated mutation to an Origin check.)
//
// Two independent checks. The Origin header must be one we serve, and
// X-CSRF-Token must hash to the value bound to this session — not merely match a
// cookie, so an attacker able to set cookies but not read the session response
// still fails.
func (e *Env) CSRFVerify(plane auth.Plane) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if safeMethods[r.Method] {
				next.ServeHTTP(w, r)
				return
			}

			if origin := r.Header.Get("Origin"); origin != "" && !e.allowedOrigin(origin) {
				writeJSON(w, http.StatusForbidden, map[string]string{"error": "cross-origin request rejected"})
				return
			}

			principal := auth.PrincipalForPlane(r.Context(), plane)
			if principal == nil || principal.CSRFTokenHash == "" {
				writeJSON(w, http.StatusForbidden, map[string]string{"error": "invalid or missing CSRF token"})
				return
			}

			supplied := r.Header.Get("X-CSRF-Token")
			if supplied == "" ||
				subtle.ConstantTimeCompare([]byte(crypto.HashToken(supplied)), []byte(principal.CSRFTokenHash)) != 1 {
				writeJSON(w, http.StatusForbidden, map[string]string{"error": "invalid or missing CSRF token"})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// IPAllowlist refuses requests from outside the configured ranges.
//
// Mounted before authentication so a denied address never reaches credential
// verification, and no login_attempts row records which account it was after.
func (e *Env) IPAllowlist(plane auth.Plane) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !e.Settings.Bool(r.Context(), settings.KeyIPAllowlistEnabled) {
				next.ServeHTTP(w, r)
				return
			}

			rules, err := e.allowlistRules(r.Context(), plane.Name)
			if err != nil {
				writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to evaluate ip allowlist"})
				return
			}
			// An enabled-but-empty allowlist would lock everyone out, including
			// whoever needs to fix it. Treat it as not configured.
			if len(rules) == 0 {
				next.ServeHTTP(w, r)
				return
			}

			addr := ClientIPFromContext(r.Context())
			if !addr.IsValid() || !netutil.Allowed(addr, rules) {
				writeJSON(w, http.StatusForbidden, map[string]string{
					"error": "your network is not permitted to access this service",
				})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func (e *Env) allowlistRules(ctx context.Context, plane string) ([]netip.Prefix, error) {
	rows, err := e.DB.QueryContext(ctx, `
		SELECT cidr::text FROM ip_allowlist_rules WHERE plane = $1
	`, plane)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []string
	for rows.Next() {
		var cidr string
		if err := rows.Scan(&cidr); err != nil {
			return nil, err
		}
		entries = append(entries, cidr)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return netutil.ParseCIDRList(entries)
}

func (e *Env) allowedOrigin(origin string) bool {
	origin = strings.TrimRight(origin, "/")
	for allowed := range e.origins() {
		if origin == allowed {
			return true
		}
	}
	return false
}
