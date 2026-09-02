package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"regexp"
	"strings"
)

var hexColor = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)

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
}

func (h *ThemeHandler) Get(w http.ResponseWriter, r *http.Request) {
	var resp themeResponse
	var updatedAt sql.NullTime
	err := h.DB.QueryRowContext(r.Context(), `
		SELECT ink, ink_soft, mist, mist_deep, signal, signal_soft, alert,
		       atmosphere_mode, color_scheme, version, updated_at
		FROM platform_theme
		WHERE id = '00000000-0000-4000-8000-0000000000aa'
	`).Scan(
		&resp.Ink, &resp.InkSoft, &resp.Mist, &resp.MistDeep,
		&resp.Signal, &resp.SignalSoft, &resp.Alert,
		&resp.AtmosphereMode, &resp.ColorScheme, &resp.Version, &updatedAt,
	)
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

	_, err := h.DB.ExecContext(r.Context(), `
		UPDATE platform_theme
		SET ink = $1, ink_soft = $2, mist = $3, mist_deep = $4,
		    signal = $5, signal_soft = $6, alert = $7, atmosphere_mode = $8,
		    color_scheme = $9,
		    version = version + 1,
		    updated_by = '00000000-0000-4000-8000-0000000000bb',
		    updated_at = now()
		WHERE id = '00000000-0000-4000-8000-0000000000aa'
	`, req.Ink, req.InkSoft, req.Mist, req.MistDeep, req.Signal, req.SignalSoft, req.Alert, req.AtmosphereMode, req.ColorScheme)
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
		if !hexColor.MatchString(f.value) {
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
