-- +goose Up
-- Guardian internal IAM: roles, permissions, teams and staff role grants.
--
-- Roles hold wildcard GRANT PATTERNS rather than fixed permission ids, matching
-- how SUPER-ADMIN-RBAC Section 2 describes them ('*', 'platform.*', '*.read').
-- Patterns are expanded against guardian_permissions at request time
-- (internal/authz), so adding a permission automatically reaches every role
-- whose pattern already covers it, with no data migration.

CREATE TABLE guardian_roles (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key       TEXT NOT NULL UNIQUE,
    name           TEXT NOT NULL,
    description    TEXT,
    -- System roles are the six documented in SUPER-ADMIN-RBAC and cannot be
    -- edited or deleted through the API; custom roles can.
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE guardian_permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         TEXT NOT NULL UNIQUE,  -- dotted, e.g. 'iam.users.manage'
    resource    TEXT NOT NULL,
    action      TEXT NOT NULL,
    category    TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE guardian_role_permissions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id       UUID NOT NULL REFERENCES guardian_roles(id) ON DELETE CASCADE,
    grant_pattern TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (role_id, grant_pattern)
);

CREATE TABLE guardian_admin_roles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES guardian_admin_users(id) ON DELETE CASCADE,
    role_id       UUID NOT NULL REFERENCES guardian_roles(id) ON DELETE CASCADE,
    granted_by    UUID REFERENCES guardian_admin_users(id),
    granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Time-boxed grants support temporary elevation without a manual cleanup.
    expires_at    TIMESTAMPTZ,
    revoked_at    TIMESTAMPTZ
);
-- One live grant per (staff, role); revoked grants stay for the audit trail.
CREATE UNIQUE INDEX idx_guardian_admin_roles_active
    ON guardian_admin_roles (admin_user_id, role_id) WHERE revoked_at IS NULL;

