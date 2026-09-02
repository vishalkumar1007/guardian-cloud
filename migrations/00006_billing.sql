-- +goose Up
-- Billing (DBD Section 9) + PERSONAL / BASIC seed for Phase 1.

CREATE TABLE plans (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    tenant_type         TEXT NOT NULL CHECK (tenant_type IN ('PERSONAL','ORGANIZATION')),
    tier                TEXT NOT NULL CHECK (tier IN ('BASIC','ADVANCED','ENTERPRISE_BASIC','ENTERPRISE_FULL')),
    price_cents         INTEGER NOT NULL,
    currency            TEXT NOT NULL DEFAULT 'USD',
    billing_interval    TEXT NOT NULL CHECK (billing_interval IN ('MONTHLY','ANNUAL')),
    device_limit        INTEGER,
    features            JSONB NOT NULL DEFAULT '{}'::jsonb,
    active              BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id                 UUID NOT NULL REFERENCES plans(id),
    status                  TEXT NOT NULL DEFAULT 'ACTIVE'
                             CHECK (status IN ('TRIALING','ACTIVE','PAST_DUE','CANCELED')),
    seat_or_device_limit    INTEGER,
    current_period_start    TIMESTAMPTZ NOT NULL,
    current_period_end      TIMESTAMPTZ NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    canceled_at             TIMESTAMPTZ
);
CREATE UNIQUE INDEX idx_one_active_subscription_per_tenant
    ON subscriptions (tenant_id) WHERE status IN ('TRIALING','ACTIVE','PAST_DUE');

CREATE TABLE subscription_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id     UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    item_type           TEXT NOT NULL,
    quantity            INTEGER NOT NULL DEFAULT 1,
    unit_price_cents    INTEGER NOT NULL
);

CREATE TABLE invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id     UUID NOT NULL REFERENCES subscriptions(id),
    amount_cents        INTEGER NOT NULL,
    currency            TEXT NOT NULL DEFAULT 'USD',
    status              TEXT NOT NULL DEFAULT 'OPEN'
                         CHECK (status IN ('OPEN','PAID','VOID','UNCOLLECTIBLE')),
    issued_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_at              TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ
);
CREATE INDEX idx_invoices_tenant ON invoices (tenant_id);

CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount_cents    INTEGER NOT NULL,
    method          TEXT NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('PENDING','SUCCEEDED','FAILED','REFUNDED')),
    processor_ref   TEXT,
    processed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO plans (id, name, tenant_type, tier, price_cents, currency, billing_interval, device_limit, features, active)
VALUES (
    '00000000-0000-4000-8000-000000000010',
    'Personal Basic',
    'PERSONAL',
    'BASIC',
    900,
    'USD',
    'MONTHLY',
    3,
    '{"active_protection": false, "priority_notifications": false}'::jsonb,
    true
);

-- +goose Down
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS subscription_items;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS plans;
