-- +goose Up
-- Global authentication and security policy.
--
-- Deliberately separate from admin_settings (00011), which stores per-user UI
-- preferences keyed by user_id. These keys govern behaviour for everyone and are
-- read on the login path, so they are a small flat key/value table.
--
-- IP allowlist ranges are NOT stored here — they get their own table in 00021 so
-- each rule can carry a label, a plane and an audit trail of its own.

CREATE TABLE platform_settings (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- No FK: the updater is a guardian_admin_users id, a table that does not
    -- exist until 00017 and is deliberately unrelated to users.
    updated_by UUID
);

-- Seeded values match internal/settings.Defaults. The frontend's existing mock
-- PlatformSettings shape supplied these numbers (30 minute idle, 5 failed logins).
INSERT INTO platform_settings (key, value) VALUES
    ('sessionTimeoutMinutes',  '30'::jsonb),
    ('sessionAbsoluteDays',    '30'::jsonb),
    ('sessionRenewWithinDays', '7'::jsonb),
    ('maxFailedLogins',        '5'::jsonb),
    ('lockoutWindowMinutes',   '10'::jsonb),
    ('passwordMinLength',      '10'::jsonb),
    -- Starts false so the first staff account can log in and enrol; the settings
    -- API refuses to turn it on until the caller has a verified MFA method.
    ('requireMfaAdmin',        'false'::jsonb),
    ('requireMfaCustomer',     'false'::jsonb),
    ('ipAllowlistEnabled',     'false'::jsonb),
    ('ssoJitProvisioning',     'false'::jsonb);

-- +goose Down
DROP TABLE IF EXISTS platform_settings;
