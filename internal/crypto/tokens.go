package crypto

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
)

// tokenBytes is the entropy of every opaque token we mint (session tokens, CSRF
// tokens, email verification, password reset, invitations, MFA challenges).
const tokenBytes = 32

// dummyHash is a real Argon2id hash of a fixed string. Login verifies against it
// when the supplied email does not exist, so an unknown account costs the same
// wall time as a wrong password and cannot be distinguished by timing.
// Generated once at init rather than hardcoded so it always matches DefaultParams.
var dummyHash string

func init() {
	h, err := HashPassword("guardian-nonexistent-account-placeholder")
	if err != nil {
		panic("crypto: cannot build dummy hash: " + err.Error())
	}
	dummyHash = h
}

// NewOpaqueToken mints a random token, returning the raw value to hand to the
// client and the SHA-256 hex digest to persist. The raw value is never stored:
// a database leak yields only digests, mirroring the enrollment_tokens pattern.
//
// SHA-256 (not Argon2) is correct here because the input already carries 256
// bits of entropy, so there is nothing for an attacker to brute-force.
func NewOpaqueToken() (raw string, hash string, err error) {
	b := make([]byte, tokenBytes)
	if _, err := rand.Read(b); err != nil {
		return "", "", fmt.Errorf("generate token: %w", err)
	}
	raw = base64.RawURLEncoding.EncodeToString(b)
	return raw, HashToken(raw), nil
}

// HashToken returns the digest under which a raw token is stored and looked up.
func HashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

// NewNumericCode returns a zero-padded decimal code of the given length, for
// email one-time passwords. Uses crypto/rand, and rejects values in the biased
// tail of the random range so every code is equally likely.
func NewNumericCode(digits int) (string, error) {
	space := uint64(1)
	for i := 0; i < digits; i++ {
		space *= 10
	}

	// 4 bytes gives a 32-bit value; discard the non-uniform remainder.
	limit := uint64(1<<32) - (uint64(1<<32) % space)
	for {
		var b [4]byte
		if _, err := rand.Read(b[:]); err != nil {
			return "", fmt.Errorf("generate numeric code: %w", err)
		}
		v := uint64(b[0])<<24 | uint64(b[1])<<16 | uint64(b[2])<<8 | uint64(b[3])
		if v < limit {
			return fmt.Sprintf("%0*d", digits, v%space), nil
		}
	}
}

// ConstantTimeDummyVerify burns the same CPU as a real password verification.
// Call it on the unknown-account path so response timing does not enumerate users.
func ConstantTimeDummyVerify(password string) {
	_, _ = VerifyPassword(password, dummyHash)
}
