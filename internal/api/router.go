package api

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
)

type RouterDeps struct {
	DB            *sql.DB
	PublicWebURL  string
}

func NewRouter(deps RouterDeps) http.Handler {
	r := chi.NewRouter()
	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(RequestID)
	r.Use(cors(deps.PublicWebURL))

	r.Get("/healthz", healthz)

	theme := &ThemeHandler{DB: deps.DB}
	platform := &PlatformHandler{DB: deps.DB}
	adminSettings := &AdminSettingsHandler{DB: deps.DB}
	dashboardTheme := &DashboardThemeHandler{DB: deps.DB}

	r.Route("/api/v1/platform", func(pr chi.Router) {
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

	r.Route("/api/v1/admin", func(ar chi.Router) {
		ar.Get("/dashboard-theme", dashboardTheme.Get)
		ar.Put("/dashboard-theme", dashboardTheme.Put)
		ar.Delete("/dashboard-theme", dashboardTheme.Delete)

		ar.Route("/settings", func(sr chi.Router) {
			sr.Get("/", adminSettings.List)
			sr.Get("/{category}", adminSettings.GetCategory)
			sr.Put("/{category}", adminSettings.PutCategory)
		})
	})

	return r
}

func cors(publicWebURL string) func(http.Handler) http.Handler {
	origins := map[string]struct{}{
		"http://127.0.0.1:5175": {},
		"http://localhost:5175": {},
	}
	if publicWebURL != "" {
		origins[strings.TrimRight(publicWebURL, "/")] = struct{}{}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if _, ok := origins[origin]; ok {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Platform-Token, X-Request-ID, X-User-Id, X-User-ID, X-User-Email, X-Tenant-Id, X-Tenant-ID, X-Tenant-User-Id")
			}
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func healthz(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":     "ok",
		"request_id": RequestIDFromContext(r.Context()),
	})
}
