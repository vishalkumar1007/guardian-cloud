-- +goose Up
-- Audit + notifications (DBD Section 9).

CREATE TABLE notification_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id       UUID REFERENCES devices(id),
    trigger_type    TEXT NOT NULL,
    threshold       JSONB NOT NULL DEFAULT '{}'::jsonb,
    channels        TEXT[] NOT NULL DEFAULT ARRAY['IN_APP'],
    recipients      JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_rules_tenant ON notification_rules (tenant_id);

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),
    rule_id         UUID REFERENCES notification_rules(id),
    event_id        UUID REFERENCES security_events(id),
    channel         TEXT NOT NULL CHECK (channel IN ('IN_APP','EMAIL','PUSH','WEBHOOK')),
    payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
    status          TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at         TIMESTAMPTZ
);
CREATE INDEX idx_notifications_tenant ON notifications (tenant_id, created_at DESC);

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES tenants(id),
    actor_type      TEXT NOT NULL CHECK (actor_type IN ('USER','DEVICE','SYSTEM','SUPER_ADMIN')),
    actor_id        UUID,
    action          TEXT NOT NULL,
    target_type     TEXT,
    target_id       UUID,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_tenant_time ON audit_logs (tenant_id, occurred_at DESC);

-- +goose Down
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS notification_rules;
