package authz

import (
	"strings"
	"testing"
)

// allPermissions mirrors the keys seeded by migration 00018.
var allPermissions = []string{
	"organizations.read", "organizations.create", "organizations.update", "organizations.suspend",
	"users.read", "users.update", "users.suspend",
	"devices.read", "devices.manage",
	"security.read", "incidents.manage",
	"plans.read", "plans.manage", "subscriptions.read", "subscriptions.manage",
	"audit.read",
	"iam.users.manage", "iam.roles.manage", "iam.permissions.manage",
	"platform.settings.manage", "platform.health.read", "platform.features.manage", "platform.agents.manage",
}

func TestMatch(t *testing.T) {
	tests := []struct {
		pattern string
		key     string
		want    bool
	}{
		// Root
		{"*", "organizations.read", true},
		{"*", "iam.users.manage", true},
		{"*", "platform.settings.manage", true},

		// Exact
		{"organizations.read", "organizations.read", true},
		{"organizations.read", "organizations.create", false},
		{"users.read", "users.readonly", false},

		// Prefix wildcard spans all remaining segments
		{"platform.*", "platform.settings.manage", true},
		{"platform.*", "platform.health.read", true},
		{"platform.*", "plans.read", false},
		{"security.*", "security.read", true},
		{"security.*", "securityx.read", false},
		{"incidents.*", "incidents.manage", true},
		{"subscriptions.*", "subscriptions.read", true},
		{"subscriptions.*", "subscriptions.manage", true},
		{"iam.*", "iam.users.manage", true},

		// A prefix wildcard must not match the bare prefix itself
		{"platform.*", "platform", false},

		// Suffix wildcard matches the last segment at any depth
		{"*.read", "users.read", true},
		{"*.read", "platform.health.read", true},
		{"*.read", "audit.read", true},
		{"*.read", "devices.manage", false},
		{"*.manage", "iam.users.manage", true},
		{"*.manage", "users.read", false},

		// Unsupported wildcard positions match nothing
		{"a.*.c", "a.b.c", false},
		{"*read", "users.read", false},
		{"organizations.*.read", "organizations.x.read", false},
		{"**", "users.read", false},

		// Degenerate input
		{"", "users.read", false},
		{"*", "", false},
	}

	for _, tc := range tests {
		t.Run(tc.pattern+" vs "+tc.key, func(t *testing.T) {
			if got := Match(tc.pattern, tc.key); got != tc.want {
				t.Errorf("Match(%q, %q) = %v, want %v", tc.pattern, tc.key, got, tc.want)
			}
		})
	}
}

// The single most important property in the model: a read-only role must never
// reach a mutating permission. READ_ONLY_ADMIN is documented as "strictly
// non-destructive inspection".
func TestReadWildcardNeverGrantsMutation(t *testing.T) {
	granted := Expand([]string{"*.read"}, allPermissions)

	for _, key := range allPermissions {
		_, has := granted[key]
		isRead := strings.HasSuffix(key, ".read")
		if has != isRead {
			t.Errorf("*.read granted %q = %v, want %v", key, has, isRead)
		}
	}

	for _, forbidden := range []string{"iam.users.manage", "platform.settings.manage", "organizations.suspend", "devices.manage"} {
		if _, has := granted[forbidden]; has {
			t.Errorf("*.read must never grant %q", forbidden)
		}
	}
}

// The two most dangerous permissions must be reachable only by an explicit
// grant, never incidentally.
func TestPrivilegedPermissionsRequireExplicitGrant(t *testing.T) {
	privileged := []string{"iam.users.manage", "platform.settings.manage"}

	reaching := map[string][]string{
		"iam.users.manage":         {"*", "iam.*", "*.manage", "iam.users.manage"},
		"platform.settings.manage": {"*", "platform.*", "*.manage", "platform.settings.manage"},
	}

	for _, key := range privileged {
		allowed := map[string]bool{}
		for _, pattern := range reaching[key] {
			allowed[pattern] = true
		}

		// Every documented system-role pattern except root must be checked.
		for _, pattern := range []string{"*", "platform.*", "security.*", "incidents.*", "subscriptions.*", "plans.*", "*.read", "iam.*", "*.manage",
			"organizations.read", "users.read", "devices.read", "security.read", "audit.read"} {
			got := Match(pattern, key)
			if got != allowed[pattern] {
				t.Errorf("Match(%q, %q) = %v, want %v", pattern, key, got, allowed[pattern])
			}
		}
	}
}

