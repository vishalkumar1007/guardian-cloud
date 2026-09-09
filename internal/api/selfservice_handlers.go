package api

import (
	"database/sql"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"guardian-cloud/internal/audit"
	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/db"
	"guardian-cloud/internal/mfa"
)

// SelfServiceHandler serves account security for the signed-in caller: MFA
// enrolment, sessions and password changes. Shared by both planes.
type SelfServiceHandler struct {
	*Env
	Plane auth.Plane
}

// totpIssuer is the label authenticator apps show beside the code.
const totpIssuer = "Guardian"

// subject resolves who the request acts on.
//
// Two callers are legitimate: a fully authenticated session, and someone part
// way through login who has been told to enrol before they can finish. The
// second holds only an ENROLLMENT challenge — never a session — so enrolment is
// reachable without ever creating one.
func (h *SelfServiceHandler) subject(r *http.Request) (subjectID string, enrolling bool, err error) {
	if principal := auth.PrincipalForPlane(r.Context(), h.Plane); principal != nil {
		return principal.SubjectID, false, nil
	}

	token := auth.ReadCookie(r, h.Plane.ChallengeCookie)
	challenge, err := mfa.LoadChallenge(r.Context(), h.DB, h.Plane.Name, token)
	if err != nil {
		return "", false, auth.ErrNoSession
	}
	if challenge.Purpose != mfa.PurposeEnrollment {
		return "", false, auth.ErrNoSession
	}
	return challenge.SubjectID, true, nil
}

// ListMFA describes the caller's enrolled factors.
func (h *SelfServiceHandler) ListMFA(w http.ResponseWriter, r *http.Request) {
	subjectID, _, err := h.subject(r)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}

	methods, err := auth.ListMFAMethods(r.Context(), h.DB, h.Plane, subjectID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load authentication methods"})
		return
	}

	remaining, err := mfa.CountUnusedRecoveryCodes(r.Context(), h.DB, h.Plane.Name, subjectID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load recovery codes"})
		return
	}

	items := make([]map[string]any, 0, len(methods))
	for _, method := range methods {
		items = append(items, mfaMethodResponse(method))
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"items":                    items,
		"total":                    len(items),
		"recovery_codes_remaining": remaining,
	})
}

type enrolTOTPRequest struct {
	Label string `json:"label"`
}

// StartTOTPEnrollment creates an unverified factor and returns its secret.
//
// The secret is shown once, here, so the caller can add it to an authenticator.
// It is stored sealed, and the factor does not count as protection until a
// correct code proves the app actually holds it.
func (h *SelfServiceHandler) StartTOTPEnrollment(w http.ResponseWriter, r *http.Request) {
	subjectID, enrolling, err := h.subject(r)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}

	var req enrolTOTPRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	identity, err := auth.LoadIdentityByID(r.Context(), h.DB, h.Plane, subjectID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load account"})
		return
	}

	secret, err := mfa.GenerateSecret()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to generate secret"})
		return
	}

	label := req.Label
	if label == "" {
		label = "Authenticator app"
	}

	var challengeID string
	if enrolling {
		token := auth.ReadCookie(r, h.Plane.ChallengeCookie)
		challenge, err := mfa.LoadChallenge(r.Context(), h.DB, h.Plane.Name, token)
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
			return
		}
		challengeID = challenge.ID
	}

	// The seal is bound to the method id, so the row has to exist first; it is
	// created with a placeholder and immediately re-sealed under its real id.
	var methodID string
	err = db.InTx(r.Context(), h.DB, func(tx *sql.Tx) error {
		var err error
		methodID, err = auth.CreateMFAMethod(r.Context(), tx, h.Plane, subjectID, "TOTP", label, "pending")
		if err != nil {
			return err
		}
		sealed, err := h.Sealer.Seal(secret, "mfa:"+methodID)
		if err != nil {
			return err
		}
		if err := auth.UpdateMFASecret(r.Context(), tx, h.Plane, methodID, sealed); err != nil {
			return err
		}
		// Give the caller a fresh window to scan the QR and confirm a code.
		if challengeID != "" {
			return mfa.ExtendChallenge(r.Context(), tx, challengeID)
		}
		return nil
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to start enrollment"})
		return
	}

	if challengeID != "" {
		// Mirror the extended TTL on the cookie so the browser does not drop it
		// before the challenge row expires.
		token := auth.ReadCookie(r, h.Plane.ChallengeCookie)
		auth.SetChallengeCookie(w, h.Plane, h.CookieConfig(), token)
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"mfa_method_id": methodID,
		"secret":        secret,
		"otpauth_uri":   mfa.ProvisioningURI(totpIssuer, identity.Email, secret),
	})
}

