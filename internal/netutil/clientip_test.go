package netutil

import (
	"net/http"
	"net/netip"
	"testing"
)

func mustPrefixes(t *testing.T, entries ...string) []netip.Prefix {
	t.Helper()
	prefixes, err := ParseCIDRList(entries)
	if err != nil {
		t.Fatalf("ParseCIDRList(%v): %v", entries, err)
	}
	return prefixes
}

func request(remoteAddr, forwarded string) *http.Request {
	r := &http.Request{RemoteAddr: remoteAddr, Header: http.Header{}}
	if forwarded != "" {
		r.Header.Set("X-Forwarded-For", forwarded)
	}
	return r
}

func TestClientIP(t *testing.T) {
	tests := []struct {
		name       string
		remoteAddr string
		forwarded  string
		trusted    []string
		want       string
	}{
		{
			name:       "no trusted proxies ignores a forged header",
			remoteAddr: "203.0.113.9:44321",
			forwarded:  "1.2.3.4",
			want:       "203.0.113.9",
		},
		{
			name:       "untrusted peer cannot spoof even with many hops",
			remoteAddr: "203.0.113.9:44321",
			forwarded:  "1.2.3.4, 5.6.7.8",
			trusted:    []string{"10.0.0.0/8"},
			want:       "203.0.113.9",
		},
		{
			name:       "trusted proxy contributes the real client",
			remoteAddr: "10.0.0.5:5000",
			forwarded:  "198.51.100.7",
			trusted:    []string{"10.0.0.0/8"},
			want:       "198.51.100.7",
		},
		{
			name:       "walks past a chain of trusted proxies",
			remoteAddr: "10.0.0.5:5000",
			forwarded:  "198.51.100.7, 10.0.0.9, 10.0.0.8",
			trusted:    []string{"10.0.0.0/8"},
			want:       "198.51.100.7",
		},
		{
			name:       "client-injected entries before the real hop are ignored",
			remoteAddr: "10.0.0.5:5000",
			forwarded:  "1.2.3.4, 198.51.100.7, 10.0.0.9",
			trusted:    []string{"10.0.0.0/8"},
			want:       "198.51.100.7",
		},
		{
			name:       "no header falls back to the peer",
			remoteAddr: "10.0.0.5:5000",
			trusted:    []string{"10.0.0.0/8"},
			want:       "10.0.0.5",
		},
		{
			name:       "garbage in the chain stops the walk at the peer",
			remoteAddr: "10.0.0.5:5000",
			forwarded:  "not-an-ip",
			trusted:    []string{"10.0.0.0/8"},
			want:       "10.0.0.5",
		},
		{
			name:       "ipv4-mapped ipv6 peer is unmapped",
			remoteAddr: "[::ffff:203.0.113.9]:44321",
			want:       "203.0.113.9",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := ClientIP(request(tc.remoteAddr, tc.forwarded), mustPrefixes(t, tc.trusted...))
			if got.String() != tc.want {
				t.Errorf("ClientIP() = %s, want %s", got, tc.want)
			}
		})
	}
}

func TestAllowed(t *testing.T) {
	rules := mustPrefixes(t, "198.51.100.0/24", "203.0.113.7")

	tests := []struct {
		addr string
		want bool
	}{
		{"198.51.100.1", true},
		{"198.51.100.255", true},
		{"198.51.101.1", false},
		{"203.0.113.7", true},
		{"203.0.113.8", false},
		// A v4-mapped v6 client must still match a v4 rule, or an allowlist
		// silently locks out anyone arriving over a dual-stack listener.
		{"::ffff:198.51.100.1", true},
	}

	for _, tc := range tests {
		addr := netip.MustParseAddr(tc.addr)
		if got := Allowed(addr, rules); got != tc.want {
			t.Errorf("Allowed(%s) = %v, want %v", tc.addr, got, tc.want)
		}
	}

	// An empty rule set must not lock everyone out; callers gate on the enabled
	// flag instead.
	if !Allowed(netip.MustParseAddr("1.2.3.4"), nil) {
		t.Error("Allowed() with no rules should permit any address")
	}
}

func TestParseCIDRNormalisesHostBits(t *testing.T) {
	// "203.0.113.4/24" is a common hand-written entry; without masking it would
	// silently match nothing.
	prefix, err := ParseCIDR("203.0.113.4/24")
	if err != nil {
		t.Fatalf("ParseCIDR: %v", err)
	}
	if prefix.String() != "203.0.113.0/24" {
		t.Errorf("ParseCIDR() = %s, want 203.0.113.0/24", prefix)
	}
	if !prefix.Contains(netip.MustParseAddr("203.0.113.99")) {
		t.Error("masked prefix should contain addresses in its range")
	}
}

func TestParseCIDRRejectsGarbage(t *testing.T) {
	for _, entry := range []string{"not-an-ip", "203.0.113.0/99", "203.0.113.0/"} {
		if _, err := ParseCIDR(entry); err == nil {
			t.Errorf("ParseCIDR(%q) should have failed", entry)
		}
	}
}
