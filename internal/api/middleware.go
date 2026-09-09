package api

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"net/netip"

	"guardian-cloud/internal/netutil"
)

type ctxKey string

const (
	requestIDKey ctxKey = "request_id"
	clientIPKey  ctxKey = "client_ip"
)

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-ID")
		if id == "" {
			id = newRequestID()
		}
		w.Header().Set("X-Request-ID", id)
		ctx := context.WithValue(r.Context(), requestIDKey, id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequestIDFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(requestIDKey).(string); ok {
		return v
	}
	return ""
}

// ClientIP resolves the caller's address once per request and puts it in the
// context, so lockout counters and the IP allowlist read a single trusted value
// and never touch headers themselves.
//
// This replaces chi's RealIP middleware, which trusts the leftmost
// X-Forwarded-For entry — a value the client controls, and therefore both a
// lockout-evasion primitive and an allowlist bypass.
func ClientIP(trustedProxies []netip.Prefix) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			addr := netutil.ClientIP(r, trustedProxies)
			ctx := context.WithValue(r.Context(), clientIPKey, addr)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// ClientIPFromContext returns the resolved caller address. The zero Addr means
// the peer could not be parsed; callers must treat that as "unknown", never as
// "matches everything".
func ClientIPFromContext(ctx context.Context) netip.Addr {
	if v, ok := ctx.Value(clientIPKey).(netip.Addr); ok {
		return v
	}
	return netip.Addr{}
}

// ClientIPString renders the caller address for storage in INET columns and
// audit rows. Empty when unknown, which the SQL maps to NULL.
func ClientIPString(ctx context.Context) string {
	if addr := ClientIPFromContext(ctx); addr.IsValid() {
		return addr.String()
	}
	return ""
}

// SecurityHeaders sets defensive response headers. The API serves only JSON, so
// framing and sniffing are never legitimate.
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "no-referrer")
		// Session cookies mean responses are per-caller; a shared cache must not
		// serve one caller's response to another.
		w.Header().Set("Cache-Control", "no-store")
		next.ServeHTTP(w, r)
	})
}

func newRequestID() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}