type verifyCodeRequest struct {
	Code string `json:"code"`
}

// VerifyTOTPEnrollment completes enrolment and issues recovery codes.
//
// The codes are returned exactly once. Regenerating later invalidates them all,
// so a printed copy can never outlive the set it belongs to.
//
// Mid-login enrolment verifies the factor, issues recovery codes, consumes the
// challenge and creates the session in one transaction so a session failure
// cannot leave the account enrolled with no way to finish signing in.
func (h *SelfServiceHandler) VerifyTOTPEnrollment(w http.ResponseWriter, r *http.Request) {
	subjectID, enrolling, err := h.subject(r)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}

	var req verifyCodeRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	methodID := chi.URLParam(r, "id")
	method, err := auth.GetMFAMethod(r.Context(), h.DB, h.Plane, subjectID, methodID)
	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "enrollment not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load enrollment"})
		return
	}

	secret, err := h.Sealer.Open(method.SecretRef, "mfa:"+method.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to read enrollment"})
		return
	}
	if !mfa.Validate(secret, req.Code, time.Now()) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "that code is not valid"})
		return
	}

	codes, err := mfa.GenerateRecoveryCodes()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to generate recovery codes"})
		return
	}

	var (
		challenge *mfa.Challenge
		session   *auth.IssuedSession
	)
	if enrolling {
		token := auth.ReadCookie(r, h.Plane.ChallengeCookie)
		challenge, err = mfa.LoadChallenge(r.Context(), h.DB, h.Plane.Name, token)
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
			return
		}
	}

	err = db.InTx(r.Context(), h.DB, func(tx *sql.Tx) error {
		if err := auth.VerifyMFAMethod(r.Context(), tx, h.Plane, subjectID, method.ID); err != nil {
			return err
		}
		if err := mfa.ReplaceRecoveryCodes(r.Context(), tx, h.Plane.Name, subjectID, codes); err != nil {
			return err
		}
		if err := audit.Write(r.Context(), tx, audit.Entry{
			ActorPlane: h.Plane.Name,
			ActorType:  h.Plane.AuditActorType,
			ActorID:    &subjectID,
			Action:     "auth.mfa.enrolled",
			TargetType: "mfa_method",
			TargetID:   &method.ID,
			Metadata:   map[string]any{"method_type": "TOTP"},
			IPAddress:  ClientIPString(r.Context()),
			UserAgent:  r.UserAgent(),
			RequestID:  RequestIDFromContext(r.Context()),
		}); err != nil {
			return err
		}
		if challenge == nil {
			return nil
		}
		if err := mfa.ConsumeChallenge(r.Context(), tx, challenge.ID); err != nil {
			return err
		}
		var err error
		session, err = auth.IssueSession(r.Context(), tx, h.Plane, h.SessionPolicy(r.Context()), auth.IssueOptions{
			SubjectID:    subjectID,
			IPAddress:    ClientIPString(r.Context()),
			UserAgent:    r.UserAgent(),
			AuthMethod:   "PASSWORD",
			MFASatisfied: true,
		})
		if err != nil {
			return err
		}
		return auth.RecordLogin(r.Context(), tx, h.Plane, subjectID)
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to complete enrollment"})
		return
	}

	response := map[string]any{"verified": true, "recovery_codes": codes}
	if session != nil {
		auth.ClearChallengeCookie(w, h.Plane, h.CookieConfig())
		auth.SetSessionCookies(w, h.Plane, h.CookieConfig(), session)
		response["status"] = string(auth.DecisionAuthenticated)
		response["csrf_token"] = session.CSRFToken
	}

	writeJSON(w, http.StatusOK, response)
}

