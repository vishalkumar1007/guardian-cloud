-- +goose Up
-- Staff invitations. There is no admin signup endpoint: a Guardian staff account
-- can only come into existence by accepting one of these.
--
-- Token handling follows the enrollment_tokens pattern from 00004: the raw token
-- goes in the invitation email and only its SHA-256 digest is stored, so the
-- table is useless to anyone who reads it.

CREATE TABLE guardian_admin_invitations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         CITEXT NOT NULL,
    token_hash    TEXT NOT NULL UNIQUE,
    display_name  TEXT,
    job_title     TEXT,
    message       TEXT,
    invited_by    UUID REFERENCES guardian_admin_users(id) ON DELETE SET NULL,
    status        TEXT NOT NULL DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING','ACCEPTED','EXPIRED','REVOKED')),
    expires_at    TIMESTAMPTZ NOT NULL,
    accepted_at   TIMESTAMPTZ,
    accepted_user UUID REFERENCES guardian_admin_users(id) ON DELETE SET NULL,
    revoked_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- At most one live invitation per address; superseded ones keep their history.
CREATE UNIQUE INDEX idx_guardian_admin_invitations_pending
    ON guardian_admin_invitations (email) WHERE status = 'PENDING';

-- Roles and teams chosen at invite time, applied atomically on acceptance.
CREATE TABLE guardian_admin_invitation_roles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES guardian_admin_invitations(id) ON DELETE CASCADE,
    role_id       UUID NOT NULL REFERENCES guardian_roles(id) ON DELETE CASCADE,
    UNIQUE (invitation_id, role_id)
);

CREATE TABLE guardian_admin_invitation_teams (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES guardian_admin_invitations(id) ON DELETE CASCADE,
    team_id       UUID NOT NULL REFERENCES guardian_teams(id) ON DELETE CASCADE,
    UNIQUE (invitation_id, team_id)
);

-- +goose Down
DROP TABLE IF EXISTS guardian_admin_invitation_teams;
DROP TABLE IF EXISTS guardian_admin_invitation_roles;
DROP TABLE IF EXISTS guardian_admin_invitations;
