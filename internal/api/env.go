package api

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/config"
	"guardian-cloud/internal/crypto"
	"guardian-cloud/internal/mail"
	"guardian-cloud/internal/settings"
)

// Env is the shared dependency set for the authentication and IAM handlers.
//
// Handlers that predate it keep their `struct{ DB *sql.DB }` shape; this exists
// because the auth surface genuinely needs the config, the settings cache, the
// secret sealer and the mailer, and threading five fields through every handler
// struct would be worse.
type Env struct {
	DB       *sql.DB
	Config   *config.Config
	Settings *settings.Store
	Sealer   *crypto.Sealer
	Mailer   *mail.Mailer

	allowedOrigins map[string]struct{}
}

// NewEnv builds the shared handler environment.
func NewEnv(sqlDB *sql.DB, cfg *config.Config, sealer *crypto.Sealer, mailer *mail.Mailer) *Env {
	return &Env{
		DB:             sqlDB,
		Config:         cfg,
		Settings:       settings.NewStore(sqlDB),
		Sealer:         sealer,
		Mailer:         mailer,
		allowedOrigins: buildOrigins(cfg.CORSAllowedOrigins),
	}
}

// CookieConfig renders the deployment-dependent cookie attributes.
func (e *Env) CookieConfig() auth.CookieConfig {
	return auth.CookieConfig{
		Secure: e.Config.AuthCookieSecure,
		Domain: e.Config.SessionCookieDomain,
	}
}

// SessionPolicy reads the current lifetime policy. Settings are cached for a
// minute, so this is cheap enough to call on every authenticated request.
func (e *Env) SessionPolicy(ctx context.Context) auth.SessionPolicy {
	return auth.SessionPolicy{
		AbsoluteDays:    e.Settings.Int(ctx, settings.KeySessionAbsoluteDays),
		IdleMinutes:     e.Settings.Int(ctx, settings.KeySessionTimeoutMinutes),
		RenewWithinDays: e.Settings.Int(ctx, settings.KeySessionRenewWithinDays),
	}
}

// LockoutPolicy reads the current brute-force thresholds.
func (e *Env) LockoutPolicy(ctx context.Context) auth.LockoutPolicy {
	policy := auth.DefaultLockoutPolicy
	if max := e.Settings.Int(ctx, settings.KeyMaxFailedLogins); max > 0 {
		policy.MaxFailures = max
	}
	if window := e.Settings.Int(ctx, settings.KeyLockoutWindowMinutes); window > 0 {
		policy.Window = time.Duration(window) * time.Minute
	}
	return policy
}

// RequiresMFA reports whether policy demands a second factor on this plane.
func (e *Env) RequiresMFA(ctx context.Context, plane auth.Plane) bool {
	if plane.IsAdmin() {
		return e.Settings.Bool(ctx, settings.KeyRequireMfaAdmin)
	}
	return e.Settings.Bool(ctx, settings.KeyRequireMfaCustomer)
}

// PasswordMinLength reads the configured minimum, falling back to the default.
func (e *Env) PasswordMinLength(ctx context.Context) int {
	if n := e.Settings.Int(ctx, settings.KeyPasswordMinLength); n > 0 {
		return n
	}
	return auth.DefaultPasswordMinLength
}

// LegacyAuthAllowed reports whether the pre-session header and dev-token
// fallbacks are still accepted.
func (e *Env) LegacyAuthAllowed() bool {
	return e.Config.AuthLegacyMode != config.LegacyModeOff
}

// LegacyAuthShouldWarn reports whether a legacy fallback should be logged and
// audited, which is how the remaining callers are found before removal.
func (e *Env) LegacyAuthShouldWarn() bool {
	return e.Config.AuthLegacyMode == config.LegacyModeWarn
}

func (e *Env) origins() map[string]struct{} { return e.allowedOrigins }

// buildOrigins turns the configured allowlist into a set.
//
// One list, resolved once in config, is shared by CORS, the CSRF origin check
// and SSO redirect validation. Previously CORS kept its own hardcoded copy,
// which meant a request could pass one check and fail another.
func buildOrigins(allowed []string) map[string]struct{} {
	origins := make(map[string]struct{}, len(allowed))
	for _, origin := range allowed {
		if trimmed := strings.TrimRight(strings.TrimSpace(origin), "/"); trimmed != "" {
			origins[trimmed] = struct{}{}
		}
	}
	return origins
}
