package oauth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// httpTimeout bounds every call we make to a provider. A hung identity provider
// must not hold a login request open indefinitely.
const httpTimeout = 10 * time.Second

var client = &http.Client{Timeout: httpTimeout}

// Provider is a configured, ready-to-use sign-in provider.
type Provider struct {
	Slug         string
	Vendor       Vendor
	DisplayName  string
	ClientID     string
	ClientSecret string
	Scopes       string
	Endpoints    Endpoints
	EmailClaim   string
	NameClaim    string
}

// Identity is what a provider tells us about the person who just signed in.
type Identity struct {
	// Subject is the provider's own immutable id. Accounts are matched on this
	// rather than on email, so a rename at the provider does not orphan them.
	Subject       string
	Email         string
	EmailVerified bool
	Name          string
}

// PKCE is the proof-key pair for one authorization request.
type PKCE struct {
	Verifier  string
	Challenge string
}

// NewPKCE generates a verifier and its S256 challenge.
//
// PKCE binds the authorization code to this specific request, so a code
// intercepted in the redirect cannot be redeemed by anyone else.
func NewPKCE() (PKCE, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return PKCE{}, fmt.Errorf("generate pkce verifier: %w", err)
	}
	verifier := base64.RawURLEncoding.EncodeToString(raw)
	sum := sha256.Sum256([]byte(verifier))
	return PKCE{
		Verifier:  verifier,
		Challenge: base64.RawURLEncoding.EncodeToString(sum[:]),
	}, nil
}

// AuthorizeURL builds the URL the browser is sent to.
func (p *Provider) AuthorizeURL(redirectURI, state, nonce string, pkce PKCE) string {
	query := url.Values{
		"client_id":     {p.ClientID},
		"redirect_uri":  {redirectURI},
		"response_type": {"code"},
		"scope":         {p.Scopes},
		"state":         {state},
	}

	// GitHub supports neither nonce nor PKCE; sending them is harmless on
	// OAuth2 but pointless, and state remains the CSRF defence there.
	if !IsOAuth2Only(p.Vendor) {
		query.Set("nonce", nonce)
		query.Set("code_challenge", pkce.Challenge)
		query.Set("code_challenge_method", "S256")
	}

	return p.Endpoints.AuthorizeURL + "?" + query.Encode()
}

