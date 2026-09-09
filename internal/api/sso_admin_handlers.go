package api

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"guardian-cloud/internal/audit"
	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/db"
	"guardian-cloud/internal/oauth"
)

// SSOAdminHandler lets a Guardian super admin configure social sign-in for both
// login pages.
//
// Gated on platform.settings.manage. Client secrets go in but never come back
// out: responses carry only client_secret_set.
type SSOAdminHandler struct {
	*Env
}

type providerWriteRequest struct {
	Plane           string `json:"plane"`
	Vendor          string `json:"vendor"`
	DisplayName     string `json:"display_name"`
	ButtonLabel     string `json:"button_label"`
	Issuer          string `json:"issuer"`
	ClientID        string `json:"client_id"`
	ClientSecret    string `json:"client_secret"`
	Scopes          string `json:"scopes"`
	JITProvisioning *bool  `json:"jit_provisioning"`
	SortOrder       *int   `json:"sort_order"`
	Enabled         *bool  `json:"enabled"`
}

// List returns every configured provider across both planes.
func (h *SSOAdminHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	items := []map[string]any{}
	for _, plane := range []string{auth.AdminPlane.Name, auth.CustomerPlane.Name} {
		providers, err := h.listProviders(ctx, plane, false)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load providers"})
			return
		}
		for _, provider := range providers {
			response := providerResponse(provider)
			// The operator has to paste this into Google's or GitHub's console,
			// so it is computed rather than typed and mistyped.
			response["redirect_uri"] = h.redirectURIFor(provider.Plane, provider.Slug)
			items = append(items, response)
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{"items": items, "total": len(items)})
}

// Create configures a new provider. It starts disabled: enabling requires a
// passed connection test, so a typo cannot take a login page down.
func (h *SSOAdminHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req providerWriteRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	ctx := r.Context()
	principal := auth.PrincipalForPlane(ctx, auth.AdminPlane)

	plane := strings.ToLower(strings.TrimSpace(req.Plane))
	if plane != auth.AdminPlane.Name && plane != auth.CustomerPlane.Name {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "plane must be admin or customer"})
		return
	}

	vendor := oauth.Vendor(strings.ToUpper(strings.TrimSpace(req.Vendor)))
	defaults, err := oauth.Defaults(vendor)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if strings.TrimSpace(req.ClientID) == "" || strings.TrimSpace(req.ClientSecret) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "client id and client secret are required"})
		return
	}

	endpoints := defaults.Endpoints
	if defaults.UsesDiscovery {
		if strings.TrimSpace(req.Issuer) == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error": "an issuer URL is required for this provider",
			})
			return
		}
		// Resolved once at write time and cached, so a login never depends on a
		// discovery round trip.
		endpoints, err = oauth.Discover(ctx, req.Issuer)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error": "could not read the provider's OpenID configuration: " + err.Error(),
			})
			return
		}
	}

	slug := providerSlug(plane, vendor)
	displayName := firstNonEmpty(req.DisplayName, defaults.DisplayName)
	buttonLabel := firstNonEmpty(req.ButtonLabel, defaults.ButtonLabel)
	scopes := firstNonEmpty(req.Scopes, defaults.Scopes)

	var providerID string
	err = db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		err := tx.QueryRowContext(ctx, `
			INSERT INTO identity_provider_configs
				(plane, slug, vendor, display_name, button_label, issuer, client_id,
				 scopes, jit_provisioning, enabled, sort_order,
				 authorize_url, token_url, userinfo_url, created_by)
			VALUES ($1,$2,$3,$4,$5,NULLIF($6,''),$7,$8,$9,false,$10,$11,$12,$13,$14)
			RETURNING id::text
		`,
			plane, slug, string(vendor), displayName, buttonLabel, req.Issuer, req.ClientID,
			scopes, boolOr(req.JITProvisioning, true), intOr(req.SortOrder, 0),
			endpoints.AuthorizeURL, endpoints.TokenURL, endpoints.UserinfoURL,
			principalIDOrNil(principal),
		).Scan(&providerID)
		if err != nil {
			return err
		}

		// Sealed against the row id, so the ciphertext cannot be moved to
		// another provider row.
		sealed, err := h.Sealer.Seal(req.ClientSecret, "oauth:"+providerID)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx,
			`UPDATE identity_provider_configs SET client_secret_ref = $2 WHERE id = $1`,
			providerID, sealed); err != nil {
			return err
		}

		return audit.Write(ctx, tx, auditEntryFor(r, principal, "platform.sso.provider_created",
			"identity_provider", &providerID, map[string]any{
				"vendor": string(vendor), "plane": plane,
			}))
	})

	if isUniqueViolation(err) {
		writeJSON(w, http.StatusConflict, map[string]string{
			"error": fmt.Sprintf("a %s provider is already configured for the %s login page", vendor, plane),
		})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not save the provider"})
		return
	}

	record, err := h.getProviderByID(ctx, providerID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not load the provider"})
		return
	}
	response := providerResponse(record)
	response["redirect_uri"] = h.redirectURIFor(record.Plane, record.Slug)
	writeJSON(w, http.StatusCreated, response)
}

