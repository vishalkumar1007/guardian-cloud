package config

import (
	"fmt"
	"net/netip"
	"os"
	"strconv"
	"strings"

	"guardian-cloud/internal/netutil"
)

// Legacy authentication modes for retiring the pre-session header/dev-token
// seams without breaking the frontend that still uses them.
//
//	on   - a real session wins, header/dev-token still accepted (default)
//	warn - fallbacks still work but are logged and audited, so the remaining
//	       callers become visible before anything is removed
//	off  - fallbacks rejected
const (
	LegacyModeOn   = "on"
	LegacyModeWarn = "warn"
	LegacyModeOff  = "off"
)

type Config struct {
	Port          string
	DatabaseURL   string
	RedisURL      string
	PublicBaseURL string
	PublicWebURL  string
	OpenAIKey     string
	OpenAIBaseURL string

	// PlatformDevToken is the pre-authentication gate on theme writes. Removed
	// once AuthLegacyMode reaches "off".
	PlatformDevToken string
	AuthLegacyMode   string

	// SecretEncryptionKey seals TOTP secrets and OIDC client secrets at rest.
	// Losing it orphans every enrolled authenticator, so it is backup-critical.
	SecretEncryptionKey string

	// AuthCookieSecure marks session cookies Secure. False is only acceptable on
	// plain-http local development.
	AuthCookieSecure    bool
	SessionCookieDomain string

	// TrustedProxyCIDRs lists proxies whose X-Forwarded-For we believe. Empty
	// (the default) means the header is ignored entirely and the transport peer
	// is authoritative — correct when nothing sits in front of the API.
	TrustedProxyCIDRs []netip.Prefix

	// CORSAllowedOrigins is the exact set of browser origins allowed to call the
	// API with credentials. Exact matches only — credentialed CORS forbids a
	// wildcard, and a prefix match would let evil-example.com.attacker.net in.
	CORSAllowedOrigins []string

	SMTPHost string
	SMTPPort string
	SMTPFrom string
	SMTPUser string
	SMTPPass string
}

func Load() (*Config, error) {
	loadDotEnv(".env")
	loadDotEnv("../.env")

	cfg := &Config{
		Port:          getEnv("PORT", "8080"),
		DatabaseURL:   getEnv("DATABASE_URL", ""),
		RedisURL:      getEnv("REDIS_URL", "redis://127.0.0.1:6381/0"),
		PublicBaseURL: getEnv("PUBLIC_BASE_URL", "http://127.0.0.1:8083"),
		PublicWebURL:  getEnv("PUBLIC_WEB_URL", "http://127.0.0.1:5175"),
		OpenAIKey:     getEnv("OPENAI_API_KEY", ""),
		OpenAIBaseURL: getEnv("OPENAI_BASE_URL", "https://api.openai.com/v1"),

		PlatformDevToken: getEnv("GUARDIAN_PLATFORM_DEV_TOKEN", "guardian-dev-super-admin"),
		AuthLegacyMode:   strings.ToLower(getEnv("AUTH_LEGACY_MODE", LegacyModeOn)),

		SecretEncryptionKey: getEnv("GUARDIAN_SECRET_ENCRYPTION_KEY", ""),
		AuthCookieSecure:    getEnvBool("AUTH_COOKIE_SECURE", false),
		SessionCookieDomain: getEnv("AUTH_COOKIE_DOMAIN", ""),

		SMTPHost: getEnv("SMTP_HOST", "127.0.0.1"),
		SMTPPort: getEnv("SMTP_PORT", "1026"),
		SMTPFrom: getEnv("SMTP_FROM", "Guardian <no-reply@guardian.local>"),
		SMTPUser: getEnv("SMTP_USER", ""),
		SMTPPass: getEnv("SMTP_PASS", ""),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	switch cfg.AuthLegacyMode {
	case LegacyModeOn, LegacyModeWarn, LegacyModeOff:
	default:
		return nil, fmt.Errorf("AUTH_LEGACY_MODE must be one of on, warn, off (got %q)", cfg.AuthLegacyMode)
	}

	// Validated at boot rather than lazily on the first MFA enrolment, so a
	// misconfigured deployment fails while someone is still watching it start.
	if cfg.SecretEncryptionKey == "" {
		return nil, fmt.Errorf("GUARDIAN_SECRET_ENCRYPTION_KEY is required " +
			"(generate one with: openssl rand -base64 32)")
	}

	prefixes, err := netutil.ParseCIDRList(splitList(getEnv("TRUSTED_PROXY_CIDRS", "")))
	if err != nil {
		return nil, fmt.Errorf("TRUSTED_PROXY_CIDRS: %w", err)
	}
	cfg.TrustedProxyCIDRs = prefixes

	cfg.CORSAllowedOrigins = resolveCORSOrigins(
		getEnv("CORS_ALLOWED_ORIGINS", ""), cfg.PublicWebURL, cfg.PublicBaseURL)

	if strings.HasPrefix(cfg.PublicBaseURL, "https://") && !cfg.AuthCookieSecure {
		return nil, fmt.Errorf("AUTH_COOKIE_SECURE must be true when PUBLIC_BASE_URL is https")
	}

	return cfg, nil
}

// devWebPorts are the ports Vite may pick locally. It increments when the
// preferred port is taken, so a second `npm run dev` lands on 5176 and its
// requests would otherwise be blocked by CORS with no useful error — the
// browser reports only "failed to fetch".
var devWebPorts = []string{"5173", "5174", "5175", "5176", "5177"}

// resolveCORSOrigins builds the credentialed-CORS allowlist.
//
// An explicit CORS_ALLOWED_ORIGINS replaces the defaults outright, which is what
// a real deployment should set. Otherwise the app's own origins are allowed,
// plus the local Vite ports so development works without configuration.
func resolveCORSOrigins(explicit, publicWebURL, publicBaseURL string) []string {
	seen := map[string]struct{}{}
	var origins []string

	add := func(origin string) {
		origin = strings.TrimRight(strings.TrimSpace(origin), "/")
		if origin == "" {
			return
		}
		if _, exists := seen[origin]; exists {
			return
		}
		seen[origin] = struct{}{}
		origins = append(origins, origin)
	}

	if strings.TrimSpace(explicit) != "" {
		for _, origin := range splitList(explicit) {
			add(origin)
		}
		return origins
	}

	add(publicWebURL)
	add(publicBaseURL)

	// Only offered for loopback: this must never widen the allowlist for a
	// deployment that happens to leave the variable unset.
	if isLoopbackURL(publicWebURL) {
		for _, port := range devWebPorts {
			add("http://127.0.0.1:" + port)
			add("http://localhost:" + port)
		}
	}

	return origins
}

func isLoopbackURL(raw string) bool {
	return strings.Contains(raw, "127.0.0.1") || strings.Contains(raw, "localhost")
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	v, err := strconv.ParseBool(getEnv(key, ""))
	if err != nil {
		return fallback
	}
	return v
}

func splitList(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	return strings.Split(raw, ",")
}

func loadDotEnv(filepath string) {
	data, err := os.ReadFile(filepath)
	if err != nil {
		return
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			if os.Getenv(key) == "" {
				os.Setenv(key, val)
			}
		}
	}
}
