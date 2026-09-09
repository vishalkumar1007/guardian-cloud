package netutil

import (
	"fmt"
	"net/netip"
	"strings"
)

// ParseCIDRList parses CIDR blocks, tolerating a bare address as a single-host
// rule ("203.0.113.4" becomes 203.0.113.4/32). Operators write these by hand in
// Platform Settings, so the error names the offending entry.
func ParseCIDRList(entries []string) ([]netip.Prefix, error) {
	prefixes := make([]netip.Prefix, 0, len(entries))
	for _, entry := range entries {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}
		prefix, err := ParseCIDR(entry)
		if err != nil {
			return nil, err
		}
		prefixes = append(prefixes, prefix)
	}
	return prefixes, nil
}

// ParseCIDR parses one CIDR block or bare address.
func ParseCIDR(entry string) (netip.Prefix, error) {
	entry = strings.TrimSpace(entry)

	if !strings.Contains(entry, "/") {
		addr, err := netip.ParseAddr(entry)
		if err != nil {
			return netip.Prefix{}, fmt.Errorf("%q is not a valid IP address or CIDR block", entry)
		}
		addr = addr.Unmap()
		return netip.PrefixFrom(addr, addr.BitLen()), nil
	}

	prefix, err := netip.ParsePrefix(entry)
	if err != nil {
		return netip.Prefix{}, fmt.Errorf("%q is not a valid CIDR block", entry)
	}
	// Masked() zeroes host bits, so "203.0.113.4/24" is stored as 203.0.113.0/24
	// rather than silently failing to match.
	return prefix.Masked(), nil
}
