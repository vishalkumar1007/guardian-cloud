-- +goose Up
-- Short-lived, single-use tokens shared by both identity planes.
--
-- Each row carries a `plane` discriminator instead of a foreign key, because the
-- subject may live in either users or guardian_admin_users and Postgres has no
-- polymorphic reference. Every lookup MUST filter on plane as well as the token
-- digest; internal/authtest.RequirePlaneFilter enforces that statically.
--
-- All four tables follow the same contract: store only SHA-256(token), expire,
-- and mark consumed_at so a replay is distinguishable from a valid first use.

CREATE TABLE email_verification_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plane        TEXT NOT NULL CHECK (plane IN ('customer','admin')),
    subject_id   UUID NOT NULL,
    token_hash   TEXT NOT NULL UNIQUE,
    expires_at   TIMESTAMPTZ NOT NULL,
    consumed_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_verification_subject ON email_verification_tokens (plane, subject_id);

CREATE TABLE password_reset_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plane        TEXT NOT NULL CHECK (plane IN ('customer','admin')),
    subject_id   UUID NOT NULL,
    token_hash   TEXT NOT NULL UNIQUE,
    -- One hour, shorter than email verification: this is the higher-risk action.
    expires_at   TIMESTAMPTZ NOT NULL,
    consumed_at  TIMESTAMPTZ,
    requested_ip INET,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_password_reset_subject ON password_reset_tokens (plane, subject_id);

-- The half-authenticated state between a correct password and a satisfied MFA
-- challenge.
--
-- Deliberately NOT a sessions row with an "mfa_pending" flag: a flagged session
-- is one forgotten WHERE clause away from being a real session, and every future
-- query against sessions would have to remember the flag. A separate table
-- behind a separate cookie cannot be mistaken for authentication by any code
-- path. The session row is created only once MFA succeeds.
CREATE TABLE mfa_challenges (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plane         TEXT NOT NULL CHECK (plane IN ('customer','admin')),
    subject_id    UUID NOT NULL,
    token_hash    TEXT NOT NULL UNIQUE,
    purpose       TEXT NOT NULL DEFAULT 'LOGIN'
                   CHECK (purpose IN ('LOGIN','ENROLLMENT','STEP_UP')),
    -- Sealed email OTP for EMAIL challenges; null when the code is derived from
    -- an enrolled TOTP secret.
    email_code_ref TEXT,
    attempts      INTEGER NOT NULL DEFAULT 0,
    expires_at    TIMESTAMPTZ NOT NULL,
    consumed_at   TIMESTAMPTZ,
    ip_address    INET,
    user_agent    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mfa_challenges_subject ON mfa_challenges (plane, subject_id);

-- Single-use fallbacks issued at enrolment and shown to the user exactly once.
-- Codes carry 80 bits of entropy, which is well beyond offline brute force, so
-- SHA-256 is sufficient and lets verification be a single indexed lookup rather
-- than a scan that hashes every unused code.
CREATE TABLE mfa_recovery_codes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plane      TEXT NOT NULL CHECK (plane IN ('customer','admin')),
    subject_id UUID NOT NULL,
    code_hash  TEXT NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mfa_recovery_codes_subject ON mfa_recovery_codes (plane, subject_id)
    WHERE used_at IS NULL;

-- +goose Down
DROP TABLE IF EXISTS mfa_recovery_codes;
DROP TABLE IF EXISTS mfa_challenges;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS email_verification_tokens;
