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
	scope := r.URL.Query().Get("scope")
	if scope == "" {
		scope = "platform"
	}
	if scope != "platform" && scope != "personal" {
		scope = "platform"
	}

	var userID string
	if scope == "personal" {
		id, ok := resolvePersonalUserID(r)
		if !ok {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "user id required for personal settings"})
			return
		}
		userID = id
	} else {
		userID = "00000000-0000-4000-8000-0000000000bb"
	}

	rows, err := h.DB.QueryContext(r.Context(), `
		SELECT category, data, updated_at FROM admin_settings
		WHERE scope = $1 AND user_id = $2 ORDER BY category`, scope, userID)
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
		if scope == "personal" && cat == "appearance" {
			parsed = normalizeDashboardThemeData(data)
		}
		out[cat] = parsed
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *AdminSettingsHandler) GetCategory(w http.ResponseWriter, r *http.Request) {
	cat := chi.URLParam(r, "category")
	scope := r.URL.Query().Get("scope")
	if scope == "" {
		scope = "platform"
	}
	if scope != "platform" && scope != "personal" {
		scope = "platform"
	}

	var userID string
	if scope == "personal" {
		id, ok := resolvePersonalUserID(r)
		if !ok {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "user id required for personal settings"})
			return
		}
		userID = id
	} else {
		userID = "00000000-0000-4000-8000-0000000000bb"
	}

	var data []byte
	err := h.DB.QueryRowContext(r.Context(), `SELECT data FROM admin_settings WHERE scope=$1 AND category=$2 AND user_id=$3 LIMIT 1`, scope, cat, userID).Scan(&data)
	if err == sql.ErrNoRows {
		if scope == "personal" && cat == "appearance" {
			writeJSON(w, http.StatusOK, dashboardThemeResponse{Mode: dashboardThemeModeFollow, Theme: nil})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to query"})
		return
	}

	if scope == "personal" && cat == "appearance" {
		writeJSON(w, http.StatusOK, normalizeDashboardThemeData(data))
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
	scope := r.URL.Query().Get("scope")
	if scope == "" {
		scope = "platform"
	}
	if scope != "platform" && scope != "personal" {
		scope = "platform"
	}
	allowed := map[string]bool{"profile": true, "org": true, "appearance": true, "api": true, "platform_cfg": true, "security": true, "notif": true, "platform": true, "navigation": true, "admin_studio": true}
	if !allowed[cat] {
		if cat == "platform" {
			cat = "platform_cfg"
		} else {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid category"})
			return
		}
	}
	if scope == "personal" && cat != "navigation" && cat != "admin_studio" && cat != "appearance" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "personal scope only allows navigation, admin_studio, appearance"})
		return
	}

	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	if body == nil {
		body = map[string]any{}
	}

	var userID string
	if scope == "personal" {
		id, ok := resolvePersonalUserID(r)
		if !ok {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "user id required for personal settings"})
			return
		}
		userID = id
	} else {
		userID = "00000000-0000-4000-8000-0000000000bb"
	}

	// Personal appearance: same contract as /api/v1/admin/dashboard-theme
	if scope == "personal" && cat == "appearance" {
		h.putPersonalAppearance(w, r, userID, body)
		return
	}

	raw, _ := json.Marshal(body)
	_, err := h.DB.ExecContext(r.Context(), `
		INSERT INTO admin_settings (user_id, scope, category, data, updated_at)
		VALUES ($1, $2, $3, $4::jsonb, now())
		ON CONFLICT (user_id, scope, category) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
	`, userID, scope, cat, string(raw))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to save"})
		return
	}
	_, _ = h.DB.ExecContext(r.Context(), `INSERT INTO audit_logs (tenant_id, actor_type, actor_id, action, target_type, metadata) VALUES (NULL, 'SUPER_ADMIN', $1, 'ADMIN_SETTINGS_UPDATE', $2, $3::jsonb)`, userID, cat, string(raw))
	writeJSON(w, http.StatusOK, body)
}

func (h *AdminSettingsHandler) putPersonalAppearance(w http.ResponseWriter, r *http.Request, userID string, body map[string]any) {
	dash := &DashboardThemeHandler{DB: h.DB}

	if mode, _ := body["mode"].(string); mode == dashboardThemeModeFollow {
		dash.clearPersonal(w, r, userID)
		return
	}
	if cleared, _ := body["_cleared"].(bool); cleared {
		dash.clearPersonal(w, r, userID)
		return
	}

	// Nested { mode, theme } shape
	if themeRaw, ok := body["theme"].(map[string]any); ok && body["mode"] == dashboardThemeModePersonal {
		body = themeRaw
		body["mode"] = dashboardThemeModePersonal
	}

	tokens := extractThemeTokens(body)
	if err := validateDashboardThemeTokens(tokens); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	stored := map[string]any{"mode": dashboardThemeModePersonal}
	for k, v := range tokens {
		stored[k] = v
	}
	raw, _ := json.Marshal(stored)

	_, err := h.DB.ExecContext(r.Context(), `
		INSERT INTO admin_settings (user_id, scope, category, data, updated_at)
		VALUES ($1, $2, $3, $4::jsonb, now())
		ON CONFLICT (user_id, scope, category) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
	`, userID, dashboardThemeScope, dashboardThemeCategory, string(raw))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to save"})
		return
	}
	_, _ = h.DB.ExecContext(r.Context(), `INSERT INTO audit_logs (tenant_id, actor_type, actor_id, action, target_type, metadata) VALUES (NULL, 'SUPER_ADMIN', $1, 'ADMIN_SETTINGS_UPDATE', $2, $3::jsonb)`, userID, "appearance", string(raw))
	writeJSON(w, http.StatusOK, dashboardThemeResponse{Mode: dashboardThemeModePersonal, Theme: tokens})
}
