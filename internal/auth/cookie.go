package auth

import (
	"net/http"
	"time"
)

// CookieConfig carries the deployment-dependent cookie attributes.
type CookieConfig struct {
	// Secure must be true anywhere but plain-http local development.
	Secure bool
	Domain string
}

// ChallengeTTL bounds the half-authenticated window between a correct password
// and a satisfied MFA challenge.
const ChallengeTTL = 5 * time.Minute

// SetSessionCookies writes the session and CSRF cookies for a plane.
//
// The session token is httpOnly: script cannot read it, so an XSS flaw cannot
// exfiltrate a live session. The CSRF token deliberately is not, because the
// frontend has to read it to echo it back in the X-CSRF-Token header.
//
// SameSite=Lax (not Strict) because the SSO callback returns as a top-level
// cross-site navigation and must arrive with the cookie attached. Lax permits
// that for GET while still blocking cross-site POST, which is the case CSRF
// actually cares about.
func SetSessionCookies(w http.ResponseWriter, plane Plane, cfg CookieConfig, session *IssuedSession) {
	maxAge := int(time.Until(session.ExpiresAt).Seconds())
	if maxAge < 0 {
		maxAge = 0
	}

	http.SetCookie(w, &http.Cookie{
		Name:     plane.SessionCookie,
		Value:    session.Token,
		Path:     "/",
		Domain:   cfg.Domain,
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   cfg.Secure,
		SameSite: http.SameSiteLaxMode,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     plane.CSRFCookie,
		Value:    session.CSRFToken,
		Path:     "/",
		Domain:   cfg.Domain,
		MaxAge:   maxAge,
		HttpOnly: false, // read by the frontend to populate X-CSRF-Token
		Secure:   cfg.Secure,
		SameSite: http.SameSiteLaxMode,
	})
}

// ClearSessionCookies removes both cookies. Called on logout and whenever a
// token fails to resolve, so a stale cookie stops being resent on every request.
func ClearSessionCookies(w http.ResponseWriter, plane Plane, cfg CookieConfig) {
	for _, name := range []string{plane.SessionCookie, plane.CSRFCookie} {
		http.SetCookie(w, &http.Cookie{
			Name:     name,
			Value:    "",
			Path:     "/",
			Domain:   cfg.Domain,
			MaxAge:   -1,
			HttpOnly: name == plane.SessionCookie,
			Secure:   cfg.Secure,
			SameSite: http.SameSiteLaxMode,
		})
	}
}

// SetChallengeCookie carries the pending-MFA token.
//
// A distinct short-lived cookie, not a flag on the session cookie: the challenge
// is not a session, and nothing that reads session cookies can accidentally
// treat it as one.
func SetChallengeCookie(w http.ResponseWriter, plane Plane, cfg CookieConfig, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     plane.ChallengeCookie,
		Value:    token,
		Path:     "/",
		Domain:   cfg.Domain,
		MaxAge:   int(ChallengeTTL.Seconds()),
		HttpOnly: true,
		Secure:   cfg.Secure,
		SameSite: http.SameSiteLaxMode,
	})
}

// ClearChallengeCookie removes the pending-MFA cookie once it is spent.
func ClearChallengeCookie(w http.ResponseWriter, plane Plane, cfg CookieConfig) {
	http.SetCookie(w, &http.Cookie{
		Name:     plane.ChallengeCookie,
		Value:    "",
		Path:     "/",
		Domain:   cfg.Domain,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   cfg.Secure,
		SameSite: http.SameSiteLaxMode,
	})
}

// ReadCookie returns a cookie value, or "" when absent.
func ReadCookie(r *http.Request, name string) string {
	c, err := r.Cookie(name)
	if err != nil {
		return ""
	}
	return c.Value
}