CREATE TABLE guardian_teams (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug               TEXT NOT NULL UNIQUE,
    name               TEXT NOT NULL,
    description        TEXT,
    slack_channel      TEXT,
    lead_admin_user_id UUID REFERENCES guardian_admin_users(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE guardian_team_members (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id       UUID NOT NULL REFERENCES guardian_teams(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES guardian_admin_users(id) ON DELETE CASCADE,
    team_role     TEXT NOT NULL DEFAULT 'MEMBER' CHECK (team_role IN ('LEAD','MEMBER')),
    joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (team_id, admin_user_id)
);

-- Team-derived roles: effective permissions are the union of direct grants and
-- the roles attached to every team the person belongs to.
CREATE TABLE guardian_team_roles (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id    UUID NOT NULL REFERENCES guardian_teams(id) ON DELETE CASCADE,
    role_id    UUID NOT NULL REFERENCES guardian_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (team_id, role_id)
);

-- The six system roles from SUPER-ADMIN-RBAC Section 2.
INSERT INTO guardian_roles (role_key, name, description, is_system_role) VALUES
    ('SUPER_ADMIN',     'Guardian Super Admin',     'Platform root. Full access across all tenants, IAM and settings.', true),
    ('OPERATIONS_ADMIN','Guardian Operations Admin','Cluster operations, platform health and agent releases.',          true),
    ('SECURITY_ADMIN',  'Guardian Security Admin',  'SOC threat hunting, incident triage and security telemetry.',      true),
    ('SUPPORT_ADMIN',   'Guardian Support Admin',   'Customer success. Read-only visibility into tenants and devices.', true),
    ('BILLING_ADMIN',   'Guardian Billing Admin',   'Revenue, plans and subscriptions.',                                true),
    ('READ_ONLY_ADMIN', 'Guardian Read Only Admin', 'Executive and audit inspection. Strictly non-destructive.',        true);

-- Fine-grained permissions. The 15 keys in SUPER-ADMIN-RBAC Section 3, plus the
-- audit / billing / platform keys its own Section 2 role matrix references
-- ('audit.read', 'subscriptions.*', 'plans.*', 'platform.*') but never defines.
INSERT INTO guardian_permissions (key, resource, action, category, description) VALUES
    ('organizations.read',      'organizations','read',   'Tenancy',     'View tenant profiles, device counts and compliance scores.'),
    ('organizations.create',    'organizations','create', 'Tenancy',     'Provision new enterprise tenants.'),
    ('organizations.update',    'organizations','update', 'Tenancy',     'Modify tenant domain settings, seat allowances and tiers.'),
    ('organizations.suspend',   'organizations','suspend','Tenancy',     'Freeze tenant authentication with required audit justification.'),
    ('users.read',              'users',        'read',   'Identity',    'View individual user profiles and enrollment state.'),
    ('users.update',            'users',        'update', 'Identity',    'Update plan tiers and profile parameters.'),
    ('users.suspend',           'users',        'suspend','Identity',    'Revoke user session keys.'),
    ('devices.read',            'devices',      'read',   'Devices',     'Inspect platform fleet hardware, OS versions and eBPF statuses.'),
    ('devices.manage',          'devices',      'manage', 'Devices',     'Dispatch remote remediation commands (Lock, Wipe, Isolate).'),
    ('security.read',           'security',     'read',   'Security',    'View raw telemetry streams and sensor events.'),
    ('incidents.manage',        'incidents',    'manage', 'Security',    'Triage, escalate, assign and resolve SOC incident dossiers.'),
    ('plans.read',              'plans',        'read',   'Billing',     'View the commercial plan catalogue and feature limits.'),
    ('plans.manage',            'plans',        'manage', 'Billing',     'Create and modify commercial plans and their pricing.'),
    ('subscriptions.read',      'subscriptions','read',   'Billing',     'View subscription ledger, MRR and renewal state.'),
    ('subscriptions.manage',    'subscriptions','manage', 'Billing',     'Change tenant subscriptions and billing state.'),
    ('audit.read',              'audit',        'read',   'Audit',       'Read platform audit logs and sensitive data access records.'),
    ('iam.users.manage',        'iam.users',    'manage', 'Guardian IAM','Provision, suspend and reset MFA for Guardian staff.'),
    ('iam.roles.manage',        'iam.roles',    'manage', 'Guardian IAM','Modify system role bindings.'),
    ('iam.permissions.manage',  'iam.permissions','manage','Guardian IAM','Adjust granular permission grants.'),
    ('platform.settings.manage','platform.settings','manage','Platform', 'Update global platform parameters, SSO, S3 buckets and retention rules.'),
    ('platform.health.read',    'platform.health','read', 'Platform',    'View microservice health, uptime and latency.'),
    ('platform.features.manage','platform.features','manage','Platform', 'Toggle runtime feature flags and maintenance windows.'),
    ('platform.agents.manage',  'platform.agents','manage','Platform',   'Publish agent releases and set minimum supported versions.');

-- Role grants, verbatim from the SUPER-ADMIN-RBAC Section 2 permission scopes.
INSERT INTO guardian_role_permissions (role_id, grant_pattern)
SELECT r.id, g.pattern
FROM guardian_roles r
JOIN (VALUES
    ('SUPER_ADMIN',      '*'),
    ('OPERATIONS_ADMIN', 'platform.*'),
    ('OPERATIONS_ADMIN', 'devices.read'),
    ('OPERATIONS_ADMIN', 'organizations.read'),
    ('OPERATIONS_ADMIN', 'audit.read'),
    ('SECURITY_ADMIN',   'security.*'),
    ('SECURITY_ADMIN',   'incidents.*'),
    ('SECURITY_ADMIN',   'devices.read'),
    ('SECURITY_ADMIN',   'organizations.read'),
    ('SECURITY_ADMIN',   'audit.read'),
    ('SUPPORT_ADMIN',    'organizations.read'),
    ('SUPPORT_ADMIN',    'users.read'),
    ('SUPPORT_ADMIN',    'devices.read'),
    ('SUPPORT_ADMIN',    'security.read'),
    ('BILLING_ADMIN',    'subscriptions.*'),
    ('BILLING_ADMIN',    'plans.*'),
    ('BILLING_ADMIN',    'organizations.read'),
    ('READ_ONLY_ADMIN',  '*.read')
) AS g(role_key, pattern) ON g.role_key = r.role_key;

-- The seeded staff account. It has no credential yet: `guardian-server
-- bootstrap-admin` sets the first password, so no default password ever ships.
INSERT INTO guardian_admin_users (id, email, email_verified_at, display_name, job_title, status, mfa_required)
VALUES (
    '00000000-0000-4000-8000-0000000000db',
    'superadmin@guardian.local',
    now(),
    'Guardian Super Admin',
    'Platform Root',
    'ACTIVE',
    true
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO guardian_admin_roles (admin_user_id, role_id)
SELECT '00000000-0000-4000-8000-0000000000db', id
FROM guardian_roles WHERE role_key = 'SUPER_ADMIN';

-- admin_settings stores per-user UI preferences keyed by whichever identity is
-- signed in. Once the admin plane owns the portal those ids come from
-- guardian_admin_users, so the users(id) foreign key has to go.
ALTER TABLE admin_settings DROP CONSTRAINT IF EXISTS admin_settings_user_id_fkey;

-- Carry the seeded superadmin's saved theme and navigation preferences over to
-- the new admin identity, so nothing is lost at the cutover.
INSERT INTO admin_settings (user_id, scope, category, data, updated_at)
SELECT '00000000-0000-4000-8000-0000000000db'::uuid, scope, category, data, updated_at
FROM admin_settings
WHERE user_id = '00000000-0000-4000-8000-0000000000bb'
ON CONFLICT (user_id, scope, category) DO NOTHING;

-- +goose Down
DELETE FROM admin_settings WHERE user_id = '00000000-0000-4000-8000-0000000000db';
ALTER TABLE admin_settings
    ADD CONSTRAINT admin_settings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
DROP TABLE IF EXISTS guardian_team_roles;
DROP TABLE IF EXISTS guardian_team_members;
DROP TABLE IF EXISTS guardian_teams;
DROP TABLE IF EXISTS guardian_admin_roles;
DROP TABLE IF EXISTS guardian_role_permissions;
DROP TABLE IF EXISTS guardian_permissions;
DROP TABLE IF EXISTS guardian_roles;
