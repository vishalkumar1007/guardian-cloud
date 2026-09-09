-- +goose Up
-- The Guardian staff identity plane.
--
-- Deliberately NO foreign key to users. Guardian staff are a separate identity
-- domain, so that "platform administration can never be reached via a
-- customer-tenant-scoped authorization path" (SUPER-ADMIN-RBAC Section 1). The
-- isolation is structural: an admin session token is only ever looked up in
-- guardian_admin_sessions, so a customer credential has no representation here.
--
-- The column shapes intentionally mirror users / user_credentials / mfa_methods
-- / sessions, because one Go engine serves both planes parameterised by table
-- name (internal/auth.Plane).

CREATE TABLE guardian_admin_users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             CITEXT NOT NULL UNIQUE,
    email_verified_at TIMESTAMPTZ,
    display_name      TEXT,
    job_title         TEXT,
    status            TEXT NOT NULL DEFAULT 'ACTIVE'
                       CHECK (status IN ('ACTIVE','SUSPENDED','DISABLED','PENDING')),
    -- Per-account override; the global requireMfaAdmin policy is the floor.
    mfa_required      BOOLEAN NOT NULL DEFAULT true,
    last_login_at     TIMESTAMPTZ,
    created_by        UUID REFERENCES guardian_admin_users(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ
);
CREATE INDEX idx_guardian_admin_users_status ON guardian_admin_users (status)
    WHERE deleted_at IS NULL;

CREATE TABLE guardian_admin_credentials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id   UUID NOT NULL REFERENCES guardian_admin_users(id) ON DELETE CASCADE,
    credential_type TEXT NOT NULL CHECK (credential_type IN ('PASSWORD','PASSKEY')),
    secret_hash     TEXT,  -- argon2id PHC string; null for a passkey
    public_key      TEXT,  -- null for a password
    -- Set on invitation acceptance and admin-initiated resets.
    must_change     BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at    TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ
);
CREATE INDEX idx_guardian_admin_credentials_user ON guardian_admin_credentials (admin_user_id);

CREATE TABLE guardian_admin_mfa_methods (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES guardian_admin_users(id) ON DELETE CASCADE,
    -- WEBAUTHN is retained in the constraint so hardware keys (the long-term
    -- requirement in SUPER-ADMIN-RBAC Section 1) land without a migration.
    method_type   TEXT NOT NULL CHECK (method_type IN ('TOTP','EMAIL','WEBAUTHN')),
    -- AES-GCM sealed blob under GUARDIAN_SECRET_ENCRYPTION_KEY, never a raw
    -- secret: a database dump alone does not yield a usable authenticator.
    secret_ref    TEXT NOT NULL,
    label         TEXT,
    is_primary    BOOLEAN NOT NULL DEFAULT false,
    verified_at   TIMESTAMPTZ,
    last_used_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at    TIMESTAMPTZ
);
CREATE INDEX idx_guardian_admin_mfa_user ON guardian_admin_mfa_methods (admin_user_id);

CREATE TABLE guardian_admin_sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id    UUID NOT NULL REFERENCES guardian_admin_users(id) ON DELETE CASCADE,
    token_hash       TEXT NOT NULL UNIQUE,
    csrf_token_hash  TEXT,
    issued_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at       TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    renewed_at       TIMESTAMPTZ,
    mfa_satisfied_at TIMESTAMPTZ,
    auth_method      TEXT NOT NULL DEFAULT 'PASSWORD'
                      CHECK (auth_method IN ('PASSWORD','SSO','RECOVERY_CODE')),
    revoked_at       TIMESTAMPTZ,
    revoked_reason   TEXT
                      CHECK (revoked_reason IS NULL OR revoked_reason IN
                            ('LOGOUT','IDLE_TIMEOUT','ABSOLUTE_EXPIRY','PASSWORD_CHANGE',
                             'ADMIN_REVOKE','IP_DENIED','ACCOUNT_DISABLED','MFA_RESET')),
    ip_address       INET,
    user_agent       TEXT
);
CREATE INDEX idx_guardian_admin_sessions_active ON guardian_admin_sessions (admin_user_id, expires_at)
    WHERE revoked_at IS NULL;

-- Bring the customer MFA table to the same shape so one engine drives both.
ALTER TABLE mfa_methods
    ADD COLUMN label        TEXT,
    ADD COLUMN is_primary   BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN last_used_at TIMESTAMPTZ;

-- +goose Down
ALTER TABLE mfa_methods
    DROP COLUMN IF EXISTS last_used_at,
    DROP COLUMN IF EXISTS is_primary,
    DROP COLUMN IF EXISTS label;
DROP TABLE IF EXISTS guardian_admin_sessions;
DROP TABLE IF EXISTS guardian_admin_mfa_methods;
DROP TABLE IF EXISTS guardian_admin_credentials;
DROP TABLE IF EXISTS guardian_admin_users;
