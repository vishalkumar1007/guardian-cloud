package api

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/authz"
	"guardian-cloud/internal/config"
	"guardian-cloud/internal/crypto"
	"guardian-cloud/internal/mail"
)

type RouterDeps struct {
	DB     *sql.DB
	Config *config.Config
	Sealer *crypto.Sealer
	Mailer *mail.Mailer
}

func NewRouter(deps RouterDeps) http.Handler {
	env := NewEnv(deps.DB, deps.Config, deps.Sealer, deps.Mailer)
	setLegacyMode(deps.Config.AuthLegacyMode)

	r := chi.NewRouter()
	r.Use(chimw.Recoverer)
	r.Use(RequestID)
	r.Use(SecurityHeaders)
	// Deliberately not chimw.RealIP, which trusts the leftmost X-Forwarded-For
	// entry — a client-controlled value that lockout and the IP allowlist are
	// both keyed on. See ClientIP in middleware.go.
	r.Use(ClientIP(deps.Config.TrustedProxyCIDRs))
	r.Use(cors(env))

	r.Get("/healthz", healthz)

	theme := &ThemeHandler{DB: deps.DB}
	platform := &PlatformHandler{DB: deps.DB}
	adminSettings := &AdminSettingsHandler{DB: deps.DB}
	dashboardTheme := &DashboardThemeHandler{DB: deps.DB}

	customerAuth := &AuthHandler{Env: env, Plane: auth.CustomerPlane}
	adminAuth := &AuthHandler{Env: env, Plane: auth.AdminPlane}
	portal := &PortalHandler{Env: env}
	ssoAdmin := &SSOAdminHandler{Env: env}
	customerSelf := &SelfServiceHandler{Env: env, Plane: auth.CustomerPlane}
	adminSelf := &SelfServiceHandler{Env: env, Plane: auth.AdminPlane}

	// Customer identity plane.
	r.Route("/api/v1/auth", func(ar chi.Router) {
		// Pre-session endpoints: no principal exists yet to bind a CSRF token
		// to, so the Origin header is the available defence.
		ar.Group(func(pr chi.Router) {
			pr.Use(env.RequireSameOrigin)
			pr.Post("/signup", customerAuth.Signup)
			pr.Post("/login", customerAuth.Login)
			pr.Post("/login/mfa", customerAuth.VerifyMFA)
			pr.Post("/email/verify", customerAuth.VerifyEmail)
			pr.Post("/email/verify/resend", customerAuth.ResendVerification)
			pr.Post("/password/forgot", customerAuth.ForgotPassword)
			pr.Post("/password/reset", customerAuth.ResetPassword)
		})

		// Social sign-in. The provider list is public because the login page
		// renders its buttons before anyone is authenticated. Start and callback
		// are top-level browser navigations, so they carry no CSRF token — the
		// single-use, expiring `state` is what protects them.
		ar.Get("/sso/providers", customerAuth.PublicProviders)
		ar.Get("/sso/{slug}/start", customerAuth.StartSSO)
		ar.Get("/sso/{slug}/callback", customerAuth.CallbackSSO)

		// Authenticated endpoints. RequireSession must come before CSRFVerify,
		// which needs the principal to compare the token against.
		ar.Group(func(pr chi.Router) {
			pr.Use(env.RequireSession(auth.CustomerPlane))
			pr.Use(env.CSRFVerify(auth.CustomerPlane))
			pr.Post("/logout", customerAuth.Logout)
			pr.Get("/me", customerAuth.Me)
			pr.Get("/csrf", customerAuth.CSRF)
		})

		// Reachable with a session or an enrolment challenge — see the staff
		// plane above for why.
		ar.Group(func(pr chi.Router) {
			pr.Use(env.OptionalSession(auth.CustomerPlane))
			pr.Use(env.RequireSameOrigin)
			pr.Get("/mfa", customerSelf.ListMFA)
			pr.Post("/mfa/totp", customerSelf.StartTOTPEnrollment)
			pr.Post("/mfa/totp/{id}/verify", customerSelf.VerifyTOTPEnrollment)
		})
	})

	// Customer personal workspace and account security.
	r.Route("/api/v1/me", func(mr chi.Router) {
		mr.Use(env.RequireSession(auth.CustomerPlane))
		mr.Use(env.CSRFVerify(auth.CustomerPlane))
		mr.Get("/overview", portal.Overview)
		mr.Patch("/profile", portal.UpdateProfile)
		mr.Delete("/mfa/{id}", customerSelf.DeleteMFA)
		mr.Post("/mfa/recovery-codes", customerSelf.RegenerateRecoveryCodes)
		mr.Get("/sessions", customerSelf.ListSessions)
		mr.Delete("/sessions/{id}", customerSelf.RevokeSession)
		mr.Delete("/sessions", customerSelf.RevokeOtherSessions)
		mr.Post("/password", customerSelf.ChangePassword)
	})

	// Guardian staff plane. The IP allowlist sits outermost so a denied address
	// is refused before any credential is examined.
	r.Route("/api/v1/admin", func(ar chi.Router) {
		ar.Use(env.IPAllowlist(auth.AdminPlane))

		ar.Route("/auth", func(pr chi.Router) {
			// First-run setup. Unauthenticated by necessity: the client has to
			// know which screen to show before anyone can sign in, and on a
			// fresh database no account exists to authenticate as. Both close
			// permanently once the first super admin is created — see
			// setup_handlers.go.
			pr.Get("/setup-status", adminAuth.SetupStatus)

			pr.Group(func(sr chi.Router) {
				sr.Use(env.RequireSameOrigin)
				sr.Post("/setup", adminAuth.CompleteSetup)
				sr.Post("/login", adminAuth.Login)
				sr.Post("/login/mfa", adminAuth.VerifyMFA)
				// Staff have no signup; recovery still applies.
				sr.Post("/password/forgot", adminAuth.ForgotPassword)
				sr.Post("/password/reset", adminAuth.ResetPassword)
			})

			pr.Get("/sso/providers", adminAuth.PublicProviders)
			pr.Get("/sso/{slug}/start", adminAuth.StartSSO)
			pr.Get("/sso/{slug}/callback", adminAuth.CallbackSSO)

			pr.Group(func(sr chi.Router) {
				sr.Use(env.RequireSession(auth.AdminPlane))
				sr.Use(env.CSRFVerify(auth.AdminPlane))
				sr.Post("/logout", adminAuth.Logout)
				sr.Get("/me", adminAuth.Me)
				sr.Get("/csrf", adminAuth.CSRF)
			})

			// MFA enrolment is reachable either with a session or with an
			// enrolment challenge, because someone forced to enrol mid-login has
			// no session yet — the handler resolves whichever applies. Removal,
			// sessions and password changes need a full session and live under
			// /account below.
			pr.Group(func(sr chi.Router) {
				sr.Use(env.OptionalSession(auth.AdminPlane))
				sr.Use(env.RequireSameOrigin)
				sr.Get("/mfa", adminSelf.ListMFA)
				sr.Post("/mfa/totp", adminSelf.StartTOTPEnrollment)
				sr.Post("/mfa/totp/{id}/verify", adminSelf.VerifyTOTPEnrollment)
			})
		})

		// Staff account security, session required throughout.
		ar.Route("/account", func(pr chi.Router) {
			pr.Use(env.RequireSession(auth.AdminPlane))
			pr.Use(env.CSRFVerify(auth.AdminPlane))
			pr.Delete("/mfa/{id}", adminSelf.DeleteMFA)
			pr.Post("/mfa/recovery-codes", adminSelf.RegenerateRecoveryCodes)
			pr.Get("/sessions", adminSelf.ListSessions)
			pr.Delete("/sessions/{id}", adminSelf.RevokeSession)
			pr.Delete("/sessions", adminSelf.RevokeOtherSessions)
			pr.Post("/password", adminSelf.ChangePassword)
		})

		// Theme and per-user settings predate sessions and are called by a
		// frontend that still authenticates with X-User-Id. OptionalSession
		// attaches a real principal when one exists; the handlers fall back to
		// the legacy header while AUTH_LEGACY_MODE allows it. Swapped for
		// RequireSession once the frontend has migrated.
		ar.Group(func(pr chi.Router) {
			pr.Use(env.OptionalSession(auth.AdminPlane))

			pr.Get("/dashboard-theme", dashboardTheme.Get)
			pr.Put("/dashboard-theme", dashboardTheme.Put)
			pr.Delete("/dashboard-theme", dashboardTheme.Delete)

			pr.Route("/settings", func(sr chi.Router) {
				sr.Get("/", adminSettings.List)
				sr.Get("/{category}", adminSettings.GetCategory)
				sr.Put("/{category}", adminSettings.PutCategory)
			})
		})

		// Social sign-in configuration. Managing who can reach the login pages
		// is squarely platform settings, so it carries that permission.
		ar.Route("/sso-providers", func(pr chi.Router) {
			pr.Use(env.RequireSession(auth.AdminPlane))
			pr.Use(env.CSRFVerify(auth.AdminPlane))
			pr.Use(authz.RequirePermission("platform.settings.manage"))

			pr.Get("/", ssoAdmin.List)
			pr.Post("/", ssoAdmin.Create)
			pr.Patch("/{id}", ssoAdmin.Update)
			pr.Delete("/{id}", ssoAdmin.Delete)
			pr.Post("/{id}/test", ssoAdmin.Test)
			pr.Post("/{id}/enable", ssoAdmin.SetEnabled(true))
			pr.Post("/{id}/disable", ssoAdmin.SetEnabled(false))
		})
	})

	// Platform read endpoints. Also on OptionalSession until the frontend
	// migrates, after which these gain RequireSession plus a per-route
	// permission check.
	r.Route("/api/v1/platform", func(pr chi.Router) {
		pr.Use(env.OptionalSession(auth.AdminPlane))

		// The login screen renders the brand theme before any session exists,
		// so the read stays public. Only the write is gated.
		pr.Get("/theme", theme.Get)
		pr.Put("/theme", theme.Put)

		pr.Get("/organizations", platform.Organizations)
		pr.Get("/users", platform.Users)
		pr.Get("/devices", platform.Devices)
		pr.Get("/agents", platform.Agents)
		pr.Get("/plans", platform.Plans)
		pr.Get("/subscriptions", platform.Subscriptions)
		pr.Get("/system-health", platform.SystemHealth)
		pr.Get("/audit", platform.Audit)
		pr.Get("/support", platform.Support)
	})

	return r
}

// cors answers browser preflights and marks responses as readable by the app.
//
// Credentialed CORS is mandatory here because the session lives in an httpOnly
// cookie: without Allow-Credentials the browser discards the response entirely,
// and script sees only an opaque "failed to fetch" with no clue why.
func cors(env *Env) func(http.Handler) http.Handler {
	origins := env.origins()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if _, ok := origins[strings.TrimRight(origin, "/")]; ok {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token, X-Platform-Token, X-Request-ID, X-User-Id, X-User-ID, X-User-Email, X-Tenant-Id, X-Tenant-ID, X-Tenant-User-Id")
				// Session cookies are httpOnly, so the browser only sends them
				// cross-origin when this is set. It also forbids a wildcard
				// origin, which the exact-match allowlist above already avoids.
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Max-Age", "600")
			}
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// APIRevision identifies the feature set this build serves.
//
// Bumped whenever routes are added. A stale container answering /healthz with
// 200 while every new endpoint 404s is otherwise very hard to spot; the client
// compares this and says "your API is out of date" instead of "failed to fetch".
const APIRevision = "2026.09-auth"

func healthz(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":     "ok",
		"revision":   APIRevision,
		"request_id": RequestIDFromContext(r.Context()),
	})
}
