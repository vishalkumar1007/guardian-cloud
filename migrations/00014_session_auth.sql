-- +goose Up
-- Make sessions actually usable as an authentication credential.
--
-- Until now the table had no token column at all — nothing has ever issued a
-- session, so these columns can go NOT NULL directly without a backfill.
--
-- Tokens are stored as a SHA-256 digest, never in the clear, mirroring the
-- enrollment_tokens pattern from 00004. The raw token lives only in the client's
-- httpOnly cookie.

ALTER TABLE sessions
    ADD COLUMN token_hash       TEXT,
    ADD COLUMN csrf_token_hash  TEXT,
    -- Idle-timeout tracking. Written at most once per minute to avoid making
    -- every authenticated request a write.
    ADD COLUMN last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN renewed_at       TIMESTAMPTZ,
    -- Set only once the MFA challenge succeeds; a session row is never created
    -- before that point, so this doubles as a record of how it was satisfied.
    ADD COLUMN mfa_satisfied_at TIMESTAMPTZ,
    ADD COLUMN auth_method      TEXT NOT NULL DEFAULT 'PASSWORD'
        CHECK (auth_method IN ('PASSWORD','SSO','RECOVERY_CODE')),
    ADD COLUMN revoked_reason   TEXT
        CHECK (revoked_reason IS NULL OR revoked_reason IN
              ('LOGOUT','IDLE_TIMEOUT','ABSOLUTE_EXPIRY','PASSWORD_CHANGE',
               'ADMIN_REVOKE','IP_DENIED','ACCOUNT_DISABLED','MFA_RESET'));

-- No session has ever been issued (there was no code path to issue one), so any
-- row here is test residue and cannot be given a valid token hash.
DELETE FROM sessions;
ALTER TABLE sessions ALTER COLUMN token_hash SET NOT NULL;

CREATE UNIQUE INDEX idx_sessions_token_hash ON sessions (token_hash);
CREATE INDEX idx_sessions_active ON sessions (user_id, expires_at)
    WHERE revoked_at IS NULL;

-- +goose Down
DROP INDEX IF EXISTS idx_sessions_active;
DROP INDEX IF EXISTS idx_sessions_token_hash;
ALTER TABLE sessions
    DROP COLUMN IF EXISTS revoked_reason,
    DROP COLUMN IF EXISTS auth_method,
    DROP COLUMN IF EXISTS mfa_satisfied_at,
    DROP COLUMN IF EXISTS renewed_at,
    DROP COLUMN IF EXISTS last_activity_at,
    DROP COLUMN IF EXISTS csrf_token_hash,
    DROP COLUMN IF EXISTS token_hash;