// Guards the documented role matrix: each system role must expand to exactly the
// access its description promises.
func TestSystemRoleExpansions(t *testing.T) {
	tests := []struct {
		role     string
		patterns []string
		granted  []string
		denied   []string
	}{
		{
			role:     "OPERATIONS_ADMIN",
			patterns: []string{"platform.*", "devices.read", "organizations.read", "audit.read"},
			granted:  []string{"platform.settings.manage", "platform.health.read", "devices.read", "organizations.read", "audit.read"},
			denied:   []string{"devices.manage", "iam.users.manage", "subscriptions.manage", "organizations.suspend"},
		},
		{
			role:     "SECURITY_ADMIN",
			patterns: []string{"security.*", "incidents.*", "devices.read", "organizations.read", "audit.read"},
			granted:  []string{"security.read", "incidents.manage", "devices.read", "audit.read"},
			denied:   []string{"devices.manage", "platform.settings.manage", "iam.roles.manage", "plans.manage"},
		},
		{
			role:     "SUPPORT_ADMIN",
			patterns: []string{"organizations.read", "users.read", "devices.read", "security.read"},
			granted:  []string{"organizations.read", "users.read", "devices.read", "security.read"},
			denied:   []string{"users.suspend", "organizations.suspend", "incidents.manage", "audit.read"},
		},
		{
			role:     "BILLING_ADMIN",
			patterns: []string{"subscriptions.*", "plans.*", "organizations.read"},
			granted:  []string{"subscriptions.read", "subscriptions.manage", "plans.read", "plans.manage", "organizations.read"},
			denied:   []string{"devices.read", "iam.users.manage", "security.read"},
		},
		{
			role:     "SUPER_ADMIN",
			patterns: []string{"*"},
			granted:  allPermissions,
			denied:   nil,
		},
	}

	for _, tc := range tests {
		t.Run(tc.role, func(t *testing.T) {
			granted := Expand(tc.patterns, allPermissions)
			for _, key := range tc.granted {
				if _, has := granted[key]; !has {
					t.Errorf("%s should grant %q", tc.role, key)
				}
			}
			for _, key := range tc.denied {
				if _, has := granted[key]; has {
					t.Errorf("%s must not grant %q", tc.role, key)
				}
			}
		})
	}
}

func TestValidGrantPattern(t *testing.T) {
	valid := []string{"*", "*.read", "*.manage", "platform.*", "iam.*", "organizations.read", "iam.users.manage"}
	invalid := []string{"", "a.*.c", "*read", "**", "*.a.b", ".read", "users.", "*.*"}

	for _, pattern := range valid {
		if !ValidGrantPattern(pattern) {
			t.Errorf("ValidGrantPattern(%q) = false, want true", pattern)
		}
	}
	for _, pattern := range invalid {
		if ValidGrantPattern(pattern) {
			t.Errorf("ValidGrantPattern(%q) = true, want false", pattern)
		}
	}
}

// Anything ValidGrantPattern accepts must actually match something, or a role
// could be saved that silently grants nothing.
func TestValidPatternsAreUseful(t *testing.T) {
	for _, pattern := range []string{"*", "*.read", "*.manage", "platform.*", "iam.*", "organizations.read"} {
		if len(Expand([]string{pattern}, allPermissions)) == 0 {
			t.Errorf("pattern %q is accepted but grants nothing", pattern)
		}
	}
}
