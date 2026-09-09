// Package authz resolves and enforces Guardian staff permissions.
//
// Roles hold wildcard grant patterns rather than fixed permission lists, so a
// newly added permission automatically reaches every role whose pattern already
// covers it. The cost is that the wildcard semantics have to be exact — they are
// specified in Match and locked by a table-driven test.
package authz

import "strings"

// Match reports whether a grant pattern authorises a permission key.
//
// Permission keys are dot-separated ("organizations.read",
// "platform.settings.manage"). The accepted pattern forms are:
//
//  1. "*" matches every key.
//  2. A pattern with no "*" matches only the identical key.
//  3. "prefix.*" matches any key beginning with those literal segments, spanning
//     all remaining segments — "platform.*" grants "platform.settings.manage".
//  4. "*.suffix" matches any key whose LAST segment equals the suffix, at any
//     depth — "*.read" grants "users.read" and "platform.audit.read", and never
//     anything ending ".manage".
//
// A "*" anywhere else is not a valid pattern and matches nothing; the role API
// rejects such patterns at write time so they cannot be stored silently.
//
// These are grants only. There are no deny rules, so effective permissions are a
// plain union and no ordering or precedence question arises.
func Match(grantPattern, permissionKey string) bool {
	if grantPattern == "" || permissionKey == "" {
		return false
	}
	if grantPattern == "*" {
		return true
	}

	if !strings.Contains(grantPattern, "*") {
		return grantPattern == permissionKey
	}

	if suffix, found := strings.CutPrefix(grantPattern, "*."); found {
		// Only a trailing-segment wildcard; "*.a.b" is not a supported form.
		if strings.Contains(suffix, "*") || strings.Contains(suffix, ".") {
			return false
		}
		lastDot := strings.LastIndex(permissionKey, ".")
		return lastDot >= 0 && permissionKey[lastDot+1:] == suffix
	}

	if prefix, found := strings.CutSuffix(grantPattern, ".*"); found {
		if strings.Contains(prefix, "*") {
			return false
		}
		return strings.HasPrefix(permissionKey, prefix+".")
	}

	// A "*" in any other position, e.g. "a.*.c" or "*read".
	return false
}

// ValidGrantPattern reports whether a pattern is one of the supported forms.
// The role API calls this before storing, so an unmatchable pattern can never be
// saved and silently grant nothing.
func ValidGrantPattern(pattern string) bool {
	if pattern == "" {
		return false
	}
	if pattern == "*" {
		return true
	}
	if !strings.Contains(pattern, "*") {
		// A literal key must still look like a key.
		return !strings.HasPrefix(pattern, ".") && !strings.HasSuffix(pattern, ".")
	}
	if suffix, found := strings.CutPrefix(pattern, "*."); found {
		return suffix != "" && !strings.Contains(suffix, "*") && !strings.Contains(suffix, ".")
	}
	if prefix, found := strings.CutSuffix(pattern, ".*"); found {
		return prefix != "" && !strings.Contains(prefix, "*")
	}
	return false
}

// Expand turns grant patterns into the concrete permission keys they authorise.
//
// Resolving once per request makes every later check an O(1) map lookup, and
// lets /me return the caller's literal permission list for the frontend to drive
// menu visibility from.
func Expand(patterns []string, allPermissions []string) map[string]struct{} {
	granted := make(map[string]struct{})
	for _, pattern := range patterns {
		for _, key := range allPermissions {
			if Match(pattern, key) {
				granted[key] = struct{}{}
			}
		}
	}
	return granted
}
