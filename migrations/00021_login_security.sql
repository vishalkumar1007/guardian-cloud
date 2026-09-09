-- +goose Up
-- Brute-force defence and network restriction.
--
-- Neither is specified in the design documents; both are driven by the knobs the
-- frontend's PlatformSettings shape already names (maxFailedLogins,
-- ipAllowlistEnabled, allowedIpRanges).

-- Append-only record of every authentication decision, successful or not. This
-- is operator-facing visibility (the Login Security page), distinct from the
-- lockout counters below which are the enforcement mechanism.
CREATE TABLE login_attempts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plane       TEXT NOT NULL CHECK (plane IN ('customer','admin')),
    -- Stored lowercase as attempted. Not a foreign key: a failed attempt against
    -- an address that does not exist is exactly what we need to see.
    email       CITEXT,
    subject_id  UUID,
    outcome     TEXT NOT NULL CHECK (outcome IN
                  ('SUCCESS','INVALID_CREDENTIALS','UNKNOWN_ACCOUNT','ACCOUNT_DISABLED',
                   'LOCKED','IP_DENIED','MFA_FAILED','MFA_REQUIRED','SSO_DENIED')),
    ip_address  INET,
    user_agent  TEXT,
    request_id  TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_login_attempts_time ON login_attempts (occurred_at DESC);
CREATE INDEX idx_login_attempts_email ON login_attempts (plane, email, occurred_at DESC);
CREATE INDEX idx_login_attempts_ip ON login_attempts (ip_address, occurred_at DESC);

-- Counters keyed independently by account and by source address, so neither
-- spreading attempts across accounts nor across addresses evades the limit.
CREATE TABLE account_lockouts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plane          TEXT NOT NULL CHECK (plane IN ('customer','admin')),
    scope          TEXT NOT NULL CHECK (scope IN ('ACCOUNT','IP')),
    -- Lowercased email for ACCOUNT scope, textual address for IP scope.
    subject_key    TEXT NOT NULL,
    failure_count  INTEGER NOT NULL DEFAULT 0,
    -- Doubles with each successive lockout, so repeat offenders back off
    -- progressively rather than retrying every N minutes forever.
    lockout_count  INTEGER NOT NULL DEFAULT 0,
    first_failure_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_failure_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    locked_until   TIMESTAMPTZ,
    UNIQUE (plane, scope, subject_key)
);
CREATE INDEX idx_account_lockouts_locked ON account_lockouts (locked_until)
    WHERE locked_until IS NOT NULL;

-- Network restriction. Evaluated before any credential is examined, so a denied
-- address never reaches password verification and no attempt row records the
-- email it was trying.
CREATE TABLE ip_allowlist_rules (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plane      TEXT NOT NULL DEFAULT 'admin' CHECK (plane IN ('customer','admin')),
    cidr       CIDR NOT NULL,
    label      TEXT NOT NULL,
    created_by UUID REFERENCES guardian_admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (plane, cidr)
);

-- +goose Down
DROP TABLE IF EXISTS ip_allowlist_rules;
DROP TABLE IF EXISTS account_lockouts;
DROP TABLE IF EXISTS login_attempts;
