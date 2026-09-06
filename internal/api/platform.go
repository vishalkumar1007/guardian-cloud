package api

import (
	"database/sql"
	"net/http"
)

type PlatformHandler struct {
	DB *sql.DB
}

func (h *PlatformHandler) Organizations(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(), `SELECT id, type, name, status, created_at FROM tenants ORDER BY created_at DESC LIMIT 100`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to query tenants"})
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, typ, name, status string
		var createdAt sql.NullTime
		if err := rows.Scan(&id, &typ, &name, &status, &createdAt); err != nil {
			continue
		}
		item := map[string]any{"id": id, "type": typ, "name": name, "status": status}
		if createdAt.Valid {
			item["created_at"] = createdAt.Time.UTC().Format("2006-01-02T15:04:05Z")
		}
		out = append(out, item)
	}
	if out == nil {
		out = []map[string]any{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": out, "total": len(out)})
}

func (h *PlatformHandler) Users(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(), `
		SELECT u.id, u.email, u.display_name, u.status, u.created_at,
		       COALESCE(pa.role, ''), COALESCE(pa.granted_at::text, '')
		FROM users u
		LEFT JOIN platform_admins pa ON pa.user_id = u.id AND pa.revoked_at IS NULL
		ORDER BY u.created_at DESC LIMIT 100`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to query users"})
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, email, displayName, status, role, grantedAt string
		var createdAt sql.NullTime
		var displayNameNull sql.NullString
		if err := rows.Scan(&id, &email, &displayNameNull, &status, &createdAt, &role, &grantedAt); err != nil {
			continue
		}
		if displayNameNull.Valid {
			displayName = displayNameNull.String
		}
		item := map[string]any{"id": id, "email": email, "display_name": displayName, "status": status, "platform_role": role}
		if createdAt.Valid {
			item["created_at"] = createdAt.Time.UTC().Format("2006-01-02T15:04:05Z")
		}
		out = append(out, item)
	}
	if out == nil {
		out = []map[string]any{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": out, "total": len(out)})
}

func (h *PlatformHandler) Devices(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(), `SELECT id, tenant_id, platform, hostname, display_name, status, last_seen_at, registered_at FROM devices ORDER BY registered_at DESC LIMIT 100`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to query devices"})
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, tenantID, platform, status string
		var hostname, displayName sql.NullString
		var lastSeen, registeredAt sql.NullTime
		if err := rows.Scan(&id, &tenantID, &platform, &hostname, &displayName, &status, &lastSeen, &registeredAt); err != nil {
			continue
		}
		item := map[string]any{"id": id, "tenant_id": tenantID, "platform": platform, "status": status}
		if hostname.Valid {
			item["hostname"] = hostname.String
		}
		if displayName.Valid {
			item["display_name"] = displayName.String
		}
		if lastSeen.Valid {
			item["last_seen_at"] = lastSeen.Time.UTC().Format("2006-01-02T15:04:05Z")
		}
		if registeredAt.Valid {
			item["registered_at"] = registeredAt.Time.UTC().Format("2006-01-02T15:04:05Z")
		}
		out = append(out, item)
	}
	if out == nil {
		out = []map[string]any{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": out, "total": len(out)})
}

func (h *PlatformHandler) Agents(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(), `SELECT id, platform, version, release_notes, released_at FROM agent_versions ORDER BY released_at DESC`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to query agents"})
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, platform, version string
		var releaseNotes sql.NullString
		var releasedAt sql.NullTime
		if err := rows.Scan(&id, &platform, &version, &releaseNotes, &releasedAt); err != nil {
			continue
		}
		item := map[string]any{"id": id, "platform": platform, "version": version}
		if releaseNotes.Valid {
			item["release_notes"] = releaseNotes.String
		}
		if releasedAt.Valid {
			item["released_at"] = releasedAt.Time.UTC().Format("2006-01-02T15:04:05Z")
		}
		out = append(out, item)
	}
	if out == nil {
		out = []map[string]any{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": out, "total": len(out)})
}

func (h *PlatformHandler) Plans(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(), `SELECT id, name, tenant_type, tier, price_cents, billing_interval, device_limit, active FROM plans ORDER BY price_cents`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to query plans"})
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, name, tenantType, tier, interval string
		var priceCents int
		var deviceLimit sql.NullInt32
		var active bool
		if err := rows.Scan(&id, &name, &tenantType, &tier, &priceCents, &interval, &deviceLimit, &active); err != nil {
			continue
		}
		item := map[string]any{"id": id, "name": name, "tenant_type": tenantType, "tier": tier, "price_cents": priceCents, "billing_interval": interval, "active": active}
		if deviceLimit.Valid {
			item["device_limit"] = deviceLimit.Int32
		}
		out = append(out, item)
	}
	if out == nil {
		out = []map[string]any{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": out, "total": len(out)})
}

func (h *PlatformHandler) Subscriptions(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(), `
		SELECT s.id, s.tenant_id, t.name, p.name, s.status, s.current_period_end
		FROM subscriptions s
		JOIN tenants t ON t.id = s.tenant_id
		JOIN plans p ON p.id = s.plan_id
		ORDER BY s.created_at DESC LIMIT 100`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to query subscriptions"})
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, tenantID, tenantName, planName, status string
		var periodEnd sql.NullTime
		if err := rows.Scan(&id, &tenantID, &tenantName, &planName, &status, &periodEnd); err != nil {
			continue
		}
		item := map[string]any{"id": id, "tenant_id": tenantID, "tenant_name": tenantName, "plan_name": planName, "status": status}
		if periodEnd.Valid {
			item["current_period_end"] = periodEnd.Time.UTC().Format("2006-01-02T15:04:05Z")
		}
		out = append(out, item)
	}
	if out == nil {
		out = []map[string]any{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": out, "total": len(out)})
}

func (h *PlatformHandler) Audit(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(), `SELECT id, tenant_id, actor_type, actor_id, action, target_type, occurred_at FROM audit_logs ORDER BY occurred_at DESC LIMIT 100`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to query audit"})
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, actorType, action string
		var tenantID, actorID, targetType sql.NullString
		var occurredAt sql.NullTime
		if err := rows.Scan(&id, &tenantID, &actorType, &actorID, &action, &targetType, &occurredAt); err != nil {
			continue
		}
		item := map[string]any{"id": id, "actor_type": actorType, "action": action}
		if tenantID.Valid {
			item["tenant_id"] = tenantID.String
		}
		if actorID.Valid {
			item["actor_id"] = actorID.String
		}
		if targetType.Valid {
			item["target_type"] = targetType.String
		}
		if occurredAt.Valid {
			item["occurred_at"] = occurredAt.Time.UTC().Format("2006-01-02T15:04:05Z")
		}
		out = append(out, item)
	}
	if out == nil {
		out = []map[string]any{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": out, "total": len(out)})
}

func (h *PlatformHandler) SystemHealth(w http.ResponseWriter, r *http.Request) {
	var dbOk = true
	if err := h.DB.PingContext(r.Context()); err != nil {
		dbOk = false
	}
	var tenantCount, userCount, deviceCount, planCount int
	_ = h.DB.QueryRowContext(r.Context(), `SELECT count(*) FROM tenants`).Scan(&tenantCount)
	_ = h.DB.QueryRowContext(r.Context(), `SELECT count(*) FROM users`).Scan(&userCount)
	_ = h.DB.QueryRowContext(r.Context(), `SELECT count(*) FROM devices`).Scan(&deviceCount)
	_ = h.DB.QueryRowContext(r.Context(), `SELECT count(*) FROM plans`).Scan(&planCount)
	var gooseVersion sql.NullString
	_ = h.DB.QueryRowContext(r.Context(), `SELECT version FROM goose_db_version ORDER BY version DESC LIMIT 1`).Scan(&gooseVersion)

	writeJSON(w, http.StatusOK, map[string]any{
		"db_ok":         dbOk,
		"tenants":       tenantCount,
		"users":         userCount,
		"devices":       deviceCount,
		"plans":         planCount,
		"goose_version": gooseVersion.String,
		"status":        "ok",
	})
}

func (h *PlatformHandler) Support(w http.ResponseWriter, r *http.Request) {
	// Support tickets not yet modeled — return audit as support feed for now
	h.Audit(w, r)
}
