-- +goose Up
-- Tenancy / RBAC / platform admins (DBD Section 4). Phase 1 seeds PERSONAL_OWNER.

CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            TEXT NOT NULL CHECK (type IN ('PERSONAL','ORGANIZATION')),
    name            TEXT NOT NULL,
    owner_user_id   UUID NOT NULL REFERENCES users(id),
    status          TEXT NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE','SUSPENDED','CLOSED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

ALTER TABLE sessions
    ADD CONSTRAINT sessions_active_tenant_id_fkey
    FOREIGN KEY (active_tenant_id) REFERENCES tenants(id);

CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES tenants(id),
    name            TEXT NOT NULL,
    is_system_role  BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_roles_system_name ON roles (name) WHERE tenant_id IS NULL;

CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource        TEXT NOT NULL,
    action          TEXT NOT NULL,
    UNIQUE (resource, action)
);

CREATE TABLE role_permissions (
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE memberships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id),
    status          TEXT NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE','SUSPENDED','REMOVED')),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    removed_at      TIMESTAMPTZ,
    UNIQUE (user_id, tenant_id)
);
CREATE INDEX idx_memberships_tenant ON memberships (tenant_id);

CREATE TABLE platform_admins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    role            TEXT NOT NULL CHECK (role IN
                     ('SUPER_ADMIN','OPERATIONS_ADMIN','SUPPORT_ADMIN',
                      'BILLING_ADMIN','SECURITY_ADMIN')),
    granted_by      UUID REFERENCES users(id),
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at      TIMESTAMPTZ
);

-- Phase 1 permission catalog for Personal Owner
INSERT INTO permissions (resource, action) VALUES
    ('device', 'read'),
    ('device', 'write'),
    ('device', 'enroll'),
    ('event', 'read'),
    ('alert', 'read'),
    ('alert', 'write'),
    ('billing', 'read'),
    ('billing', 'write'),
    ('tenant', 'read'),
    ('tenant', 'write'),
    ('audit', 'read');

INSERT INTO roles (id, tenant_id, name, is_system_role)
VALUES ('00000000-0000-4000-8000-000000000001', NULL, 'PERSONAL_OWNER', true);

INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-4000-8000-000000000001', id FROM permissions;

-- +goose Down
DROP TABLE IF EXISTS platform_admins;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_active_tenant_id_fkey;
DROP TABLE IF EXISTS tenants;
