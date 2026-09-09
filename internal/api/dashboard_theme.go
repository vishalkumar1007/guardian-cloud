package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
)

const (
	dashboardThemeModeFollow   = "follow_brand"
	dashboardThemeModePersonal = "personal"
	dashboardThemeCategory     = "appearance"
	dashboardThemeScope        = "personal"
)

type DashboardThemeHandler struct {
	DB *sql.DB
}

type dashboardThemeResponse struct {
	Mode  string         `json:"mode"`
	Theme map[string]any `json:"theme"`
}

// Get returns the current admin's dashboard theme preference.
// mode=follow_brand → theme is null; mode=personal → theme tokens.
func (h *DashboardThemeHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID, ok := resolvePersonalUserID(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "user id required for personal dashboard theme"})
		return
	}

	var data []byte
	err := h.DB.QueryRowContext(r.Context(), `
		SELECT data FROM admin_settings
		WHERE scope=$1 AND category=$2 AND user_id=$3 LIMIT 1
	`, dashboardThemeScope, dashboardThemeCategory, userID).Scan(&data)

	if err == sql.ErrNoRows {
		writeJSON(w, http.StatusOK, dashboardThemeResponse{Mode: dashboardThemeModeFollow, Theme: nil})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load dashboard theme"})
		return
	}

	writeJSON(w, http.StatusOK, normalizeDashboardThemeData(data))
}

// Put enables personal mode and stores theme tokens for the authenticated user.
func (h *DashboardThemeHandler) Put(w http.ResponseWriter, r *http.Request) {
	userID, ok := resolvePersonalUserID(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "user id required for personal dashboard theme"})
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

	// Support explicit follow via PUT { "mode": "follow_brand" } or legacy { "_cleared": true }
	if mode, _ := body["mode"].(string); mode == dashboardThemeModeFollow {
		h.clearPersonal(w, r, userID)
		return
	}
	if cleared, _ := body["_cleared"].(bool); cleared {
		h.clearPersonal(w, r, userID)
		return
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
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to save dashboard theme"})
		return
	}

	_, _ = h.DB.ExecContext(r.Context(), `
		INSERT INTO audit_logs (tenant_id, actor_type, actor_id, action, target_type, metadata)
		VALUES (NULL, 'SUPER_ADMIN', $1, 'DASHBOARD_THEME_UPDATE', 'appearance', $2::jsonb)
	`, userID, string(raw))

	writeJSON(w, http.StatusOK, dashboardThemeResponse{Mode: dashboardThemeModePersonal, Theme: tokens})
}

// Delete switches the admin back to following Brand Studio (global theme).
func (h *DashboardThemeHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := resolvePersonalUserID(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "user id required for personal dashboard theme"})
		return
	}
	h.clearPersonal(w, r, userID)
}

func (h *DashboardThemeHandler) clearPersonal(w http.ResponseWriter, r *http.Request, userID string) {
	_, err := h.DB.ExecContext(r.Context(), `
		DELETE FROM admin_settings
		WHERE user_id=$1 AND scope=$2 AND category=$3
	`, userID, dashboardThemeScope, dashboardThemeCategory)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to clear dashboard theme"})
		return
	}
	_, _ = h.DB.ExecContext(r.Context(), `
		INSERT INTO audit_logs (tenant_id, actor_type, actor_id, action, target_type, metadata)
		VALUES (NULL, 'SUPER_ADMIN', $1, 'DASHBOARD_THEME_CLEAR', 'appearance', '{"mode":"follow_brand"}'::jsonb)
	`, userID)
	writeJSON(w, http.StatusOK, dashboardThemeResponse{Mode: dashboardThemeModeFollow, Theme: nil})
}

func normalizeDashboardThemeData(data []byte) dashboardThemeResponse {
	var parsed map[string]any
	if err := json.Unmarshal(data, &parsed); err != nil || parsed == nil {
		return dashboardThemeResponse{Mode: dashboardThemeModeFollow, Theme: nil}
	}

	if mode, _ := parsed["mode"].(string); mode == dashboardThemeModeFollow {
		return dashboardThemeResponse{Mode: dashboardThemeModeFollow, Theme: nil}
	}
	if cleared, _ := parsed["_cleared"].(bool); cleared {
		return dashboardThemeResponse{Mode: dashboardThemeModeFollow, Theme: nil}
	}

	tokens := extractThemeTokens(parsed)
	if !hasValidThemeTokens(tokens) {
		return dashboardThemeResponse{Mode: dashboardThemeModeFollow, Theme: nil}
	}
	return dashboardThemeResponse{Mode: dashboardThemeModePersonal, Theme: tokens}
}

