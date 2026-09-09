package api

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/go-chi/chi/v5"

	"guardian-cloud/internal/audit"
	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/crypto"
	"guardian-cloud/internal/db"
	"guardian-cloud/internal/oauth"
)

// Social sign-in, for whichever plane the AuthHandler serves.
//
// The flow is: Start redirects to the provider; the provider redirects back to
// Callback; Callback exchanges the code server-side, matches or provisions the
// account, and issues a session. Every step that could be replayed or forged is
// bound to a single-use `oidc_auth_requests` row.

// PublicProviders lists the enabled providers for this plane's login page.
//
// Unauthenticated by necessity — the login page has to render its buttons
// before anyone has signed in. It exposes only slug, vendor and label; nothing
// about how the provider is configured.
func (h *AuthHandler) PublicProviders(w http.ResponseWriter, r *http.Request) {
	providers, err := h.listProviders(r.Context(), h.Plane.Name, true)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load sign-in options"})
		return
	}

	items := make([]map[string]any, 0, len(providers))
	for _, provider := range providers {
		items = append(items, publicProviderResponse(provider))
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items, "total": len(items)})
}

// StartSSO redirects the browser to the provider's consent screen.
func (h *AuthHandler) StartSSO(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	slug := chi.URLParam(r, "slug")

	record, err := h.getEnabledProviderBySlug(ctx, h.Plane.Name, slug)
	if errors.Is(err, sql.ErrNoRows) {
		http.Redirect(w, r, h.loginURL("sso_unavailable"), http.StatusFound)
		return
	}
	if err != nil {
		http.Redirect(w, r, h.loginURL("sso_failed"), http.StatusFound)
		return
	}

	provider, err := h.toOAuthProvider(record)
	if err != nil {
		http.Redirect(w, r, h.loginURL("sso_misconfigured"), http.StatusFound)
		return
	}

	state, stateHash, err := crypto.NewOpaqueToken()
	if err != nil {
		http.Redirect(w, r, h.loginURL("sso_failed"), http.StatusFound)
		return
	}
	nonce, _, err := crypto.NewOpaqueToken()
	if err != nil {
		http.Redirect(w, r, h.loginURL("sso_failed"), http.StatusFound)
		return
	}
	pkce, err := oauth.NewPKCE()
	if err != nil {
		http.Redirect(w, r, h.loginURL("sso_failed"), http.StatusFound)
		return
	}

	// Validated against the origin allowlist so this cannot become an open
	// redirect for anyone who can craft a link to /sso/{slug}/start.
	redirectAfter := h.safeRedirectTarget(r.URL.Query().Get("redirect"))

	if _, err := h.DB.ExecContext(ctx, `
		INSERT INTO oidc_auth_requests
			(plane, provider_id, state_hash, nonce, code_verifier, redirect_after, expires_at, ip_address)
		VALUES ($1, $2, $3, $4, $5, NULLIF($6,''), now() + interval '10 minutes', NULLIF($7,'')::inet)
	`, h.Plane.Name, record.ID, stateHash, nonce, pkce.Verifier, redirectAfter, ClientIPString(ctx)); err != nil {
		http.Redirect(w, r, h.loginURL("sso_failed"), http.StatusFound)
		return
	}

	http.Redirect(w, r,
		provider.AuthorizeURL(h.redirectURIFor(h.Plane.Name, slug), state, nonce, pkce),
		http.StatusFound)
}