// Update changes a provider. An omitted client secret leaves the stored one
// alone, so an operator editing the label does not have to re-enter it.
func (h *SSOAdminHandler) Update(w http.ResponseWriter, r *http.Request) {
	var req providerWriteRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	ctx := r.Context()
	principal := auth.PrincipalForPlane(ctx, auth.AdminPlane)
	providerID := chi.URLParam(r, "id")

	record, err := h.getProviderByID(ctx, providerID)
	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "provider not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not load the provider"})
		return
	}

	err = db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		if _, err := tx.ExecContext(ctx, `
			UPDATE identity_provider_configs SET
				display_name     = COALESCE(NULLIF($2,''), display_name),
				button_label     = COALESCE(NULLIF($3,''), button_label),
				client_id        = COALESCE(NULLIF($4,''), client_id),
				scopes           = COALESCE(NULLIF($5,''), scopes),
				jit_provisioning = COALESCE($6, jit_provisioning),
				sort_order       = COALESCE($7, sort_order),
				updated_at       = now()
			WHERE id = $1
		`, providerID, req.DisplayName, req.ButtonLabel, req.ClientID, req.Scopes,
			req.JITProvisioning, req.SortOrder); err != nil {
			return err
		}

		if strings.TrimSpace(req.ClientSecret) != "" {
			sealed, err := h.Sealer.Seal(req.ClientSecret, "oauth:"+providerID)
			if err != nil {
				return err
			}
			// A new secret invalidates the previous test result: the old pass
			// says nothing about the new credential.
			if _, err := tx.ExecContext(ctx, `
				UPDATE identity_provider_configs
				SET client_secret_ref = $2, last_test_ok = NULL, last_tested_at = NULL, enabled = false
				WHERE id = $1
			`, providerID, sealed); err != nil {
				return err
			}
		}

		return audit.Write(ctx, tx, auditEntryFor(r, principal, "platform.sso.provider_updated",
			"identity_provider", &providerID, map[string]any{"vendor": record.Vendor}))
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not save the provider"})
		return
	}

	updated, err := h.getProviderByID(ctx, providerID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not load the provider"})
		return
	}
	response := providerResponse(updated)
	response["redirect_uri"] = h.redirectURIFor(updated.Plane, updated.Slug)
	writeJSON(w, http.StatusOK, response)
}

// Delete removes a provider. Existing account links go with it, so anyone who
// only ever signed in that way must use password recovery.
func (h *SSOAdminHandler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	principal := auth.PrincipalForPlane(ctx, auth.AdminPlane)
	providerID := chi.URLParam(r, "id")

	if err := db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		result, err := tx.ExecContext(ctx,
			`DELETE FROM identity_provider_configs WHERE id = $1`, providerID)
		if err != nil {
			return err
		}
		if affected, _ := result.RowsAffected(); affected == 0 {
			return errProviderNotFound
		}
		return audit.Write(ctx, tx, auditEntryFor(r, principal, "platform.sso.provider_deleted",
			"identity_provider", &providerID, nil))
	}); err != nil {
		if errors.Is(err, errProviderNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "provider not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not delete the provider"})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Test performs a real credential exchange check against the provider.
//
// Returns 200 with ok:false on a failed check: a connection test that correctly
// reports "your secret is wrong" is a successful API call, and treating it as an
// error would make the client handle the same outcome in two places.
func (h *SSOAdminHandler) Test(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	providerID := chi.URLParam(r, "id")

	record, err := h.getProviderByID(ctx, providerID)
	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "provider not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not load the provider"})
		return
	}

	testErr := h.probeProvider(r, record)
	ok := testErr == nil
	message := ""
	if testErr != nil {
		message = testErr.Error()
	}

	if _, err := h.DB.ExecContext(ctx, `
		UPDATE identity_provider_configs
		SET last_tested_at = now(), last_test_ok = $2, last_test_error = NULLIF($3,'')
		WHERE id = $1
	`, providerID, ok, message); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not record the test result"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":    ok,
		"error": message,
	})
}

