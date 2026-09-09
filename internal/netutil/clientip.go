// Package netutil resolves and matches client IP addresses.
//
// Lockout counters and the admin IP allowlist are both keyed on the caller's
// address, so getting this wrong turns a security control into a bypass. That is
// why chi's RealIP middleware is deliberately not used: it takes the *leftmost*
// X-Forwarded-For entry, which is the value a client fully controls.
package netutil

import (
	"net"
	"net/http"
	"net/netip"
	"strings"
)

// ClientIP resolves the caller's address from the transport peer and, only where
// the peer is a proxy we trust, from X-Forwarded-For.
//
// The header is walked right-to-left, discarding entries contributed by trusted
// proxies until reaching one that is not — that entry is the earliest hop we can
// still vouch for. With trustedProxies empty (the default) the header is ignored
// entirely, which is correct for the current direct-to-container setup.
func ClientIP(r *http.Request, trustedProxies []netip.Prefix) netip.Addr {
	peer := parseAddr(remoteHost(r.RemoteAddr))
	if len(trustedProxies) == 0 || !peer.IsValid() || !inAny(peer, trustedProxies) {
		return peer
	}

	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded == "" {
		return peer
	}

	hops := strings.Split(forwarded, ",")
	for i := len(hops) - 1; i >= 0; i-- {
		hop := parseAddr(strings.TrimSpace(hops[i]))
		if !hop.IsValid() {
			// An unparseable entry means we can no longer trust the chain
			// beyond this point; stop rather than skipping past it.
			return peer
		}
		if !inAny(hop, trustedProxies) {
			return hop
		}
	}
	return peer
}

// Allowed reports whether addr falls inside any of the given prefixes.
// An empty prefix list allows everything — callers gate on the enabled flag.
func Allowed(addr netip.Addr, prefixes []netip.Prefix) bool {
	if len(prefixes) == 0 {
		return true
	}
	return inAny(addr, prefixes)
}

func inAny(addr netip.Addr, prefixes []netip.Prefix) bool {
	// Compare in a single family: a client arriving as ::ffff:203.0.113.4 must
	// still match a 203.0.113.0/24 rule.
	addr = addr.Unmap()
	for _, prefix := range prefixes {
		if prefix.Contains(addr) {
			return true
		}
	}
	return false
}

func parseAddr(s string) netip.Addr {
	addr, err := netip.ParseAddr(s)
	if err != nil {
		return netip.Addr{}
	}
	return addr.Unmap()
}

func remoteHost(remoteAddr string) string {
	if host, _, err := net.SplitHostPort(remoteAddr); err == nil {
		return host
	}
	return remoteAddr
}
