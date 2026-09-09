package auth

import (
	_ "embed"
	"fmt"
	"strings"
	"sync"
	"unicode"
)

//go:embed common_passwords.txt
var commonPasswordsFile string

var (
	commonPasswordsOnce sync.Once
	commonPasswords     map[string]struct{}
)

// DefaultPasswordMinLength matches the spec: ">= 10 chars, checked against a
// common-password denylist -- do not hand-roll an entropy formula". Overridable
// through the passwordMinLength platform setting.
const DefaultPasswordMinLength = 10

// CheckPasswordPolicy validates a candidate password.
//
// Length plus a denylist, and nothing else. No composition rules (one upper, one
// digit, one symbol): they push people towards predictable substitutions without
// measurably improving strength, and the spec deliberately does not ask for them.
func CheckPasswordPolicy(password string, minLength int) error {
	if minLength <= 0 {
		minLength = DefaultPasswordMinLength
	}

	// Count runes, not bytes, so a passphrase in a non-Latin script is not
	// judged longer than it is.
	if len([]rune(password)) < minLength {
		return fmt.Errorf("%w: must be at least %d characters", ErrWeakPassword, minLength)
	}

	// A single repeated character clears any length rule but is trivially
	// guessed, and no denylist can enumerate every such string.
	if isSingleRepeatedRune(password) {
		return fmt.Errorf("%w: must not be a single repeated character", ErrWeakPassword)
	}

	// Whitespace-only passwords are almost always an input-handling accident.
	if strings.TrimSpace(password) == "" {
		return fmt.Errorf("%w: must not be blank", ErrWeakPassword)
	}

	if isCommonPassword(password) {
		return ErrPasswordCommon
	}
	return nil
}

func isCommonPassword(password string) bool {
	commonPasswordsOnce.Do(loadCommonPasswords)
	_, found := commonPasswords[strings.ToLower(strings.TrimSpace(password))]
	return found
}

func loadCommonPasswords() {
	commonPasswords = make(map[string]struct{})
	for _, line := range strings.Split(commonPasswordsFile, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		commonPasswords[strings.ToLower(line)] = struct{}{}
	}
}

func isSingleRepeatedRune(s string) bool {
	runes := []rune(s)
	if len(runes) == 0 {
		return false
	}
	for _, r := range runes[1:] {
		if r != runes[0] {
			return false
		}
	}
	return true
}

// NormalizeEmail lowercases and trims an address for comparison and for lockout
// keys. Storage relies on the CITEXT column for uniqueness; this keeps the keys
// we build in Go consistent with it.
func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// LooksLikeEmail is a deliberately permissive shape check. Deliverability is
// proven by the verification email, not by a regex.
func LooksLikeEmail(email string) bool {
	email = NormalizeEmail(email)
	at := strings.LastIndex(email, "@")
	if at <= 0 || at == len(email)-1 {
		return false
	}
	domain := email[at+1:]
	if !strings.Contains(domain, ".") || strings.HasPrefix(domain, ".") || strings.HasSuffix(domain, ".") {
		return false
	}
	for _, r := range email {
		if unicode.IsSpace(r) {
			return false
		}
	}
	return true
}

// EmailDomain returns the domain part, used to route a login to its SSO provider.
func EmailDomain(email string) string {
	email = NormalizeEmail(email)
	if at := strings.LastIndex(email, "@"); at >= 0 && at < len(email)-1 {
		return email[at+1:]
	}
	return ""
}
