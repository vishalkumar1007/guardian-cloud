package authz

import (
	"encoding/json"
	"net/http"

	"guardian-cloud/internal/auth"
)

// RequirePermission rejects a request unless the caller holds the permission.
//
// Mounted per route group rather than checked inside handlers, so a new endpoint
// added to a protected group inherits the gate instead of quietly shipping
// without one.
//
// This assumes session middleware has already run and, on failure, returns 403
// rather than 401 — the caller is authenticated, just not authorised.
func RequirePermission(permission string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			principal := auth.PrincipalForPlane(r.Context(), auth.AdminPlane)
			if principal == nil {
				writeError(w, http.StatusUnauthorized, "authentication required")
				return
			}
			if !principal.Has(permission) {
				// The message names the missing permission: this is an internal
				// staff console, and a support ticket saying "403" with no
				// detail helps nobody.
				writeError(w, http.StatusForbidden, "missing required permission: "+permission)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequireAnyPermission admits a caller holding at least one of the permissions,
// for endpoints legitimately reachable by more than one role.
func RequireAnyPermission(permissions ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			principal := auth.PrincipalForPlane(r.Context(), auth.AdminPlane)
			if principal == nil {
				writeError(w, http.StatusUnauthorized, "authentication required")
				return
			}
			for _, permission := range permissions {
				if principal.Has(permission) {
					next.ServeHTTP(w, r)
					return
				}
			}
			writeError(w, http.StatusForbidden, "insufficient permissions")
		})
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}
