-- +goose Up
-- Quarterly privilege attestation (the SOC2/ISO access review workflow).
--
-- A review snapshots who held which grant at the moment it opened, so the
-- reviewer certifies a fixed list rather than a moving target. Completing it
-- applies every REVOKE decision in a single transaction.

CREATE TABLE access_reviews (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT NOT NULL,
    description  TEXT,
    status       TEXT NOT NULL DEFAULT 'IN_PROGRESS'
                  CHECK (status IN ('IN_PROGRESS','COMPLETED','CANCELLED')),
    due_at       TIMESTAMPTZ,
    created_by   UUID REFERENCES guardian_admin_users(id) ON DELETE SET NULL,
    completed_by UUID REFERENCES guardian_admin_users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE access_review_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id     UUID NOT NULL REFERENCES access_reviews(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES guardian_admin_users(id) ON DELETE CASCADE,
    grant_type    TEXT NOT NULL CHECK (grant_type IN ('ROLE','TEAM')),
    -- The grant row this item certifies. No foreign key: the grant may be
    -- revoked while the review is open, and the record of what was reviewed must
    -- survive that.
    grant_id      UUID NOT NULL,
    -- Denormalised for the reviewer's benefit and so a completed review still
    -- reads correctly after the underlying role is renamed or deleted.
    subject_email TEXT NOT NULL,
    grant_label   TEXT NOT NULL,
    decision      TEXT NOT NULL DEFAULT 'PENDING'
                   CHECK (decision IN ('PENDING','KEEP','REVOKE')),
    note          TEXT,
    decided_by    UUID REFERENCES guardian_admin_users(id) ON DELETE SET NULL,
    decided_at    TIMESTAMPTZ,
    applied_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_access_review_items_review ON access_review_items (review_id, decision);

-- +goose Down
DROP TABLE IF EXISTS access_review_items;
DROP TABLE IF EXISTS access_reviews;