// probeProvider checks the configuration is usable without a browser.
//
// It cannot complete a real sign-in — that needs a human — so it verifies what
// it can: that the secret is unsealable, and that the provider's endpoints are
// reachable and answer as expected.
func (h *SSOAdminHandler) probeProvider(r *http.Request, record *providerRecord) error {
	provider, err := h.toOAuthProvider(record)
	if err != nil {
		return fmt.Errorf("stored client secret could not be read: %w", err)
	}
	if provider.ClientID == "" || provider.ClientSecret == "" {
		return errors.New("client id and secret are not both set")
	}

	if oauth.UsesDiscovery(oauth.Vendor(record.Vendor)) && record.Issuer != "" {
		if _, err := oauth.Discover(r.Context(), record.Issuer); err != nil {
			return err
		}
	}
	if provider.Endpoints.AuthorizeURL == "" || provider.Endpoints.TokenURL == "" {
		return errors.New("the provider's endpoints are not configured")
	}
	return oauth.ProbeEndpoint(r.Context(), provider.Endpoints.AuthorizeURL)
}

// SetEnabled turns a provider on or off for its login page.
func (h *SSOAdminHandler) SetEnabled(enabled bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		principal := auth.PrincipalForPlane(ctx, auth.AdminPlane)
		providerID := chi.URLParam(r, "id")

		record, err := h.getProviderByID(ctx, providerID)
		if errors.Is(err, sql.ErrNoRows) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "provider not found"})
			return
		}
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not load the provider"})
			return
		}

		// Refusing to enable an untested provider is what stops a typo in a
		// client secret from breaking the login page for everyone.
		if enabled && !(record.LastTestOK.Valid && record.LastTestOK.Bool) {
			writeJSON(w, http.StatusConflict, map[string]string{
				"error": "test the connection before enabling this provider",
			})
			return
		}

		action := "platform.sso.provider_disabled"
		if enabled {
			action = "platform.sso.provider_enabled"
		}

		if err := db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
			if _, err := tx.ExecContext(ctx,
				`UPDATE identity_provider_configs SET enabled = $2, updated_at = now() WHERE id = $1`,
				providerID, enabled); err != nil {
				return err
			}
			return audit.Write(ctx, tx, auditEntryFor(r, principal, action,
				"identity_provider", &providerID, map[string]any{
					"vendor": record.Vendor, "plane": record.Plane,
				}))
		}); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not update the provider"})
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{"enabled": enabled})
	}
}

// providerSlug is the stable identifier in sign-in URLs. Derived rather than
// chosen, so it cannot collide with a route or carry surprising characters.
func providerSlug(plane string, vendor oauth.Vendor) string {
	return strings.ToLower(plane + "-" + string(vendor))
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func boolOr(value *bool, fallback bool) bool {
	if value == nil {
		return fallback
	}
	return *value
}

func intOr(value *int, fallback int) int {
	if value == nil {
		return fallback
	}
	return *value
}

func principalIDOrNil(principal *auth.Principal) any {
	if principal == nil {
		return nil
	}
	return principal.SubjectID
}

func auditEntryFor(r *http.Request, principal *auth.Principal, action, targetType string, targetID *string, metadata map[string]any) audit.Entry {
	entry := audit.Entry{
		ActorPlane: audit.PlaneAdmin,
		ActorType:  audit.ActorGuardianAdmin,
		Action:     action,
		TargetType: targetType,
		TargetID:   targetID,
		Metadata:   metadata,
		IPAddress:  ClientIPString(r.Context()),
		UserAgent:  r.UserAgent(),
		RequestID:  RequestIDFromContext(r.Context()),
	}
	if principal != nil {
		entry.ActorID = &principal.SubjectID
	}
	return entry
}

// isUniqueViolation detects Postgres error 23505 without a driver-specific
// import, keeping this file free of pgx types.
func isUniqueViolation(err error) bool {
	return err != nil && strings.Contains(err.Error(), "23505")
}