// CallbackSSO completes sign-in and redirects into the app.
//
// Everything here ends in a redirect rather than a JSON body: this is a
// top-level browser navigation back from the provider, so the user must land on
// a page either way.
func (h *AuthHandler) CallbackSSO(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	slug := chi.URLParam(r, "slug")
	query := r.URL.Query()

	// The provider reports a declined consent this way.
	if providerError := query.Get("error"); providerError != "" {
		http.Redirect(w, r, h.loginURL("sso_cancelled"), http.StatusFound)
		return
	}

	code, state := query.Get("code"), query.Get("state")
	if code == "" || state == "" {
		http.Redirect(w, r, h.loginURL("sso_failed"), http.StatusFound)
		return
	}

	// Consumed in the same statement that validates it, so a replayed callback
	// URL matches no row and cannot mint a second session.
	var requestID, providerID, verifier string
	var redirectAfter sql.NullString
	err := h.DB.QueryRowContext(ctx, `
		UPDATE oidc_auth_requests SET consumed_at = now()
		WHERE state_hash = $1 AND plane = $2 AND consumed_at IS NULL AND expires_at > now()
		RETURNING id::text, provider_id::text, code_verifier, redirect_after
	`, crypto.HashToken(state), h.Plane.Name).Scan(&requestID, &providerID, &verifier, &redirectAfter)

	if errors.Is(err, sql.ErrNoRows) {
		http.Redirect(w, r, h.loginURL("sso_expired"), http.StatusFound)
		return
	}
	if err != nil {
		http.Redirect(w, r, h.loginURL("sso_failed"), http.StatusFound)
		return
	}

	record, err := h.getProviderByID(ctx, providerID)
	if err != nil {
		http.Redirect(w, r, h.loginURL("sso_failed"), http.StatusFound)
		return
	}
	provider, err := h.toOAuthProvider(record)
	if err != nil {
		http.Redirect(w, r, h.loginURL("sso_misconfigured"), http.StatusFound)
		return
	}

	accessToken, err := provider.Exchange(ctx, code, h.redirectURIFor(h.Plane.Name, slug), verifier)
	if err != nil {
		http.Redirect(w, r, h.loginURL("sso_failed"), http.StatusFound)
		return
	}

	identity, err := provider.FetchIdentity(ctx, accessToken)
	if err != nil {
		http.Redirect(w, r, h.loginURL("sso_failed"), http.StatusFound)
		return
	}
	if identity.Email == "" {
		http.Redirect(w, r, h.loginURL("sso_no_email"), http.StatusFound)
		return
	}

	subjectID, err := h.resolveSSOAccount(r, record, identity)
	if errors.Is(err, errSSONoAccount) {
		http.Redirect(w, r, h.loginURL("sso_no_account"), http.StatusFound)
		return
	}
	if errors.Is(err, errSSOAccountDisabled) {
		http.Redirect(w, r, h.loginURL("sso_account_disabled"), http.StatusFound)
		return
	}
	if err != nil {
		http.Redirect(w, r, h.loginURL("sso_failed"), http.StatusFound)
		return
	}

	if err := h.issueSSOSession(w, r, subjectID); err != nil {
		http.Redirect(w, r, h.loginURL("sso_failed"), http.StatusFound)
		return
	}

	destination := h.defaultLandingPath()
	if redirectAfter.Valid && redirectAfter.String != "" {
		destination = redirectAfter.String
	}
	http.Redirect(w, r, strings.TrimRight(h.Config.PublicWebURL, "/")+destination, http.StatusFound)
}

var (
	errSSONoAccount       = errors.New("no account for this identity")
	errSSOAccountDisabled = errors.New("account not permitted to sign in")
)

// resolveSSOAccount finds, links or provisions the local account.
//
// Matching is by provider subject first — a stable id that survives the person
// renaming themselves or changing address at the provider. Email is only used to
// attach a provider to an account that already exists, and only when the
// provider says the address is verified: trusting an unverified address would
// let someone claim an account by signing up at the provider with its email.
func (h *AuthHandler) resolveSSOAccount(r *http.Request, record *providerRecord, identity *oauth.Identity) (string, error) {
	ctx := r.Context()
	email := auth.NormalizeEmail(identity.Email)
	var subjectID string

	err := db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		// 1. An existing link for this provider subject.
		err := tx.QueryRowContext(ctx, `
			SELECT subject_id::text FROM identity_providers
			WHERE provider_id = $1 AND provider_subject = $2 AND plane = $3
		`, record.ID, identity.Subject, h.Plane.Name).Scan(&subjectID)
		if err == nil {
			_, err = tx.ExecContext(ctx, `
				UPDATE identity_providers SET last_login_at = now()
				WHERE provider_id = $1 AND provider_subject = $2
			`, record.ID, identity.Subject)
			return err
		}
		if !errors.Is(err, sql.ErrNoRows) {
			return err
		}

		// 2. An existing local account with the same verified address.
		if identity.EmailVerified {
			query := fmt.Sprintf(
				`SELECT id::text, status FROM %s WHERE email = $1 AND deleted_at IS NULL`,
				h.Plane.UsersTable)
			var status string
			err = tx.QueryRowContext(ctx, query, email).Scan(&subjectID, &status)
			if err == nil {
				if status != "ACTIVE" {
					return errSSOAccountDisabled
				}
				return h.linkIdentity(ctx, tx, record, identity, subjectID)
			}
			if !errors.Is(err, sql.ErrNoRows) {
				return err
			}
		}

		// 3. Nothing matched. Creating an account from an SSO assertion alone is
		// only allowed when the operator has turned JIT provisioning on, and
		// never on the staff plane, where accounts come from invitations.
		if !record.JITProvisioning || h.Plane.IsAdmin() {
			return errSSONoAccount
		}
		newID, err := h.provisionCustomerFromSSO(ctx, tx, r, identity, email)
		if err != nil {
			return err
		}
		subjectID = newID
		return h.linkIdentity(ctx, tx, record, identity, subjectID)
	})
	if err != nil {
		return "", err
	}
	return subjectID, nil
}

func (h *AuthHandler) linkIdentity(ctx context.Context, tx *sql.Tx, record *providerRecord, identity *oauth.Identity, subjectID string) error {
	_, err := tx.ExecContext(ctx, `
		INSERT INTO identity_providers (plane, subject_id, provider_id, provider_subject, last_login_at)
		VALUES ($1, $2, $3, $4, now())
		ON CONFLICT (provider_id, provider_subject) DO UPDATE SET last_login_at = now()
	`, h.Plane.Name, subjectID, record.ID, identity.Subject)
	return err
}

