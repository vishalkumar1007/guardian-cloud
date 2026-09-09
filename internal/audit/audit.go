// Package audit writes the append-only administrative and security trail.
//
// The design rule from the spec: "every state-changing action writes an
// audit_logs row in the same transaction as the change it describes, not as a
// best-effort afterthought". Write therefore takes a *sql.Tx and not a *sql.DB —
// it is not possible to record an audit entry outside the transaction of the
// change it claims to describe.
package audit

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
)

// Actor planes. Guardian staff and customer users are separate identity domains,
// so an actor id is only meaningful alongside the plane it belongs to.
const (
	PlaneCustomer = "customer"
	PlaneAdmin    = "admin"
	PlaneSystem   = "system"
)

// Actor types, matching the audit_logs.actor_type CHECK constraint.
const (
	ActorUser          = "USER"
	ActorGuardianAdmin = "GUARDIAN_ADMIN"
	ActorDevice        = "DEVICE"
	ActorSystem        = "SYSTEM"
)

// Entry is one audit record.
//
// Metadata must never carry secrets: no passwords, tokens, TOTP codes, recovery
// codes or client secrets. Record identifiers and outcomes, not credentials.
type Entry struct {
	TenantID   *string // nil for platform-scoped actions
	ActorPlane string
	ActorType  string
	ActorID    *string
	Action     string // dotted verb, e.g. "iam.role.permissions_replaced"
	TargetType string
	TargetID   *string
	Metadata   map[string]any
	IPAddress  string
	UserAgent  string
	RequestID  string
}

// Write inserts one audit row inside the caller's transaction.
func Write(ctx context.Context, tx *sql.Tx, e Entry) error {
	metadata := e.Metadata
	if metadata == nil {
		metadata = map[string]any{}
	}
	encoded, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("encode audit metadata: %w", err)
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO audit_logs
			(tenant_id, actor_plane, actor_type, actor_id, action,
			 target_type, target_id, metadata, ip_address, user_agent, request_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NULLIF($9,'')::inet, NULLIF($10,''), NULLIF($11,''))
	`,
		e.TenantID, e.ActorPlane, e.ActorType, e.ActorID, e.Action,
		nullIfEmpty(e.TargetType), e.TargetID, string(encoded),
		e.IPAddress, e.UserAgent, e.RequestID,
	)
	if err != nil {
		return fmt.Errorf("write audit log: %w", err)
	}
	return nil
}

func nullIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}
