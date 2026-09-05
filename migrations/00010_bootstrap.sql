-- +goose Up
-- First-run platform bootstrap singleton and active super-admin uniqueness constraint.

CREATE TABLE platform_bootstrap (
    id                UUID PRIMARY KEY DEFAULT '00000000-0000-4000-8000-000000000000',
    is_completed      BOOLEAN NOT NULL DEFAULT false,
    completed_at      TIMESTAMPTZ,
    super_admin_id    UUID REFERENCES users(id),
    setup_ip          INET,
    setup_user_agent  TEXT,
    CONSTRAINT platform_bootstrap_singleton CHECK (id = '00000000-0000-4000-8000-000000000000')
);

INSERT INTO platform_bootstrap (id, is_completed)
VALUES ('00000000-0000-4000-8000-000000000000', false)
ON CONFLICT (id) DO NOTHING;

-- Enforce that active SUPER_ADMIN role assignments are unique per user
CREATE UNIQUE INDEX idx_platform_admins_active_super_admin 
ON platform_admins (user_id) 
WHERE revoked_at IS NULL AND role = 'SUPER_ADMIN';

-- +goose Down
DROP INDEX IF EXISTS idx_platform_admins_active_super_admin;
DROP TABLE IF EXISTS platform_bootstrap;
