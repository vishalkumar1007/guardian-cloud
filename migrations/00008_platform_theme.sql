-- +goose Up
-- Platform appearance theme (singleton) + local SUPER_ADMIN seed for theme PUT.

CREATE TABLE platform_theme (
    id                UUID PRIMARY KEY DEFAULT '00000000-0000-4000-8000-0000000000aa',
    ink               TEXT NOT NULL DEFAULT '#0b1220',
    ink_soft          TEXT NOT NULL DEFAULT '#3d4a5c',
    mist              TEXT NOT NULL DEFAULT '#e8eef4',
    mist_deep         TEXT NOT NULL DEFAULT '#d5dee8',
    signal            TEXT NOT NULL DEFAULT '#0f766e',
    signal_soft       TEXT NOT NULL DEFAULT '#ccfbf1',
    alert             TEXT NOT NULL DEFAULT '#c2410c',
    atmosphere_mode   TEXT NOT NULL DEFAULT 'mist',
    version           BIGINT NOT NULL DEFAULT 1,
    updated_by        UUID REFERENCES users(id),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT platform_theme_singleton CHECK (id = '00000000-0000-4000-8000-0000000000aa')
);

INSERT INTO platform_theme (id) VALUES ('00000000-0000-4000-8000-0000000000aa');

-- Seed platform super admin for local theme writes (F1.1 will replace gate).
INSERT INTO users (id, email, email_verified_at, display_name, status)
VALUES (
    '00000000-0000-4000-8000-0000000000bb',
    'superadmin@guardian.local',
    now(),
    'Guardian Super Admin',
    'ACTIVE'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO platform_admins (id, user_id, role, granted_at)
VALUES (
    '00000000-0000-4000-8000-0000000000cc',
    '00000000-0000-4000-8000-0000000000bb',
    'SUPER_ADMIN',
    now()
)
ON CONFLICT (id) DO NOTHING;

-- +goose Down
DELETE FROM platform_admins WHERE id = '00000000-0000-4000-8000-0000000000cc';
DELETE FROM users WHERE id = '00000000-0000-4000-8000-0000000000bb';
DROP TABLE IF EXISTS platform_theme;