// DeleteMFA removes a factor.
//
// Requires the password again: someone who walks up to an unlocked laptop should
// not be able to strip the second factor off the account.
func (h *SelfServiceHandler) DeleteMFA(w http.ResponseWriter, r *http.Request) {
	principal := auth.PrincipalForPlane(r.Context(), h.Plane)
	if principal == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}

	var req struct {
		Password string `json:"password"`
	}
	if !decodeJSON(w, r, &req) {
		return
	}

	identity, err := auth.LoadIdentityByEmail(r.Context(), h.DB, h.Plane, principal.Email)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load account"})
		return
	}
	if err := auth.VerifyIdentityPassword(identity, req.Password); err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "incorrect password"})
		return
	}

	methodID := chi.URLParam(r, "id")
	policyRequires := h.RequiresMFA(r.Context(), h.Plane) || identity.MFARequired

	err = db.InTx(r.Context(), h.DB, func(tx *sql.Tx) error {
		// Locking the owner row serialises concurrent deletions; without it two
		// simultaneous requests each see two factors, each decide they are not
		// removing the last, and the account ends up with none.
		count, err := auth.CountVerifiedMFAMethods(r.Context(), tx, h.Plane, principal.SubjectID, true)
		if err != nil {
			return err
		}
		if policyRequires && count <= 1 {
			return errLastMFAMethod
		}
		if err := auth.RevokeMFAMethod(r.Context(), tx, h.Plane, principal.SubjectID, methodID); err != nil {
			return err
		}
		return audit.Write(r.Context(), tx, audit.Entry{
			ActorPlane: h.Plane.Name,
			ActorType:  h.Plane.AuditActorType,
			ActorID:    &principal.SubjectID,
			Action:     "auth.mfa.removed",
			TargetType: "mfa_method",
			TargetID:   &methodID,
			IPAddress:  ClientIPString(r.Context()),
			UserAgent:  r.UserAgent(),
			RequestID:  RequestIDFromContext(r.Context()),
		})
	})
	if errors.Is(err, errLastMFAMethod) {
		writeJSON(w, http.StatusConflict, map[string]string{
			"error": "two-factor authentication is required, add another method before removing this one",
		})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to remove method"})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

var errLastMFAMethod = errors.New("cannot remove the last mfa method")

// RegenerateRecoveryCodes issues a fresh set and invalidates the old ones.
func (h *SelfServiceHandler) RegenerateRecoveryCodes(w http.ResponseWriter, r *http.Request) {
	principal := auth.PrincipalForPlane(r.Context(), h.Plane)
	if principal == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}

	var req struct {
		Password string `json:"password"`
	}
	if !decodeJSON(w, r, &req) {
		return
	}

	identity, err := auth.LoadIdentityByEmail(r.Context(), h.DB, h.Plane, principal.Email)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load account"})
		return
	}
	if err := auth.VerifyIdentityPassword(identity, req.Password); err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "incorrect password"})
		return
	}

	codes, err := mfa.GenerateRecoveryCodes()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to generate recovery codes"})
		return
	}

	err = db.InTx(r.Context(), h.DB, func(tx *sql.Tx) error {
		if err := mfa.ReplaceRecoveryCodes(r.Context(), tx, h.Plane.Name, principal.SubjectID, codes); err != nil {
			return err
		}
		return audit.Write(r.Context(), tx, audit.Entry{
			ActorPlane: h.Plane.Name,
			ActorType:  h.Plane.AuditActorType,
			ActorID:    &principal.SubjectID,
			Action:     "auth.mfa.recovery_codes_regenerated",
			TargetType: "account",
			TargetID:   &principal.SubjectID,
			IPAddress:  ClientIPString(r.Context()),
			UserAgent:  r.UserAgent(),
			RequestID:  RequestIDFromContext(r.Context()),
		})
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to store recovery codes"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"recovery_codes": codes})
}

// ListSessions shows the caller their own signed-in devices.
func (h *SelfServiceHandler) ListSessions(w http.ResponseWriter, r *http.Request) {
	principal := auth.PrincipalForPlane(r.Context(), h.Plane)
	if principal == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}

	sessions, err := auth.ListSessions(r.Context(), h.DB, h.Plane, principal.SubjectID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load sessions"})
		return
	}

	items := make([]map[string]any, 0, len(sessions))
	for _, session := range sessions {
		items = append(items, map[string]any{
			"id":               session.ID,
			"ip_address":       session.IPAddress,
			"user_agent":       session.UserAgent,
			"issued_at":        session.IssuedAt.Format(timeLayout),
			"last_activity_at": session.LastActivityAt.Format(timeLayout),
			"expires_at":       session.ExpiresAt.Format(timeLayout),
			"auth_method":      session.AuthMethod,
			"current":          session.ID == principal.SessionID,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items, "total": len(items)})
}

// RevokeSession signs one device out.
func (h *SelfServiceHandler) RevokeSession(w http.ResponseWriter, r *http.Request) {
	principal := auth.PrincipalForPlane(r.Context(), h.Plane)
	if principal == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}

	sessionID := chi.URLParam(r, "id")
	owned, err := auth.SessionBelongsTo(r.Context(), h.DB, h.Plane, sessionID, principal.SubjectID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load session"})
		return
	}
	// 404 rather than 403 for someone else's session: a distinct response would
	// confirm that the id exists.
	if !owned {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "session not found"})
		return
	}

	if err := db.InTx(r.Context(), h.DB, func(tx *sql.Tx) error {
		if err := auth.RevokeSession(r.Context(), tx, h.Plane, sessionID, "ADMIN_REVOKE"); err != nil {
			return err
		}
		return audit.Write(r.Context(), tx, audit.Entry{
			ActorPlane: h.Plane.Name,
			ActorType:  h.Plane.AuditActorType,
			ActorID:    &principal.SubjectID,
			Action:     "auth.session.revoked",
			TargetType: "session",
			TargetID:   &sessionID,
			IPAddress:  ClientIPString(r.Context()),
			UserAgent:  r.UserAgent(),
			RequestID:  RequestIDFromContext(r.Context()),
		})
	}); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to revoke session"})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// RevokeOtherSessions signs out everywhere except here.
