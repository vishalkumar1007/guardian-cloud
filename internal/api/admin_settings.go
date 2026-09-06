package api

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type AdminSettingsHandler struct {
	DB *sql.DB
}

func (h *AdminSettingsHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(), `
		SELECT category, data, updated_at FROM admin_settings
		WHERE scope = 'platform' ORDER BY category`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to query settings"})
		return
	}
	defer rows.Close()
	out := map[string]any{}
	for rows.Next() {
		var cat string
		var data []byte
		var updatedAt sql.NullTime
		if err := rows.Scan(&cat, &data, &updatedAt); err != nil {
			continue
		}
		var parsed any
		if err := json.Unmarshal(data, &parsed); err != nil {
			parsed = string(data)
		}
		out[cat] = parsed
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *AdminSettingsHandler) GetCategory(w http.ResponseWriter, r *http.Request) {
	cat := chi.URLParam(r, "category")
	var data []byte
	err := h.DB.QueryRowContext(r.Context(), `SELECT data FROM admin_settings WHERE scope='platform' AND category=$1 LIMIT 1`, cat).Scan(&data)
	if err == sql.ErrNoRows {
		writeJSON(w, http.StatusOK, map[string]any{})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to query"})
		return
	}
	var parsed any
	_ = json.Unmarshal(data, &parsed)
	if parsed == nil {
		parsed = map[string]any{}
	}
	writeJSON(w, http.StatusOK, parsed)
}

func (h *AdminSettingsHandler) PutCategory(w http.ResponseWriter, r *http.Request) {
	cat := chi.URLParam(r, "category")
	allowed := map[string]bool{"profile": true, "org": true, "appearance": true, "api": true, "platform_cfg": true, "security": true, "notif": true, "platform": true}
	if !allowed[cat] {
		if cat == "platform" {
			cat = "platform_cfg"
		} else {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid category"})
			return
		}
	}
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	if body == nil {
		body = map[string]any{}
	}
	raw, _ := json.Marshal(body)
	_, err := h.DB.ExecContext(r.Context(), `
		INSERT INTO admin_settings (user_id, scope, category, data, updated_at)
		VALUES ('00000000-0000-4000-8000-0000000000bb', 'platform', $1, $2::jsonb, now())
		ON CONFLICT (user_id, scope, category) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
	`, cat, string(raw))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to save"})
		return
	}
	_, _ = h.DB.ExecContext(r.Context(), `INSERT INTO audit_logs (tenant_id, actor_type, actor_id, action, target_type, metadata) VALUES (NULL, 'SUPER_ADMIN', '00000000-0000-4000-8000-0000000000bb', 'ADMIN_SETTINGS_UPDATE', $1, $2::jsonb)`, cat, string(raw))
	writeJSON(w, http.StatusOK, body)
}