// Exchange trades the authorization code for an access token.
//
// Server-to-server over TLS with the client secret, which is why the resulting
// token can be trusted without verifying an id_token signature.
func (p *Provider) Exchange(ctx context.Context, code, redirectURI, verifier string) (string, error) {
	form := url.Values{
		"client_id":     {p.ClientID},
		"client_secret": {p.ClientSecret},
		"code":          {code},
		"redirect_uri":  {redirectURI},
		"grant_type":    {"authorization_code"},
	}
	if !IsOAuth2Only(p.Vendor) && verifier != "" {
		form.Set("code_verifier", verifier)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.Endpoints.TokenURL,
		strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	// GitHub returns form-encoded unless asked otherwise; everyone else ignores
	// this and returns JSON regardless.
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("token exchange: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", fmt.Errorf("read token response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("token exchange failed with status %d", resp.StatusCode)
	}

	var payload struct {
		AccessToken      string `json:"access_token"`
		Error            string `json:"error"`
		ErrorDescription string `json:"error_description"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return "", fmt.Errorf("decode token response: %w", err)
	}
	if payload.Error != "" {
		return "", fmt.Errorf("provider rejected the exchange: %s", payload.Error)
	}
	if payload.AccessToken == "" {
		return "", fmt.Errorf("provider returned no access token")
	}
	return payload.AccessToken, nil
}

// FetchIdentity reads the signed-in user from the provider.
func (p *Provider) FetchIdentity(ctx context.Context, accessToken string) (*Identity, error) {
	if p.Vendor == VendorGitHub {
		return p.fetchGitHubIdentity(ctx, accessToken)
	}
	return p.fetchOIDCIdentity(ctx, accessToken)
}

func (p *Provider) fetchOIDCIdentity(ctx context.Context, accessToken string) (*Identity, error) {
	var claims map[string]any
	if err := p.getJSON(ctx, p.Endpoints.UserinfoURL, accessToken, &claims); err != nil {
		return nil, err
	}

	subject, _ := claims["sub"].(string)
	if subject == "" {
		return nil, fmt.Errorf("provider returned no subject claim")
	}

	emailClaim := p.EmailClaim
	if emailClaim == "" {
		emailClaim = "email"
	}
	nameClaim := p.NameClaim
	if nameClaim == "" {
		nameClaim = "name"
	}

	email, _ := claims[emailClaim].(string)
	name, _ := claims[nameClaim].(string)

	// Providers are inconsistent about the type here: Google sends a bool,
	// others sometimes send the string "true".
	verified := false
	switch v := claims["email_verified"].(type) {
	case bool:
		verified = v
	case string:
		verified, _ = strconv.ParseBool(v)
	}

	return &Identity{Subject: subject, Email: email, EmailVerified: verified, Name: name}, nil
}

// fetchGitHubIdentity reads the profile and then the address list.
//
// The profile's `email` field is only the public one, which is often unset, so
// the verified primary address has to be fetched separately.
func (p *Provider) fetchGitHubIdentity(ctx context.Context, accessToken string) (*Identity, error) {
	var profile struct {
		ID    int64  `json:"id"`
		Login string `json:"login"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := p.getJSON(ctx, p.Endpoints.UserinfoURL, accessToken, &profile); err != nil {
		return nil, err
	}
	if profile.ID == 0 {
		return nil, fmt.Errorf("github returned no user id")
	}

	identity := &Identity{
		// Numeric id, not the login: a GitHub username can be changed and even
		// reused by someone else, which would silently transfer an account.
		Subject: strconv.FormatInt(profile.ID, 10),
		Email:   profile.Email,
		Name:    profile.Name,
	}
	if identity.Name == "" {
		identity.Name = profile.Login
	}

	var emails []struct {
		Email    string `json:"email"`
		Primary  bool   `json:"primary"`
		Verified bool   `json:"verified"`
	}
	if err := p.getJSON(ctx, "https://api.github.com/user/emails", accessToken, &emails); err != nil {
		// The scope may have been declined. Fall back to the public address,
		// which the caller will treat as unverified.
		return identity, nil
	}

	for _, candidate := range emails {
		if candidate.Primary && candidate.Verified {
			identity.Email = candidate.Email
			identity.EmailVerified = true
			return identity, nil
		}
	}
	// No verified primary: take any verified address rather than none.
	for _, candidate := range emails {
		if candidate.Verified {
			identity.Email = candidate.Email
			identity.EmailVerified = true
			return identity, nil
		}
	}
	return identity, nil
}

func (p *Provider) getJSON(ctx context.Context, endpoint, accessToken string, target any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")
	// GitHub requires a User-Agent and rejects requests without one.
	req.Header.Set("User-Agent", "Guardian-Cloud")

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("call %s: %w", endpoint, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%s returned status %d", endpoint, resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return fmt.Errorf("read %s: %w", endpoint, err)
	}
	if err := json.Unmarshal(body, target); err != nil {
		return fmt.Errorf("decode %s: %w", endpoint, err)
	}
	return nil
}

// ProbeEndpoint checks that a provider endpoint is reachable and speaks HTTP.
//
// A configuration test cannot complete a real sign-in, since that needs a human
// at the provider's consent screen. This verifies the part that can be checked
// unattended: that the URL resolves and answers. Any HTTP status counts as
// reachable — authorize endpoints legitimately return 400 or a redirect when
// called without the full parameter set.
func ProbeEndpoint(ctx context.Context, endpoint string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return fmt.Errorf("invalid endpoint %q", endpoint)
	}

	// Don't follow redirects: arriving at the consent page is not informative,
	// and the redirect itself already proves reachability.
	probe := &http.Client{
		Timeout: httpTimeout,
		CheckRedirect: func(*http.Request, []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}

	resp, err := probe.Do(req)
	if err != nil {
		return fmt.Errorf("could not reach %s: %w", endpoint, err)
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 4096))

	if resp.StatusCode >= 500 {
		return fmt.Errorf("%s returned status %d", endpoint, resp.StatusCode)
	}
	return nil
}

// Discover resolves endpoints from an OIDC issuer's well-known document.
// Used for GENERIC, Okta and Azure AD, where the URLs are tenant-specific.
func Discover(ctx context.Context, issuer string) (Endpoints, error) {
	wellKnown := strings.TrimRight(issuer, "/") + "/.well-known/openid-configuration"

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, wellKnown, nil)
	if err != nil {
		return Endpoints{}, err
	}
	resp, err := client.Do(req)
	if err != nil {
		return Endpoints{}, fmt.Errorf("discovery request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return Endpoints{}, fmt.Errorf("discovery returned status %d", resp.StatusCode)
	}

	var document struct {
		AuthorizationEndpoint string `json:"authorization_endpoint"`
		TokenEndpoint         string `json:"token_endpoint"`
		UserinfoEndpoint      string `json:"userinfo_endpoint"`
	}
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return Endpoints{}, err
	}
	if err := json.Unmarshal(body, &document); err != nil {
		return Endpoints{}, fmt.Errorf("decode discovery document: %w", err)
	}
	if document.AuthorizationEndpoint == "" || document.TokenEndpoint == "" {
		return Endpoints{}, fmt.Errorf("discovery document is missing required endpoints")
	}

	return Endpoints{
		AuthorizeURL: document.AuthorizationEndpoint,
		TokenURL:     document.TokenEndpoint,
		UserinfoURL:  document.UserinfoEndpoint,
	}, nil
}
