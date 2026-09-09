package api

import (
	"log"
	"net/http"
	"sync/atomic"

	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/config"
)

// Retiring the pre-session authentication seams.
//
// Before sessions existed, two functions stood in for authentication:
// platformAuthorized (a shared dev bearer token) and resolvePersonalUserID
// (which simply trusted an X-User-Id header). A working frontend calls both
// today, so they cannot be deleted in one step.
//
// The retirement is staged by AUTH_LEGACY_MODE:
//
//	on   - a real session wins; the header/token fallback still works
//	warn - the fallback still works but every use is logged, so the remaining
//	       callers become visible before anything is removed
//	off  - the fallback is refused
//
// Once the logs are silent under "warn", the mode moves to "off" and both
// functions plus GUARDIAN_PLATFORM_DEV_TOKEN can be deleted outright.

// legacyMode is process-wide because the two seam functions are package-level
// and reached from handlers that have no Env. It is set once at router
// construction and only read afterwards.
var legacyMode atomic.Value

func setLegacyMode(mode string) { legacyMode.Store(mode) }

func legacyModeValue() string {
	if v, ok := legacyMode.Load().(string); ok {
		return v
	}
	return config.LegacyModeOn
}

// legacyFallbackAllowed reports whether the pre-session path may still be used,
// logging the call when running in warn mode.
func legacyFallbackAllowed(r *http.Request, seam string) bool {
	switch legacyModeValue() {
	case config.LegacyModeOff:
		return false
	case config.LegacyModeWarn:
		log.Printf("legacy_auth_fallback seam=%s method=%s path=%s request_id=%s",
			seam, r.Method, r.URL.Path, RequestIDFromContext(r.Context()))
		return true
	default:
		return true
	}
}

// adminPrincipalID returns the authenticated staff id, if the request carries a
// real session. This is the replacement both seams consult first.
func adminPrincipalID(r *http.Request) (string, bool) {
	principal := auth.PrincipalForPlane(r.Context(), auth.AdminPlane)
	if principal == nil {
		return "", false
	}
	return principal.SubjectID, true
}
