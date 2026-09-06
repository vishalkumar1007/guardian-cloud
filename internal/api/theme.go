package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"regexp"
	"strings"
)

var hexColor = regexp.MustCompile(`^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$`)
var rgbaColor = regexp.MustCompile(`^(rgba?|hsla?|color-mix)\(.+\)$`)

type ThemeHandler struct {
	DB *sql.DB
}

type themeResponse struct {
	Ink            string `json:"ink"`
	InkSoft        string `json:"ink_soft"`
	Mist           string `json:"mist"`
	MistDeep       string `json:"mist_deep"`
	Signal         string `json:"signal"`
	SignalSoft     string `json:"signal_soft"`
	Alert          string `json:"alert"`
	AtmosphereMode string `json:"atmosphere_mode"`
	ColorScheme    string `json:"color_scheme"`
	Accent         string `json:"accent,omitempty"`
	Accent2        string `json:"accent2,omitempty"`
	AccentRgb      string `json:"accent_rgb,omitempty"`
	Radius         string `json:"radius,omitempty"`
	RadiusSm       string `json:"radius_sm,omitempty"`
	RadiusLg       string `json:"radius_lg,omitempty"`
	FontDisplay    string `json:"font_display,omitempty"`
	FontBody       string `json:"font_body,omitempty"`
	Version        int64  `json:"version"`
	UpdatedAt      string `json:"updated_at,omitempty"`
}

type themeRequest struct {
	Ink            string `json:"ink"`
	InkSoft        string `json:"ink_soft"`
	Mist           string `json:"mist"`
	MistDeep       string `json:"mist_deep"`
	Signal         string `json:"signal"`
	SignalSoft     string `json:"signal_soft"`
	Alert          string `json:"alert"`
	AtmosphereMode string `json:"atmosphere_mode"`
	ColorScheme    string `json:"color_scheme"`
	Accent         string `json:"accent"`
	Accent2        string `json:"accent2"`
	AccentRgb      string `json:"accent_rgb"`
	Radius         string `json:"radius"`
	RadiusSm       string `json:"radius_sm"`
	RadiusLg       string `json:"radius_lg"`
	FontDisplay    string `json:"font_display"`
	FontBody       string `json:"font_body"`
}

func (h *ThemeHandler) Get(w http.ResponseWriter, r *http.Request) {
	var resp themeResponse
	var updatedAt sql.NullTime
	var accent, accent2, accentRgb, radius, radiusSm, radiusLg, fontDisplay, fontBody sql.NullString
	err := h.DB.QueryRowContext(r.Context(), `
		SELECT ink, ink_soft, mist, mist_deep, signal, signal_soft, alert,
		       atmosphere_mode, color_scheme, accent, accent_2, accent_rgb, radius, radius_sm, radius_lg, font_display, font_body, version, updated_at
		FROM platform_theme
		WHERE id = '00000000-0000-4000-8000-0000000000aa'
	`).Scan(
		&resp.Ink, &resp.InkSoft, &resp.Mist, &resp.MistDeep,
		&resp.Signal, &resp.SignalSoft, &resp.Alert,
		&resp.AtmosphereMode, &resp.ColorScheme, &accent, &accent2, &accentRgb, &radius, &radiusSm, &radiusLg, &fontDisplay, &fontBody, &resp.Version, &updatedAt,
	)
	if accent.Valid {
		resp.Accent = accent.String
	}
	if accent2.Valid {
		resp.Accent2 = accent2.String
	}
	if accentRgb.Valid {
		resp.AccentRgb = accentRgb.String
	}
	if radius.Valid {
		resp.Radius = radius.String
	}
	if radiusSm.Valid {
		resp.RadiusSm = radiusSm.String
	}
	if radiusLg.Valid {
		resp.RadiusLg = radiusLg.String
	}
	if fontDisplay.Valid {
		resp.FontDisplay = fontDisplay.String
	}
	if fontBody.Valid {
		resp.FontBody = fontBody.String
	}
	if err == sql.ErrNoRows {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "theme not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load theme"})
		return
	}
	if updatedAt.Valid {
		resp.UpdatedAt = updatedAt.Time.UTC().Format("2006-01-02T15:04:05Z")
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *ThemeHandler) Put(w http.ResponseWriter, r *http.Request) {
	if !platformAuthorized(r) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "platform admin token required"})
		return
	}

	var req themeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	if err := validateTheme(req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if req.AtmosphereMode == "" {
		req.AtmosphereMode = "void"
	}
	if req.ColorScheme == "" {
		req.ColorScheme = "dark"
	}

	if req.Accent == "" {
		req.Accent = req.Signal
	}
	if req.Accent2 == "" {
		req.Accent2 = req.Accent
	}
	if req.AccentRgb == "" && req.Accent != "" {
		req.AccentRgb = "99,102,241"
	}
	if req.Radius == "" {
		req.Radius = "14px"
	}
	if req.RadiusSm == "" {
		req.RadiusSm = "10px"
	}
	if req.RadiusLg == "" {
		req.RadiusLg = "22px"
	}
	if req.FontDisplay == "" {
		req.FontDisplay = "Sora"
	}
	if req.FontBody == "" {
		req.FontBody = "Inter"
	}

	_, err := h.DB.ExecContext(r.Context(), `
		UPDATE platform_theme
		SET ink = $1, ink_soft = $2, mist = $3, mist_deep = $4,
		    signal = $5, signal_soft = $6, alert = $7, atmosphere_mode = $8,
		    color_scheme = $9, accent = $10, accent_2 = $11, accent_rgb = $12,
		    radius = $13, radius_sm = $14, radius_lg = $15, font_display = $16, font_body = $17,
		    version = version + 1,
		    updated_by = '00000000-0000-4000-8000-0000000000bb',
		    updated_at = now()
		WHERE id = '00000000-0000-4000-8000-0000000000aa'
	`, req.Ink, req.InkSoft, req.Mist, req.MistDeep, req.Signal, req.SignalSoft, req.Alert, req.AtmosphereMode, req.ColorScheme,
		req.Accent, req.Accent2, req.AccentRgb, req.Radius, req.RadiusSm, req.RadiusLg, req.FontDisplay, req.FontBody)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to update theme"})
		return
	}

	h.Get(w, r)
}

func validateTheme(req themeRequest) error {
	fields := []struct {
		name  string
		value string
	}{
		{"ink", req.Ink},
		{"ink_soft", req.InkSoft},
		{"mist", req.Mist},
		{"mist_deep", req.MistDeep},
		{"signal", req.Signal},
		{"signal_soft", req.SignalSoft},
		{"alert", req.Alert},
	}
	for _, f := range fields {
		if !hexColor.MatchString(f.value) && !rgbaColor.MatchString(f.value) {
			return errInvalidColor(f.name)
		}
	}
	if req.ColorScheme != "" && req.ColorScheme != "light" && req.ColorScheme != "dark" {
		return colorError("color_scheme must be light or dark")
	}
	return nil
}

type colorError string

func (e colorError) Error() string { return string(e) }

func errInvalidColor(name string) error {
	return colorError("invalid hex color for " + name)
}

func platformAuthorized(r *http.Request) bool {
	expected := os.Getenv("GUARDIAN_PLATFORM_DEV_TOKEN")
	if expected == "" {
		expected = "guardian-dev-super-admin"
	}
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ") == expected
	}
	return r.Header.Get("X-Platform-Token") == expected
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
