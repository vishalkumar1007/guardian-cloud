-- +goose Up
-- Security events + alerts (DBD Section 6 Phase 1). No policy_id / incident FKs yet.

CREATE TABLE security_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id       UUID REFERENCES devices(id),
    user_id         UUID REFERENCES users(id),
    event_type      TEXT NOT NULL,
    severity        TEXT NOT NULL CHECK (severity IN ('INFO','LOW','MEDIUM','HIGH','CRITICAL')),
    occurred_at     TIMESTAMPTZ NOT NULL,
    received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    source          TEXT NOT NULL,
    policy_id       UUID,
    action          TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_events_tenant_time ON security_events (tenant_id, occurred_at DESC);
CREATE INDEX idx_events_device_time ON security_events (device_id, occurred_at DESC);

CREATE TABLE alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,
    severity        TEXT NOT NULL CHECK (severity IN ('INFO','LOW','MEDIUM','HIGH','CRITICAL')),
    title           TEXT NOT NULL,
    description     TEXT,
    device_id       UUID REFERENCES devices(id),
    user_id         UUID REFERENCES users(id),
    incident_id     UUID,
    status          TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ
);
CREATE INDEX idx_alerts_tenant_status ON alerts (tenant_id, status);

-- +goose Down
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS security_events;
