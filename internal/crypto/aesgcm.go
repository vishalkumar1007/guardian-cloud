package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
)

// Sealer encrypts secrets that must be recoverable in plaintext later — TOTP
// shared secrets and OIDC client secrets. Password hashes never go through here;
// those are one-way (see argon2.go).
//
// The schema documents these columns as "a reference into a secret store, never
// the raw secret". A sealed blob under a key held outside the database satisfies
// that: a database dump alone does not yield a usable secret.
type Sealer struct {
	aead cipher.AEAD
}

// sealVersion prefixes every ciphertext so a future key rotation can recognise
// and re-wrap values written under the current key.
const sealVersion = "v1"

var ErrSealedValueMalformed = errors.New("sealed value is malformed")

// NewSealer builds a Sealer from a base64-encoded 32-byte key. It fails loudly
// on a bad key so a misconfigured deployment dies at boot rather than at the
// first MFA enrolment.
func NewSealer(base64Key string) (*Sealer, error) {
	key, err := base64.StdEncoding.DecodeString(strings.TrimSpace(base64Key))
	if err != nil {
		return nil, fmt.Errorf("decode encryption key: %w", err)
	}
	if len(key) != 32 {
		return nil, fmt.Errorf("encryption key must be 32 bytes, got %d", len(key))
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("build cipher: %w", err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("build gcm: %w", err)
	}
	return &Sealer{aead: aead}, nil
}

// Seal encrypts plaintext, returning "v1:<base64 nonce||ciphertext>".
//
// context is bound as additional authenticated data — pass something stable that
// identifies the row (for example "mfa:<method id>"). A sealed value then cannot
// be moved to a different row without the open failing.
func (s *Sealer) Seal(plaintext, context string) (string, error) {
	nonce := make([]byte, s.aead.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", fmt.Errorf("generate nonce: %w", err)
	}

	sealed := s.aead.Seal(nonce, nonce, []byte(plaintext), []byte(context))
	return sealVersion + ":" + base64.RawStdEncoding.EncodeToString(sealed), nil
}

// Open reverses Seal. The context must match the one used to seal the value.
func (s *Sealer) Open(sealed, context string) (string, error) {
	version, payload, found := strings.Cut(sealed, ":")
	if !found || version != sealVersion {
		return "", ErrSealedValueMalformed
	}

	raw, err := base64.RawStdEncoding.DecodeString(payload)
	if err != nil {
		return "", ErrSealedValueMalformed
	}
	if len(raw) < s.aead.NonceSize() {
		return "", ErrSealedValueMalformed
	}

	nonce, ciphertext := raw[:s.aead.NonceSize()], raw[s.aead.NonceSize():]
	plaintext, err := s.aead.Open(nil, nonce, ciphertext, []byte(context))
	if err != nil {
		return "", fmt.Errorf("open sealed value: %w", err)
	}
	return string(plaintext), nil
}
