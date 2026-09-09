-- +goose Up
-- Teach audit_logs about the Guardian staff identity plane.
--
-- Guardian staff are a separate identity domain from customer users, so an
-- actor_id is only meaningful alongside the plane it belongs to. actor_id has no
-- foreign key (verified against 00007) — that is precisely what lets ids from
-- either plane be recorded here.

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_type_check;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_actor_type_check
    CHECK (actor_type IN ('USER','DEVICE','SYSTEM','SUPER_ADMIN','GUARDIAN_ADMIN'));

ALTER TABLE audit_logs
    ADD COLUMN actor_plane TEXT NOT NULL DEFAULT 'system'
        CHECK (actor_plane IN ('customer','admin','system')),
    -- Forensic context the spec asks for on every entry (LLD Section 28).
    ADD COLUMN ip_address  INET,
    ADD COLUMN user_agent  TEXT,
    ADD COLUMN request_id  TEXT;

-- Not every audit target is a UUID: settings are keyed by name and SSO providers
-- by slug. Widening avoids a parallel "target_key" column.
ALTER TABLE audit_logs ALTER COLUMN target_id TYPE TEXT USING target_id::text;

CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_plane, actor_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs (action, occurred_at DESC);

-- +goose Down
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_actor;
ALTER TABLE audit_logs ALTER COLUMN target_id TYPE UUID USING target_id::uuid;
ALTER TABLE audit_logs
    DROP COLUMN IF EXISTS request_id,
    DROP COLUMN IF EXISTS user_agent,
    DROP COLUMN IF EXISTS ip_address,
    DROP COLUMN IF EXISTS actor_plane;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_type_check;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_actor_type_check
    CHECK (actor_type IN ('USER','DEVICE','SYSTEM','SUPER_ADMIN'));
