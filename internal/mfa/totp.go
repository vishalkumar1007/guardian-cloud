// Package mfa implements second-factor authentication: RFC 6238 TOTP as the
// primary method, emailed one-time codes as a fallback, and single-use recovery
// codes for when both are unavailable.
//
// TOTP is implemented directly rather than pulled from a dependency: it is a
// short, completely specified algorithm, and RFC 6238's published test vectors
// make it verifiable (see totp_test.go).
package mfa

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"crypto/subtle"
	"encoding/base32"
	"encoding/binary"
	"fmt"
	"net/url"
	"strings"
	"time"
)

const (
	// Period and Digits are the values every authenticator app assumes by
	// default. Changing them would require the enrolment URI to spell them out
	// and would break apps that ignore those parameters.
	Period = 30 * time.Second
	Digits = 6

	// Skew accepts the adjacent steps either side of now, tolerating roughly
	// ±30s of clock drift between the server and the user's phone. Widening this
	// linearly widens the window in which a shoulder-surfed code still works.
	Skew = 1

	secretBytes = 20 // 160 bits, the RFC 4226 recommendation for HMAC-SHA1
)

// base32NoPad is the unpadded encoding every authenticator app expects; padding
// characters in a QR payload are a common cause of "invalid secret" errors.
var base32NoPad = base32.StdEncoding.WithPadding(base32.NoPadding)

// GenerateSecret returns a new base32-encoded TOTP shared secret.
func GenerateSecret() (string, error) {
	b := make([]byte, secretBytes)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate totp secret: %w", err)
	}
	return base32NoPad.EncodeToString(b), nil
}

// ProvisioningURI builds the otpauth:// URI encoded into the enrolment QR code.
//
// The URI is returned to the frontend, which renders the QR itself — that keeps
// a QR library out of the backend and the secret out of any image cache.
func ProvisioningURI(issuer, account, secret string) string {
	label := url.PathEscape(issuer + ":" + account)
	query := url.Values{
		"secret":    {secret},
		"issuer":    {issuer},
		"algorithm": {"SHA1"},
		"digits":    {fmt.Sprint(Digits)},
		"period":    {fmt.Sprint(int(Period.Seconds()))},
	}
	return "otpauth://totp/" + label + "?" + query.Encode()
}

// Validate reports whether code is currently valid for secret.
//
// Compared in constant time across the whole accepted window, so neither the
// digits nor which step matched can be inferred from timing.
func Validate(secret, code string, at time.Time) bool {
	code = strings.TrimSpace(code)
	if len(code) != Digits {
		return false
	}

	key, err := base32NoPad.DecodeString(strings.ToUpper(strings.TrimSpace(secret)))
	if err != nil {
		return false
	}

	counter := uint64(at.Unix()) / uint64(Period.Seconds())
	matched := 0
	for offset := -Skew; offset <= Skew; offset++ {
		candidate := generate(key, uint64(int64(counter)+int64(offset)))
		matched |= subtle.ConstantTimeCompare([]byte(candidate), []byte(code))
	}
	return matched == 1
}

// Code returns the current TOTP value for a secret.
//
// Exported so integration tests can drive a real enrolment end to end; the
// server itself only ever validates codes, never generates them.
func Code(secret string, at time.Time) (string, error) {
	key, err := base32NoPad.DecodeString(strings.ToUpper(strings.TrimSpace(secret)))
	if err != nil {
		return "", fmt.Errorf("decode totp secret: %w", err)
	}
	return generate(key, uint64(at.Unix())/uint64(Period.Seconds())), nil
}

// generate is the HOTP function from RFC 4226 Section 5.3.
func generate(key []byte, counter uint64) string {
	var buf [8]byte
	binary.BigEndian.PutUint64(buf[:], counter)

	mac := hmac.New(sha1.New, key)
	mac.Write(buf[:])
	sum := mac.Sum(nil)

	// Dynamic truncation: the low nibble of the last byte selects the offset of
	// the 4-byte window to read, and the top bit is masked off so the result is
	// interpreted as a positive integer.
	offset := sum[len(sum)-1] & 0x0f
	value := binary.BigEndian.Uint32(sum[offset:offset+4]) & 0x7fffffff

	modulus := uint32(1)
	for i := 0; i < Digits; i++ {
		modulus *= 10
	}
	return fmt.Sprintf("%0*d", Digits, value%modulus)
}
