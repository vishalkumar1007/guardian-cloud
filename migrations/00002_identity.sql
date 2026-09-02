-- +goose Up
-- Identity domain (DBD Section 3). sessions.active_tenant_id FK added in 00003.

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               CITEXT NOT NULL UNIQUE,
    email_verified_at   TIMESTAMPTZ,
    display_name        TEXT,
    status              TEXT NOT NULL DEFAULT 'ACTIVE'
                         CHECK (status IN ('ACTIVE','DISABLED')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

CREATE TABLE user_credentials (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_type     TEXT NOT NULL CHECK (credential_type IN ('PASSWORD','PASSKEY')),
    secret_hash         TEXT,
    public_key          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at        TIMESTAMPTZ,
    revoked_at          TIMESTAMPTZ
);
CREATE INDEX idx_user_credentials_user ON user_credentials (user_id);

CREATE TABLE mfa_methods (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method_type         TEXT NOT NULL CHECK (method_type IN ('TOTP','SMS','EMAIL','WEBAUTHN')),
    secret_ref          TEXT NOT NULL,
    verified_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at          TIMESTAMPTZ
);
CREATE INDEX idx_mfa_methods_user ON mfa_methods (user_id);

CREATE TABLE sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    active_tenant_id    UUID,
    issued_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,
    ip_address          INET,
    user_agent          TEXT
);
CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_user_expires ON sessions (user_id, expires_at);

-- +goose Down
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS mfa_methods;
DROP TABLE IF EXISTS user_credentials;
DROP TABLE IF EXISTS users;
