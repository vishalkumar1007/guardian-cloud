-- +goose Up
-- Staff MFA becomes opt-in by default. Global requireMfaAdmin and the per-account
-- mfa_required flag remain available to re-enforce when an operator chooses.
ALTER TABLE guardian_admin_users
    ALTER COLUMN mfa_required SET DEFAULT false;

UPDATE guardian_admin_users
SET mfa_required = false
WHERE mfa_required = true;

-- +goose Down
ALTER TABLE guardian_admin_users
    ALTER COLUMN mfa_required SET DEFAULT true;
