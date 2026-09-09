package mfa

import (
	"encoding/base32"
	"strings"
	"testing"
	"time"
)

// rfcSecret is the RFC 6238 Appendix B test seed, "12345678901234567890" in
// ASCII, base32-encoded the way an authenticator app receives it.
var rfcSecret = base32NoPad.EncodeToString([]byte("12345678901234567890"))

// TestValidateRFC6238Vectors checks the implementation against the published
// SHA-1 vectors. These are the reason this algorithm is written by hand rather
// than taken as a dependency: it is verifiable against the specification.
func TestValidateRFC6238Vectors(t *testing.T) {
	// Appendix B lists 8-digit values; we emit 6, so these are the low 6 digits.
	vectors := []struct {
		unix int64
		code string
	}{
		{59, "287082"},
		{1111111109, "081804"},
		{1111111111, "050471"},
		{1234567890, "005924"},
		{2000000000, "279037"},
		{20000000000, "353130"},
	}

	for _, v := range vectors {
		at := time.Unix(v.unix, 0).UTC()
		if !Validate(rfcSecret, v.code, at) {
			t.Errorf("Validate(%s at %d) = false, want true", v.code, v.unix)
		}
	}
}

func TestValidateRejectsWrongCode(t *testing.T) {
	at := time.Unix(59, 0).UTC()
	for _, code := range []string{"000000", "287083", "12345", "1234567", "", "abcdef"} {
		if Validate(rfcSecret, code, at) {
			t.Errorf("Validate(%q) = true, want false", code)
		}
	}
}

func TestValidateSkewWindow(t *testing.T) {
	// A code from the neighbouring step must still work (clock drift), but one
	// two steps away must not — that would double the replay window.
	base := time.Unix(1111111109, 0).UTC()

	if !Validate(rfcSecret, "081804", base.Add(Period)) {
		t.Error("a code one step old should be accepted")
	}
	if !Validate(rfcSecret, "081804", base.Add(-Period)) {
		t.Error("a code one step early should be accepted")
	}
	if Validate(rfcSecret, "081804", base.Add(2*Period)) {
		t.Error("a code two steps old must be rejected")
	}
	if Validate(rfcSecret, "081804", base.Add(-2*Period)) {
		t.Error("a code two steps early must be rejected")
	}
}

func TestValidateRejectsMalformedSecret(t *testing.T) {
	if Validate("not!valid!base32", "287082", time.Unix(59, 0)) {
		t.Error("a malformed secret must never validate")
	}
}

func TestGenerateSecret(t *testing.T) {
	secret, err := GenerateSecret()
	if err != nil {
		t.Fatalf("GenerateSecret: %v", err)
	}

	decoded, err := base32NoPad.DecodeString(secret)
	if err != nil {
		t.Fatalf("secret is not valid unpadded base32: %v", err)
	}
	if len(decoded) != secretBytes {
		t.Errorf("secret is %d bytes, want %d", len(decoded), secretBytes)
	}
	if strings.Contains(secret, "=") {
		t.Error("secret must not carry base32 padding; apps reject it")
	}

	other, err := GenerateSecret()
	if err != nil {
		t.Fatalf("GenerateSecret: %v", err)
	}
	if other == secret {
		t.Fatal("secrets must not repeat")
	}
}

// A generated secret must round-trip through the code we ask the user to type.
func TestGeneratedSecretValidatesItsOwnCode(t *testing.T) {
	secret, err := GenerateSecret()
	if err != nil {
		t.Fatalf("GenerateSecret: %v", err)
	}
	key, err := base32NoPad.DecodeString(secret)
	if err != nil {
		t.Fatalf("decode: %v", err)
	}

	now := time.Now()
	code := generate(key, uint64(now.Unix())/uint64(Period.Seconds()))
	if !Validate(secret, code, now) {
		t.Error("a freshly generated code should validate against its own secret")
	}
}

func TestProvisioningURI(t *testing.T) {
	uri := ProvisioningURI("Guardian", "admin@guardian.local", rfcSecret)

	if !strings.HasPrefix(uri, "otpauth://totp/") {
		t.Errorf("URI should use the otpauth scheme, got %q", uri)
	}
	for _, want := range []string{"secret=" + rfcSecret, "issuer=Guardian", "digits=6", "period=30", "algorithm=SHA1"} {
		if !strings.Contains(uri, want) {
			t.Errorf("URI missing %q: %s", want, uri)
		}
	}
}

// Guards against accidentally switching to the padded encoding, which would
// produce secrets that authenticator apps silently refuse.
func TestSecretEncodingIsUnpadded(t *testing.T) {
	padded := base32.StdEncoding.EncodeToString([]byte("12345678901234567890"))
	if rfcSecret == padded {
		t.Skip("test seed length happens not to need padding")
	}
	if strings.Contains(rfcSecret, "=") {
		t.Error("base32NoPad emitted padding")
	}
}
