-- +goose Up
-- OIDC single sign-on for both identity planes.
--
-- The design documents only ever describe `identity_providers` as a user-to-IdP
-- LINK table (DBD Section 4). There is nowhere to persist the IdP configuration
-- itself — issuer, client credentials, claim mapping — so that table is new here.

CREATE TABLE identity_provider_configs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Which login page this provider appears on. Customer-tenant SSO is Phase 4
    -- in the roadmap; the column exists so enabling it is configuration, not a
    -- migration.
    plane         TEXT NOT NULL CHECK (plane IN ('customer','admin')),
    slug          TEXT NOT NULL UNIQUE,   -- appears in /auth/sso/{slug}/start
    display_name  TEXT NOT NULL,
    vendor        TEXT NOT NULL DEFAULT 'GENERIC'
                   CHECK (vendor IN ('GENERIC','GOOGLE','OKTA','AZURE_AD')),
    issuer        TEXT NOT NULL,          -- discovery root, not the full URL
    client_id     TEXT NOT NULL,
    -- AES-GCM sealed. Never returned by the API; responses carry only a
    -- client_secret_set boolean.
    client_secret_ref TEXT,
    scopes        TEXT NOT NULL DEFAULT 'openid email profile',
    -- Which claims carry the email and display name, since IdPs differ.
    email_claim   TEXT NOT NULL DEFAULT 'email',
    name_claim    TEXT NOT NULL DEFAULT 'name',
    -- Invite-only is the safe default: a valid IdP assertion alone does not
    -- create an account, it only matches an existing one.
    jit_provisioning BOOLEAN NOT NULL DEFAULT false,
    enabled       BOOLEAN NOT NULL DEFAULT false,
    -- Enabling is refused until a discovery probe has succeeded, so a typo in
    -- the issuer cannot take the login page down.
    last_tested_at     TIMESTAMPTZ,
    last_test_ok       BOOLEAN,
    last_test_error    TEXT,
    created_by    UUID REFERENCES guardian_admin_users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email-domain routing, so the login page can offer the right provider once the
-- address is typed.
CREATE TABLE identity_provider_domains (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES identity_provider_configs(id) ON DELETE CASCADE,
    domain      CITEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The user-to-IdP link (DBD Section 4 `identity_providers`), extended with a
-- plane discriminator because either identity domain can federate.
CREATE TABLE identity_providers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plane            TEXT NOT NULL CHECK (plane IN ('customer','admin')),
    subject_id       UUID NOT NULL,   -- users.id or guardian_admin_users.id
    provider_id      UUID NOT NULL REFERENCES identity_provider_configs(id) ON DELETE CASCADE,
    -- The IdP's own immutable identifier for the person. Matching on this rather
    -- than on email means a rename at the IdP does not orphan the account.
    provider_subject TEXT NOT NULL,
    linked_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at    TIMESTAMPTZ,
    UNIQUE (provider_id, provider_subject)
);
CREATE INDEX idx_identity_providers_subject ON identity_providers (plane, subject_id);

-- In-flight authorization codes. Holds the PKCE verifier and the nonce so the
-- callback can prove the response belongs to a request we actually made.
-- Single-use: consumed_at is what makes a replayed `state` fail.
CREATE TABLE oidc_auth_requests (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plane          TEXT NOT NULL CHECK (plane IN ('customer','admin')),
    provider_id    UUID NOT NULL REFERENCES identity_provider_configs(id) ON DELETE CASCADE,
    state_hash     TEXT NOT NULL UNIQUE,
    nonce          TEXT NOT NULL,
    code_verifier  TEXT NOT NULL,
    -- Validated against the CORS origin allowlist before use, so this cannot
    -- become an open redirect.
    redirect_after TEXT,
    expires_at     TIMESTAMPTZ NOT NULL,
    consumed_at    TIMESTAMPTZ,
    ip_address     INET,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS oidc_auth_requests;
DROP TABLE IF EXISTS identity_providers;
DROP TABLE IF EXISTS identity_provider_domains;
DROP TABLE IF EXISTS identity_provider_configs;