func (h *SelfServiceHandler) RevokeOtherSessions(w http.ResponseWriter, r *http.Request) {
	principal := auth.PrincipalForPlane(r.Context(), h.Plane)
	if principal == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}

	var revoked int64
	if err := db.InTx(r.Context(), h.DB, func(tx *sql.Tx) error {
		var err error
		revoked, err = auth.RevokeSessionsForSubject(r.Context(), tx, h.Plane,
			principal.SubjectID, principal.SessionID, "ADMIN_REVOKE")
		if err != nil {
			return err
		}
		return audit.Write(r.Context(), tx, audit.Entry{
			ActorPlane: h.Plane.Name,
			ActorType:  h.Plane.AuditActorType,
			ActorID:    &principal.SubjectID,
			Action:     "auth.session.revoked_all",
			TargetType: "account",
			TargetID:   &principal.SubjectID,
			Metadata:   map[string]any{"revoked": revoked},
			IPAddress:  ClientIPString(r.Context()),
			UserAgent:  r.UserAgent(),
			RequestID:  RequestIDFromContext(r.Context()),
		})
	}); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to revoke sessions"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"revoked": revoked})
}

// ChangePassword updates the password and signs out other devices.
func (h *SelfServiceHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	principal := auth.PrincipalForPlane(r.Context(), h.Plane)
	if principal == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}

	var req struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if !decodeJSON(w, r, &req) {
		return
	}

	identity, err := auth.LoadIdentityByEmail(r.Context(), h.DB, h.Plane, principal.Email)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load account"})
		return
	}
	if err := auth.VerifyIdentityPassword(identity, req.CurrentPassword); err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "incorrect password"})
		return
	}
	if err := auth.CheckPasswordPolicy(req.NewPassword, h.PasswordMinLength(r.Context())); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	if err := db.InTx(r.Context(), h.DB, func(tx *sql.Tx) error {
		if err := auth.SetPassword(r.Context(), tx, h.Plane, principal.SubjectID, req.NewPassword); err != nil {
			return err
		}
		// Other devices are signed out in case the change was prompted by a
		// compromise; the current session survives so the user is not ejected
		// from the page they just used.
		if _, err := auth.RevokeSessionsForSubject(r.Context(), tx, h.Plane,
			principal.SubjectID, principal.SessionID, "PASSWORD_CHANGE"); err != nil {
			return err
		}
		return audit.Write(r.Context(), tx, audit.Entry{
			ActorPlane: h.Plane.Name,
			ActorType:  h.Plane.AuditActorType,
			ActorID:    &principal.SubjectID,
			Action:     "auth.password.changed",
			TargetType: "account",
			TargetID:   &principal.SubjectID,
			IPAddress:  ClientIPString(r.Context()),
			UserAgent:  r.UserAgent(),
			RequestID:  RequestIDFromContext(r.Context()),
		})
	}); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to change password"})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
