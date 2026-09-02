-- +goose Up
-- Device domain Phase 1 cut (DBD Section 5): no transfers / trusted_faces yet.

CREATE TABLE agent_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform        TEXT NOT NULL CHECK (platform IN ('MACOS','WINDOWS','LINUX')),
    version         TEXT NOT NULL,
    signature       TEXT NOT NULL,
    release_notes   TEXT,
    min_supported   BOOLEAN NOT NULL DEFAULT false,
    released_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (platform, version)
);

CREATE TABLE devices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assigned_user_id    UUID REFERENCES users(id),
    ownership_type      TEXT NOT NULL DEFAULT 'PERSONAL'
                         CHECK (ownership_type IN ('PERSONAL','COMPANY_OWNED','BYOD')),
    platform            TEXT NOT NULL CHECK (platform IN ('MACOS','WINDOWS','LINUX')),
    platform_version    TEXT,
    hostname            TEXT,
    display_name        TEXT,
    public_key          TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'REGISTERED'
                         CHECK (status IN ('UNREGISTERED','ENROLLING','REGISTERED','ACTIVE',
                                            'OFFLINE','UPDATE_REQUIRED','REVOKED')),
    last_seen_at        TIMESTAMPTZ,
    registered_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_devices_tenant ON devices (tenant_id);
CREATE INDEX idx_devices_tenant_status ON devices (tenant_id, status);

CREATE TABLE device_installations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id           UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    agent_version_id    UUID NOT NULL REFERENCES agent_versions(id),
    installation_id     TEXT NOT NULL UNIQUE,
    installed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_heartbeat_at   TIMESTAMPTZ,
    status              TEXT NOT NULL DEFAULT 'ACTIVE'
                         CHECK (status IN ('ACTIVE','STOPPED','UNINSTALLED'))
);
CREATE INDEX idx_installations_device ON device_installations (device_id);

CREATE TABLE enrollment_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES users(id),
    token_hash      TEXT NOT NULL UNIQUE,
    scope           TEXT NOT NULL DEFAULT 'DEVICE_ENROLL',
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    used_by_device  UUID REFERENCES devices(id),
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_enrollment_tokens_tenant ON enrollment_tokens (tenant_id);

INSERT INTO agent_versions (platform, version, signature, release_notes, min_supported) VALUES
    ('MACOS',   '0.1.0', 'dev-unsigned', 'Phase 1 scaffold', true),
    ('WINDOWS', '0.1.0', 'dev-unsigned', 'Phase 1 scaffold', true),
    ('LINUX',   '0.1.0', 'dev-unsigned', 'Phase 1 scaffold', true);

-- +goose Down
DROP TABLE IF EXISTS enrollment_tokens;
DROP TABLE IF EXISTS device_installations;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS agent_versions;
