package api

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"guardian-cloud/internal/oauth"
)

// providerRecord is a configured sign-in provider as stored.
//
// ClientSecret is the sealed blob, never the plaintext, and is never included in
// an API response — callers get only clientSecretSet.
type providerRecord struct {
	ID              string
	Plane           string
	Slug            string
	Vendor          string
	DisplayName     string
	ButtonLabel     string
	Issuer          string
	ClientID        string
	ClientSecretRef string
	Scopes          string
	EmailClaim      string
	NameClaim       string
	JITProvisioning bool
	Enabled         bool
	SortOrder       int
	AuthorizeURL    string
	TokenURL        string
	UserinfoURL     string
	LastTestedAt    sql.NullTime
	LastTestOK      sql.NullBool
	LastTestError   sql.NullString
}

const providerColumns = `
	id::text, plane, slug, vendor, display_name, COALESCE(button_label,''),
	COALESCE(issuer,''), client_id, COALESCE(client_secret_ref,''), scopes,
	email_claim, name_claim, jit_provisioning, enabled, sort_order,
	COALESCE(authorize_url,''), COALESCE(token_url,''), COALESCE(userinfo_url,''),
	last_tested_at, last_test_ok, last_test_error
`

func scanProvider(scanner interface{ Scan(...any) error }) (*providerRecord, error) {
	var p providerRecord
	err := scanner.Scan(
		&p.ID, &p.Plane, &p.Slug, &p.Vendor, &p.DisplayName, &p.ButtonLabel,
		&p.Issuer, &p.ClientID, &p.ClientSecretRef, &p.Scopes,
		&p.EmailClaim, &p.NameClaim, &p.JITProvisioning, &p.Enabled, &p.SortOrder,
		&p.AuthorizeURL, &p.TokenURL, &p.UserinfoURL,
		&p.LastTestedAt, &p.LastTestOK, &p.LastTestError,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// listProviders returns configured providers for a plane, optionally only the
// enabled ones (which is what the public login page asks for).
func (e *Env) listProviders(ctx context.Context, plane string, onlyEnabled bool) ([]*providerRecord, error) {
	query := fmt.Sprintf(
		`SELECT %s FROM identity_provider_configs WHERE plane = $1`, providerColumns)
	if onlyEnabled {
		query += ` AND enabled = true`
	}
	query += ` ORDER BY sort_order ASC, display_name ASC`

	rows, err := e.DB.QueryContext(ctx, query, plane)
	if err != nil {
		return nil, fmt.Errorf("list providers: %w", err)
	}
	defer rows.Close()

	providers := []*providerRecord{}
	for rows.Next() {
		provider, err := scanProvider(rows)
		if err != nil {
			return nil, fmt.Errorf("scan provider: %w", err)
		}
		providers = append(providers, provider)
	}
	return providers, rows.Err()
}

func (e *Env) getProviderByID(ctx context.Context, id string) (*providerRecord, error) {
	query := fmt.Sprintf(`SELECT %s FROM identity_provider_configs WHERE id = $1`, providerColumns)
	return scanProvider(e.DB.QueryRowContext(ctx, query, id))
}

// getEnabledProviderBySlug resolves the provider a sign-in attempt names.
//
// Scoped to the plane and to enabled=true, so a provider configured for staff
// can never be driven from the customer login page, and a disabled one stops
// working immediately rather than at the next restart.
func (e *Env) getEnabledProviderBySlug(ctx context.Context, plane, slug string) (*providerRecord, error) {
	query := fmt.Sprintf(
		`SELECT %s FROM identity_provider_configs WHERE plane = $1 AND slug = $2 AND enabled = true`,
		providerColumns)
	return scanProvider(e.DB.QueryRowContext(ctx, query, plane, slug))
}

// toOAuthProvider unseals the client secret and produces a usable provider.
func (e *Env) toOAuthProvider(record *providerRecord) (*oauth.Provider, error) {
	secret := ""
	if record.ClientSecretRef != "" {
		opened, err := e.Sealer.Open(record.ClientSecretRef, "oauth:"+record.ID)
		if err != nil {
			return nil, fmt.Errorf("unseal client secret: %w", err)
		}
		secret = opened
	}

	return &oauth.Provider{
		Slug:         record.Slug,
		Vendor:       oauth.Vendor(record.Vendor),
		DisplayName:  record.DisplayName,
		ClientID:     record.ClientID,
		ClientSecret: secret,
		Scopes:       record.Scopes,
		Endpoints: oauth.Endpoints{
			AuthorizeURL: record.AuthorizeURL,
			TokenURL:     record.TokenURL,
			UserinfoURL:  record.UserinfoURL,
		},
		EmailClaim: record.EmailClaim,
		NameClaim:  record.NameClaim,
	}, nil
}

// providerResponse is the admin-facing shape.
//
// Built by hand rather than by serialising the record, so the sealed secret
// cannot leak through a forgotten struct tag.
func providerResponse(record *providerRecord) map[string]any {
	out := map[string]any{
		"id":                record.ID,
		"plane":             record.Plane,
		"slug":              record.Slug,
		"vendor":            record.Vendor,
		"display_name":      record.DisplayName,
		"button_label":      record.ButtonLabel,
		"issuer":            record.Issuer,
		"client_id":         record.ClientID,
		"client_secret_set": record.ClientSecretRef != "",
		"scopes":            record.Scopes,
		"email_claim":       record.EmailClaim,
		"name_claim":        record.NameClaim,
		"jit_provisioning":  record.JITProvisioning,
		"enabled":           record.Enabled,
		"sort_order":        record.SortOrder,
		"authorize_url":     record.AuthorizeURL,
		"redirect_uri":      "",
		"last_test_ok":      nil,
		"last_test_error":   nil,
		"last_tested_at":    nil,
	}
	if record.LastTestedAt.Valid {
		out["last_tested_at"] = record.LastTestedAt.Time.UTC().Format(timeLayout)
	}
	if record.LastTestOK.Valid {
		out["last_test_ok"] = record.LastTestOK.Bool
	}
	if record.LastTestError.Valid && record.LastTestError.String != "" {
		out["last_test_error"] = record.LastTestError.String
	}
	return out
}

// publicProviderResponse is what an unauthenticated login page may see: enough
// to render a button, and nothing about how the provider is configured.
func publicProviderResponse(record *providerRecord) map[string]any {
	label := record.ButtonLabel
	if label == "" {
		label = "Continue with " + record.DisplayName
	}
	return map[string]any{
		"slug":         record.Slug,
		"vendor":       record.Vendor,
		"display_name": record.DisplayName,
		"button_label": label,
	}
}

// redirectURIFor is the callback the provider must be configured to return to.
//
// Built from the *app* origin rather than the API's own, because this is where
// the provider sends the browser and where the session cookie therefore gets
// stored. Returning to the API's origin directly would set the cookie on a
// different site from the app, and it would never be sent back.
//
// This assumes the app origin forwards /api to the backend, which the Vite dev
// proxy and a normal production ingress both do.
func (e *Env) redirectURIFor(plane, slug string) string {
	base := strings.TrimRight(e.Config.PublicWebURL, "/")
	if plane == "admin" {
		return fmt.Sprintf("%s/api/v1/admin/auth/sso/%s/callback", base, slug)
	}
	return fmt.Sprintf("%s/api/v1/auth/sso/%s/callback", base, slug)
}

var errProviderNotFound = errors.New("provider not found")
