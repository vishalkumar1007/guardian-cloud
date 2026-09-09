-- +goose Up
-- Social sign-in providers, configured by a Guardian super admin.
--
-- 00022 assumed every provider speaks OIDC. GitHub does not: it is plain OAuth2
-- with its own user API and no discovery document, so `vendor` gains GITHUB and
-- the endpoints become explicit columns rather than something derived from an
-- issuer. Well-known vendors get their endpoints filled in by the server, so an
-- operator only ever supplies a client id and secret.

ALTER TABLE identity_provider_configs DROP CONSTRAINT IF EXISTS identity_provider_configs_vendor_check;
ALTER TABLE identity_provider_configs ADD CONSTRAINT identity_provider_configs_vendor_check
    CHECK (vendor IN ('GENERIC','GOOGLE','GITHUB','OKTA','AZURE_AD'));

-- Issuer is only meaningful for OIDC discovery; GitHub has none.
ALTER TABLE identity_provider_configs ALTER COLUMN issuer DROP NOT NULL;

ALTER TABLE identity_provider_configs
    -- Resolved from the vendor for known providers, or from OIDC discovery for
    -- GENERIC. Cached here so a login does not depend on a discovery round trip.
    ADD COLUMN authorize_url TEXT,
    ADD COLUMN token_url     TEXT,
    ADD COLUMN userinfo_url  TEXT,
    -- Shown on the button, e.g. "Continue with Google".
    ADD COLUMN button_label  TEXT,
    -- Ordering on the login page, lowest first.
    ADD COLUMN sort_order    INTEGER NOT NULL DEFAULT 0;

-- One provider per vendor per plane. Two "Continue with Google" buttons on one
-- login page is always a misconfiguration.
CREATE UNIQUE INDEX idx_identity_provider_vendor_plane
    ON identity_provider_configs (plane, vendor)
    WHERE vendor <> 'GENERIC';

CREATE INDEX idx_identity_provider_enabled
    ON identity_provider_configs (plane, enabled, sort_order);

-- +goose Down
DROP INDEX IF EXISTS idx_identity_provider_enabled;
DROP INDEX IF EXISTS idx_identity_provider_vendor_plane;
ALTER TABLE identity_provider_configs
    DROP COLUMN IF EXISTS sort_order,
    DROP COLUMN IF EXISTS button_label,
    DROP COLUMN IF EXISTS userinfo_url,
    DROP COLUMN IF EXISTS token_url,
    DROP COLUMN IF EXISTS authorize_url;
ALTER TABLE identity_provider_configs DROP CONSTRAINT IF EXISTS identity_provider_configs_vendor_check;
ALTER TABLE identity_provider_configs ADD CONSTRAINT identity_provider_configs_vendor_check
    CHECK (vendor IN ('GENERIC','GOOGLE','OKTA','AZURE_AD'));