// provisionCustomerFromSSO creates a customer account and its personal tenant.
//
// Mirrors the password signup transaction: a user without a tenant is not a
// valid state, so both are created together or neither is.
func (h *AuthHandler) provisionCustomerFromSSO(ctx context.Context, tx *sql.Tx, r *http.Request, identity *oauth.Identity, email string) (string, error) {
	displayName := identity.Name
	if displayName == "" {
		displayName = email
	}

	var userID string
	if err := tx.QueryRowContext(ctx, `
		INSERT INTO users (email, display_name, email_verified_at)
		VALUES ($1, $2, now())
		RETURNING id::text
	`, email, displayName).Scan(&userID); err != nil {
		return "", err
	}

	var tenantID string
	if err := tx.QueryRowContext(ctx, `
		INSERT INTO tenants (type, name, owner_user_id)
		VALUES ('PERSONAL', $1, $2)
		RETURNING id::text
	`, displayName, userID).Scan(&tenantID); err != nil {
		return "", err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO memberships (user_id, tenant_id, role_id) VALUES ($1, $2, $3)
	`, userID, tenantID, personalOwnerRoleID); err != nil {
		return "", err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO subscriptions
			(tenant_id, plan_id, status, seat_or_device_limit, current_period_start, current_period_end)
		SELECT $1, id, 'TRIALING', device_limit, now(), now() + $3::interval
		FROM plans WHERE id = $2
	`, tenantID, personalBasicPlanID, fmt.Sprintf("%d days", trialDays)); err != nil {
		return "", err
	}

	return userID, audit.Write(ctx, tx, audit.Entry{
		TenantID:   &tenantID,
		ActorPlane: h.Plane.Name,
		ActorType:  h.Plane.AuditActorType,
		ActorID:    &userID,
		Action:     "ACCOUNT_CREATED",
		TargetType: "user",
		TargetID:   &userID,
		Metadata:   map[string]any{"via": "sso"},
		IPAddress:  ClientIPString(ctx),
		UserAgent:  r.UserAgent(),
		RequestID:  RequestIDFromContext(ctx),
	})
}

// issueSSOSession creates the session after a successful federated sign-in.
func (h *AuthHandler) issueSSOSession(w http.ResponseWriter, r *http.Request, subjectID string) error {
	ctx := r.Context()

	identity, err := auth.LoadIdentityByID(ctx, h.DB, h.Plane, subjectID)
	if err != nil {
		return err
	}
	if err := auth.CheckAccountStatus(identity); err != nil {
		return err
	}

	var session *auth.IssuedSession
	err = db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		var err error
		session, err = auth.IssueSession(ctx, tx, h.Plane, h.SessionPolicy(ctx), auth.IssueOptions{
			SubjectID: subjectID,
			IPAddress: ClientIPString(ctx),
			UserAgent: r.UserAgent(),
			// The provider performed the authentication, including whatever
			// second factor it enforces.
			AuthMethod:   "SSO",
			MFASatisfied: true,
		})
		if err != nil {
			return err
		}
		if err := auth.RecordLogin(ctx, tx, h.Plane, subjectID); err != nil {
			return err
		}
		if err := auth.RecordAttempt(ctx, tx, h.Plane, identity.Email, subjectID, "SUCCESS",
			ClientIPString(ctx), r.UserAgent(), RequestIDFromContext(ctx)); err != nil {
			return err
		}
		return audit.Write(ctx, tx, audit.Entry{
			ActorPlane: h.Plane.Name,
			ActorType:  h.Plane.AuditActorType,
			ActorID:    &subjectID,
			Action:     "auth.login",
			TargetType: "session",
			TargetID:   &session.SessionID,
			Metadata:   map[string]any{"auth_method": "SSO"},
			IPAddress:  ClientIPString(ctx),
			UserAgent:  r.UserAgent(),
			RequestID:  RequestIDFromContext(ctx),
		})
	})
	if err != nil {
		return err
	}

	auth.SetSessionCookies(w, h.Plane, h.CookieConfig(), session)
	return nil
}

// loginURL is where a failed sign-in lands, carrying a reason the page explains.
func (h *AuthHandler) loginURL(reason string) string {
	base := strings.TrimRight(h.Config.PublicWebURL, "/")
	path := "/login"
	if h.Plane.IsAdmin() {
		path = "/super/login"
	}
	return fmt.Sprintf("%s%s?error=%s", base, path, url.QueryEscape(reason))
}

func (h *AuthHandler) defaultLandingPath() string {
	if h.Plane.IsAdmin() {
		return "/admin"
	}
	return "/app"
}

// safeRedirectTarget accepts only same-site absolute paths.
//
// Without this, `?redirect=https://evil.example` would turn a legitimate
// sign-in link into an open redirect that lands the user on an attacker's page
// immediately after authenticating.
func (h *AuthHandler) safeRedirectTarget(candidate string) string {
	if candidate == "" || !strings.HasPrefix(candidate, "/") {
		return ""
	}
	// "//host" is protocol-relative and leaves the site.
	if strings.HasPrefix(candidate, "//") {
		return ""
	}
	return candidate
}