func extractThemeTokens(body map[string]any) map[string]any {
	keys := []string{
		"ink", "inkSoft", "mist", "mistDeep", "signal", "signalSoft", "alert",
		"atmosphereMode", "colorScheme", "accent", "accent2",
		"radius", "radiusSm", "radiusLg", "fontDisplay", "fontBody", "packId",
	}
	out := map[string]any{}
	for _, k := range keys {
		if v, ok := body[k]; ok {
			out[k] = v
		}
	}
	// Accept snake_case aliases from older clients
	aliases := map[string]string{
		"ink_soft": "inkSoft", "mist_deep": "mistDeep", "signal_soft": "signalSoft",
		"atmosphere_mode": "atmosphereMode", "color_scheme": "colorScheme",
		"radius_sm": "radiusSm", "radius_lg": "radiusLg",
		"font_display": "fontDisplay", "font_body": "fontBody",
	}
	for snake, camel := range aliases {
		if _, has := out[camel]; has {
			continue
		}
		if v, ok := body[snake]; ok {
			out[camel] = v
		}
	}
	if _, has := out["accent2"]; !has {
		if v, ok := body["accent_2"]; ok {
			out["accent2"] = v
		}
	}
	return out
}

func hasValidThemeTokens(tokens map[string]any) bool {
	accent, _ := tokens["accent"].(string)
	scheme, _ := tokens["colorScheme"].(string)
	return accent != "" && (scheme == "light" || scheme == "dark")
}

func validateDashboardThemeTokens(tokens map[string]any) error {
	if !hasValidThemeTokens(tokens) {
		return colorError("accent and colorScheme (light|dark) are required")
	}
	colorFields := []string{"ink", "inkSoft", "mist", "mistDeep", "signal", "signalSoft", "alert", "accent", "accent2"}
	for _, name := range colorFields {
		v, _ := tokens[name].(string)
		if v == "" {
			continue
		}
		if !hexColor.MatchString(v) && !rgbaColor.MatchString(v) {
			return errInvalidColor(name)
		}
	}
	return nil
}

// resolvePersonalUserID requires an explicit user identity for personal-scoped data.
// Accepts X-User-Id / Bearer UUID / platform dev token → seeded superadmin.
// Does NOT silently default anonymous requests to the seeded UUID.
// resolvePersonalUserID identifies whose per-user settings a request refers to.
//
// A real staff session wins. Everything below it is the pre-session fallback,
// which trusts a client-supplied header and is gated by AUTH_LEGACY_MODE — see
// legacy.go for how it is being retired.
func resolvePersonalUserID(r *http.Request) (string, bool) {
	if id, ok := adminPrincipalID(r); ok {
		return id, true
	}
	if !legacyFallbackAllowed(r, "resolvePersonalUserID") {
		return "", false
	}

	if v := r.Header.Get("X-User-Id"); isUUID(v) {
		return v, true
	}
	if v := r.Header.Get("X-User-ID"); isUUID(v) {
		return v, true
	}
	if v := r.Header.Get("X-Tenant-User-Id"); isUUID(v) {
		return v, true
	}
	authorization := r.Header.Get("Authorization")
	if strings.HasPrefix(authorization, "Bearer ") {
		token := strings.TrimPrefix(authorization, "Bearer ")
		if isUUID(token) {
			return token, true
		}
		if platformAuthorized(r) {
			return seededSuperAdminUserID, true
		}
	}
	if r.Header.Get("X-Platform-Token") != "" && platformAuthorized(r) {
		return seededSuperAdminUserID, true
	}
	return "", false
}

// seededSuperAdminUserID is the users-table row seeded by migration 00008. The
// staff plane's equivalent is a different id in guardian_admin_users; migration
// 00018 copied this account's saved preferences across so nothing is lost when
// the legacy path is switched off.
const seededSuperAdminUserID = "00000000-0000-4000-8000-0000000000bb"

func isUUID(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i, c := range s {
		if i == 8 || i == 13 || i == 18 || i == 23 {
			if c != '-' {
				return false
			}
		} else if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	return true
}
