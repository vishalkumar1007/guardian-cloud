// Package oauth implements social sign-in for both identity planes.
//
// Two protocol shapes are supported. Google and other OIDC providers publish a
// discovery document; GitHub is plain OAuth2 with its own user API and no
// discovery at all. Both reduce to the same three steps — build an authorize
// URL, exchange the code server-side, fetch the user — so the rest of the
// application does not need to care which it is talking to.
//
// Note on id_tokens: this deliberately does not parse or verify them, and so
// needs no JWKS handling. The access token is obtained by a direct back-channel
// TLS call to the provider's token endpoint and immediately spent against the
// provider's own userinfo endpoint. Trust comes from TLS plus the fact that the
// browser never touches the token, which is what id_token signature
// verification would otherwise be establishing.
package oauth

import "fmt"

// Vendor identifies a provider's protocol shape and default endpoints.
type Vendor string

const (
	VendorGoogle  Vendor = "GOOGLE"
	VendorGitHub  Vendor = "GITHUB"
	VendorOkta    Vendor = "OKTA"
	VendorAzureAD Vendor = "AZURE_AD"
	// VendorGeneric is any other OIDC provider, configured by issuer and
	// resolved through discovery.
	VendorGeneric Vendor = "GENERIC"
)

// Endpoints are the three URLs a sign-in flow needs.
type Endpoints struct {
	AuthorizeURL string
	TokenURL     string
	UserinfoURL  string
}

// VendorDefaults describes a provider we know how to talk to without discovery.
type VendorDefaults struct {
	DisplayName string
	ButtonLabel string
	Scopes      string
	Endpoints   Endpoints
	// UsesDiscovery is true when the endpoints must be resolved from an issuer
	// rather than taken from the constants here.
	UsesDiscovery bool
}

// knownVendors spares the operator from pasting endpoint URLs for the providers
// almost everyone uses. They only supply a client id and secret.
var knownVendors = map[Vendor]VendorDefaults{
	VendorGoogle: {
		DisplayName: "Google",
		ButtonLabel: "Continue with Google",
		// openid gets us a stable subject; the other two get email and name.
		Scopes: "openid email profile",
		Endpoints: Endpoints{
			AuthorizeURL: "https://accounts.google.com/o/oauth2/v2/auth",
			TokenURL:     "https://oauth2.googleapis.com/token",
			UserinfoURL:  "https://openidconnect.googleapis.com/v1/userinfo",
		},
	},
	VendorGitHub: {
		DisplayName: "GitHub",
		ButtonLabel: "Continue with GitHub",
		// GitHub hides addresses behind a separate endpoint, so read:user alone
		// is not enough to get a verified email.
		Scopes: "read:user user:email",
		Endpoints: Endpoints{
			AuthorizeURL: "https://github.com/login/oauth/authorize",
			TokenURL:     "https://github.com/login/oauth/access_token",
			UserinfoURL:  "https://api.github.com/user",
		},
	},
	VendorOkta:    {DisplayName: "Okta", ButtonLabel: "Continue with Okta", Scopes: "openid email profile", UsesDiscovery: true},
	VendorAzureAD: {DisplayName: "Microsoft", ButtonLabel: "Continue with Microsoft", Scopes: "openid email profile", UsesDiscovery: true},
	VendorGeneric: {DisplayName: "Single sign-on", ButtonLabel: "Continue with SSO", Scopes: "openid email profile", UsesDiscovery: true},
}

// Defaults returns what we know about a vendor.
func Defaults(vendor Vendor) (VendorDefaults, error) {
	defaults, ok := knownVendors[vendor]
	if !ok {
		return VendorDefaults{}, fmt.Errorf("unknown provider vendor %q", vendor)
	}
	return defaults, nil
}

// IsOAuth2Only reports whether a vendor speaks plain OAuth2 rather than OIDC.
// GitHub is the one that matters: it has no id_token and no discovery document.
func IsOAuth2Only(vendor Vendor) bool {
	return vendor == VendorGitHub
}

// UsesDiscovery reports whether a vendor's endpoints must be resolved from an
// issuer rather than being fixed and well known.
func UsesDiscovery(vendor Vendor) bool {
	defaults, err := Defaults(vendor)
	if err != nil {
		return false
	}
	return defaults.UsesDiscovery
}
