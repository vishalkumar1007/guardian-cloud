package crypto

import (
	"crypto/rand"
	"encoding/base64"
	"strings"
	"testing"
)

func newTestSealer(t *testing.T) *Sealer {
	t.Helper()
	key := make([]byte, 32)
	if _, err := rand.Read(key); err != nil {
		t.Fatalf("generate key: %v", err)
	}
	sealer, err := NewSealer(base64.StdEncoding.EncodeToString(key))
	if err != nil {
		t.Fatalf("NewSealer: %v", err)
	}
	return sealer
}

func TestSealerRoundTrip(t *testing.T) {
	sealer := newTestSealer(t)
	const secret = "JBSWY3DPEHPK3PXP"

	sealed, err := sealer.Seal(secret, "mfa:abc")
	if err != nil {
		t.Fatalf("Seal: %v", err)
	}
	if strings.Contains(sealed, secret) {
		t.Fatal("sealed value must not contain the plaintext")
	}
	if !strings.HasPrefix(sealed, "v1:") {
		t.Errorf("sealed value should carry a version prefix, got %q", sealed)
	}

	opened, err := sealer.Open(sealed, "mfa:abc")
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	if opened != secret {
		t.Errorf("Open() = %q, want %q", opened, secret)
	}
}

func TestSealerRejectsWrongContext(t *testing.T) {
	sealer := newTestSealer(t)

	sealed, err := sealer.Seal("secret", "mfa:abc")
	if err != nil {
		t.Fatalf("Seal: %v", err)
	}

	// Binding the row id as additional data is what stops a sealed secret being
	// copied onto a different row.
	if _, err := sealer.Open(sealed, "mfa:different"); err == nil {
		t.Error("Open() with a mismatched context should fail")
	}
}

func TestSealerRejectsTamperedCiphertext(t *testing.T) {
	sealer := newTestSealer(t)

	sealed, err := sealer.Seal("secret", "mfa:abc")
	if err != nil {
		t.Fatalf("Seal: %v", err)
	}

	body := []byte(sealed)
	body[len(body)-1] ^= 0x01
	if _, err := sealer.Open(string(body), "mfa:abc"); err == nil {
		t.Error("Open() on tampered ciphertext should fail")
	}
}

func TestSealerRejectsWrongKey(t *testing.T) {
	sealed, err := newTestSealer(t).Seal("secret", "mfa:abc")
	if err != nil {
		t.Fatalf("Seal: %v", err)
	}
	if _, err := newTestSealer(t).Open(sealed, "mfa:abc"); err == nil {
		t.Error("Open() with a different key should fail")
	}
}

func TestNewSealerRejectsBadKeys(t *testing.T) {
	short := base64.StdEncoding.EncodeToString(make([]byte, 16))
	for _, key := range []string{"", "not-base64!!", short} {
		if _, err := NewSealer(key); err == nil {
			t.Errorf("NewSealer(%q) should have failed", key)
		}
	}
}

func TestNewOpaqueToken(t *testing.T) {
	raw, hash, err := NewOpaqueToken()
	if err != nil {
		t.Fatalf("NewOpaqueToken: %v", err)
	}
	if raw == hash {
		t.Fatal("the stored digest must differ from the token handed to the client")
	}
	if HashToken(raw) != hash {
		t.Error("HashToken() must reproduce the digest returned by NewOpaqueToken")
	}

	other, _, err := NewOpaqueToken()
	if err != nil {
		t.Fatalf("NewOpaqueToken: %v", err)
	}
	if other == raw {
		t.Fatal("tokens must not repeat")
	}
}

func TestNewNumericCode(t *testing.T) {
	seen := map[string]bool{}
	for i := 0; i < 200; i++ {
		code, err := NewNumericCode(6)
		if err != nil {
			t.Fatalf("NewNumericCode: %v", err)
		}
		if len(code) != 6 {
			t.Fatalf("NewNumericCode(6) = %q, want 6 digits", code)
		}
		for _, c := range code {
			if c < '0' || c > '9' {
				t.Fatalf("NewNumericCode produced a non-digit: %q", code)
			}
		}
		seen[code] = true
	}
	// Not a randomness test, just a guard against a constant being returned.
	if len(seen) < 100 {
		t.Errorf("expected varied codes, got %d distinct out of 200", len(seen))
	}
}

func TestPasswordHashRoundTrip(t *testing.T) {
	hash, err := HashPassword("correct horse battery staple")
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}

	ok, err := VerifyPassword("correct horse battery staple", hash)
	if err != nil {
		t.Fatalf("VerifyPassword: %v", err)
	}
	if !ok {
		t.Error("the correct password should verify")
	}

	ok, err = VerifyPassword("wrong password entirely", hash)
	if err != nil {
		t.Fatalf("VerifyPassword: %v", err)
	}
	if ok {
		t.Error("a wrong password must not verify")
	}
}
