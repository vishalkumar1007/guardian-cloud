package api

import (
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"time"

	"guardian-cloud/internal/audit"
	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/db"
	"guardian-cloud/internal/mfa"
)

// AuthHandler serves the login surface for one identity plane. The same
// implementation backs /api/v1/auth (customers) and /api/v1/admin/auth (staff);
// only the Plane differs.
type AuthHandler struct {
	*Env
	Plane auth.Plane
}

// maxBodyBytes caps request bodies on unauthenticated endpoints, so an
// anonymous caller cannot make the server read an unbounded amount.
const maxBodyBytes = 64 * 1024

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type mfaRequest struct {
	Code   string `json:"code"`
	Method string `json:"method"`
}

// Login verifies a password and decides what has to happen next.
//
// The three success shapes are distinguished by "status": authenticated,
// mfa_required, or mfa_enrollment_required. A session cookie is set only for the
// first — a correct password alone is never a session when MFA applies.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	ctx := r.Context()
	email := auth.NormalizeEmail(req.Email)
	clientIP := ClientIPString(ctx)
	userAgent := r.UserAgent()
	requestID := RequestIDFromContext(ctx)

	if email == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "email and password are required"})
		return
	}

	// Refuse before touching credentials, so a locked-out attacker learns
	// nothing further about the account.
	if err := auth.CheckLockout(ctx, h.DB, h.Plane, email, clientIP); err != nil {
		var locked *auth.LockedError
		if errors.As(err, &locked) {
			h.recordAttempt(r, email, "", "LOCKED")
			writeJSON(w, http.StatusLocked, map[string]any{
				"error":               "too many failed attempts, try again later",
				"retry_after_seconds": locked.RetryAfterSeconds,
			})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to check account status"})
		return
	}

	identity, err := auth.LoadIdentityByEmail(ctx, h.DB, h.Plane, email)
	if err != nil && !errors.Is(err, auth.ErrUnknownAccount) {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load account"})
		return
	}

	// VerifyIdentityPassword hashes against a dummy when identity is nil, so an
	// unknown address costs the same time as a wrong password. The response
	// below is byte-identical in both cases.
	if verifyErr := auth.VerifyIdentityPassword(identity, req.Password); verifyErr != nil {
		outcome := "INVALID_CREDENTIALS"
		subjectID := ""
		if identity == nil {
			outcome = "UNKNOWN_ACCOUNT"
		} else {
			subjectID = identity.ID
		}

		_ = db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
			if err := auth.RecordFailure(ctx, tx, h.Plane, h.LockoutPolicy(ctx), email, clientIP); err != nil {
				return err
			}
			return auth.RecordAttempt(ctx, tx, h.Plane, email, subjectID, outcome, clientIP, userAgent, requestID)
		})

		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid email or password"})
		return
	}

	if err := auth.CheckAccountStatus(identity); err != nil {
		h.recordAttempt(r, email, identity.ID, "ACCOUNT_DISABLED")
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "this account is not permitted to sign in"})
		return
	}

	methods, err := auth.ListMFAMethods(ctx, h.DB, h.Plane, identity.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load authentication methods"})
		return
	}

	switch auth.DecideMFA(identity, methods, h.RequiresMFA(ctx, h.Plane)) {
	case auth.DecisionMFARequired:
		h.startChallenge(w, r, identity, methods, mfa.PurposeLogin)
	case auth.DecisionMFAEnrollmentRequired:
		h.startChallenge(w, r, identity, nil, mfa.PurposeEnrollment)
	default:
		h.completeLogin(w, r, identity, "PASSWORD", false)
	}
}

// startChallenge issues the half-authenticated state.
//
// The challenge lives in its own table behind its own short-lived cookie, never
// as a flag on a session row: nothing that reads sessions can mistake it for an
// authenticated caller.
func (h *AuthHandler) startChallenge(w http.ResponseWriter, r *http.Request, identity *auth.Identity, methods []auth.MFAMethod, purpose string) {
	ctx := r.Context()

	// An emailed code is prepared when that is the only way in, so someone whose
	// authenticator is unavailable is not stranded.
	emailCode := ""
	emailCodeRef := ""
	if purpose == mfa.PurposeLogin && !hasTOTP(methods) {
		code, sealed, err := h.newSealedEmailCode(identity.ID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to prepare verification code"})
			return
		}
		emailCode, emailCodeRef = code, sealed
	}

	var token string
	err := db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		var err error
		token, _, err = mfa.IssueChallenge(ctx, tx, h.Plane.Name, identity.ID, purpose,
			emailCodeRef, ClientIPString(ctx), r.UserAgent())
		if err != nil {
			return err
		}
		return auth.RecordAttempt(ctx, tx, h.Plane, identity.Email, identity.ID, "MFA_REQUIRED",
			ClientIPString(ctx), r.UserAgent(), RequestIDFromContext(ctx))
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to start verification"})
		return
	}

	if emailCode != "" {
		subject, body := mailEmailOTP(emailCode)
		h.Mailer.SendAsync(identity.Email, subject, body)
	}

	auth.SetChallengeCookie(w, h.Plane, h.CookieConfig(), token)

	if purpose == mfa.PurposeEnrollment {
		writeJSON(w, http.StatusOK, map[string]any{
			"status":  string(auth.DecisionMFAEnrollmentRequired),
			"message": "two-factor authentication is required before you can sign in",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":  string(auth.DecisionMFARequired),
		"methods": availableMethodTypes(methods, emailCode != ""),
	})
}

// VerifyMFA completes a challenge and, on success, issues the session.
func (h *AuthHandler) VerifyMFA(w http.ResponseWriter, r *http.Request) {
	var req mfaRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	ctx := r.Context()
	token := auth.ReadCookie(r, h.Plane.ChallengeCookie)

	challenge, err := mfa.LoadChallenge(ctx, h.DB, h.Plane.Name, token)
	if err != nil {
		auth.ClearChallengeCookie(w, h.Plane, h.CookieConfig())
		status := http.StatusGone
		if errors.Is(err, mfa.ErrTooManyAttempts) {
			status = http.StatusLocked
		}
		writeJSON(w, status, map[string]string{"error": "this verification has expired, please sign in again"})
		return
	}

	identity, err := auth.LoadIdentityByID(ctx, h.DB, h.Plane, challenge.SubjectID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load account"})
		return
	}

	// Counted before verification, so abandoning a request mid-flight still
	// costs an attempt and the counter cannot be sidestepped.
	if err := db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		return mfa.RecordChallengeAttempt(ctx, tx, challenge.ID)
	}); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to record attempt"})
		return
	}

	authMethod, ok, err := h.verifyChallengeCode(r, challenge, identity, req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to verify code"})
		return
	}
	if !ok {
		h.recordAttempt(r, identity.Email, identity.ID, "MFA_FAILED")
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "that code is not valid"})
		return
	}

	if err := db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		return mfa.ConsumeChallenge(ctx, tx, challenge.ID)
	}); err != nil {
		// Losing the race means the challenge was already spent, which is a
		// replay rather than a server fault.
		auth.ClearChallengeCookie(w, h.Plane, h.CookieConfig())
		writeJSON(w, http.StatusGone, map[string]string{"error": "this verification has already been used"})
		return
	}

	auth.ClearChallengeCookie(w, h.Plane, h.CookieConfig())
	h.completeLogin(w, r, identity, authMethod, true)
}

// verifyChallengeCode checks the supplied code against whichever factor the
// caller chose. Returns the auth method recorded on the resulting session.
func (h *AuthHandler) verifyChallengeCode(r *http.Request, challenge *mfa.Challenge, identity *auth.Identity, req mfaRequest) (string, bool, error) {
	ctx := r.Context()

	switch req.Method {
	case "RECOVERY_CODE":
		var used bool
		err := db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
			var err error
			used, err = mfa.ConsumeRecoveryCode(ctx, tx, h.Plane.Name, identity.ID, req.Code)
			return err
		})
		return "RECOVERY_CODE", used, err

	case "EMAIL":
		if challenge.EmailCodeRef == "" {
			return "PASSWORD", false, nil
		}
		expected, err := h.Sealer.Open(challenge.EmailCodeRef, "mfa-challenge:"+identity.ID)
		if err != nil {
			return "PASSWORD", false, err
		}
		return "PASSWORD", constantTimeEqual(expected, req.Code), nil

	default:
		// TOTP, and the default when the client does not say.
		methods, err := auth.ListMFAMethods(ctx, h.DB, h.Plane, identity.ID)
		if err != nil {
			return "PASSWORD", false, err
		}
		for _, method := range methods {
			if method.MethodType != "TOTP" {
				continue
			}
			secret, err := h.Sealer.Open(method.SecretRef, "mfa:"+method.ID)
			if err != nil {
				continue // a secret sealed under a rotated key; try the others
			}
			if mfa.Validate(secret, req.Code, time.Now()) {
				_ = db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
					return auth.TouchMFAMethod(ctx, tx, h.Plane, method.ID)
				})
				return "PASSWORD", true, nil
			}
		}
		return "PASSWORD", false, nil
	}
}

// completeLogin issues the session and records the successful sign-in.
//
// Everything here happens in one transaction: the session, the cleared lockout
// counters, the attempt record and the audit row commit together or not at all.
func (h *AuthHandler) completeLogin(w http.ResponseWriter, r *http.Request, identity *auth.Identity, authMethod string, mfaSatisfied bool) {
	ctx := r.Context()
	clientIP := ClientIPString(ctx)
	userAgent := r.UserAgent()

	var session *auth.IssuedSession
	err := db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		var err error
		session, err = auth.IssueSession(ctx, tx, h.Plane, h.SessionPolicy(ctx), auth.IssueOptions{
			SubjectID:    identity.ID,
			IPAddress:    clientIP,
			UserAgent:    userAgent,
			AuthMethod:   authMethod,
			MFASatisfied: mfaSatisfied,
		})
		if err != nil {
			return err
		}
		if err := auth.ClearFailures(ctx, tx, h.Plane, identity.Email, clientIP); err != nil {
			return err
		}
		if err := auth.TouchCredential(ctx, tx, h.Plane, identity.CredentialID); err != nil {
			return err
		}
		if err := auth.RecordLogin(ctx, tx, h.Plane, identity.ID); err != nil {
			return err
		}
		if err := auth.RecordAttempt(ctx, tx, h.Plane, identity.Email, identity.ID, "SUCCESS",
			clientIP, userAgent, RequestIDFromContext(ctx)); err != nil {
			return err
		}
		return audit.Write(ctx, tx, audit.Entry{
			ActorPlane: h.Plane.Name,
			ActorType:  h.Plane.AuditActorType,
			ActorID:    &identity.ID,
			Action:     "auth.login",
			TargetType: "session",
			TargetID:   &session.SessionID,
			Metadata:   map[string]any{"auth_method": authMethod, "mfa": mfaSatisfied},
			IPAddress:  clientIP,
			UserAgent:  userAgent,
			RequestID:  RequestIDFromContext(ctx),
		})
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to establish session"})
		return
	}

	auth.SetSessionCookies(w, h.Plane, h.CookieConfig(), session)
	writeJSON(w, http.StatusOK, map[string]any{
		"status":     string(auth.DecisionAuthenticated),
		"user":       identityResponse(identity),
		"csrf_token": session.CSRFToken,
		"session": map[string]any{
			"expires_at": session.ExpiresAt.Format(time.RFC3339),
		},
	})
}

// Logout revokes the current session.
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if principal := auth.PrincipalForPlane(ctx, h.Plane); principal != nil {
		_ = db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
			if err := auth.RevokeSession(ctx, tx, h.Plane, principal.SessionID, "LOGOUT"); err != nil {
				return err
			}
			return audit.Write(ctx, tx, audit.Entry{
				ActorPlane: h.Plane.Name,
				ActorType:  h.Plane.AuditActorType,
				ActorID:    &principal.SubjectID,
				Action:     "auth.logout",
				TargetType: "session",
				TargetID:   &principal.SessionID,
				IPAddress:  ClientIPString(ctx),
				UserAgent:  r.UserAgent(),
				RequestID:  RequestIDFromContext(ctx),
			})
		})
	}

	// Cookies are cleared regardless, so a stale or already-revoked token does
	// not leave the browser retrying it forever.
	auth.ClearSessionCookies(w, h.Plane, h.CookieConfig())
	auth.ClearChallengeCookie(w, h.Plane, h.CookieConfig())
	w.WriteHeader(http.StatusNoContent)
}

// Me describes the current caller. The frontend drives menu visibility from the
// permissions list, so this is the only place it needs to ask.
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	principal := auth.PrincipalForPlane(r.Context(), h.Plane)
	if principal == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}

	methods, err := auth.ListMFAMethods(r.Context(), h.DB, h.Plane, principal.SubjectID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load account"})
		return
	}

	response := map[string]any{
		"id":           principal.SubjectID,
		"email":        principal.Email,
		"display_name": principal.Name,
		"mfa_enabled":  len(methods) > 0,
		"session": map[string]any{
			"issued_at":   principal.IssuedAt.Format(time.RFC3339),
			"expires_at":  principal.ExpiresAt.Format(time.RFC3339),
			"auth_method": principal.AuthMethod,
		},
	}
	if !principal.IdleExpiresAt.IsZero() {
		response["session"].(map[string]any)["idle_expires_at"] = principal.IdleExpiresAt.Format(time.RFC3339)
	}

	if h.Plane.IsAdmin() {
		roles, err := h.adminRoles(r.Context(), principal.SubjectID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load roles"})
			return
		}
		response["roles"] = roles
		response["permissions"] = principal.PermissionList()
	} else {
		response["active_tenant_id"] = principal.ActiveTenantID
	}

	writeJSON(w, http.StatusOK, response)
}

// CSRF hands the frontend a token for a session that already exists, for the
// case where the page is reloaded and the in-memory copy is gone.
func (h *AuthHandler) CSRF(w http.ResponseWriter, r *http.Request) {
	principal := auth.PrincipalForPlane(r.Context(), h.Plane)
	if principal == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	// Only the digest is stored, so the existing token cannot be recovered — a
	// fresh one is minted and bound to the session instead.
	token, err := h.rotateCSRF(r, h.Plane, principal)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to issue csrf token"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"csrf_token": token})
}

func (h *AuthHandler) recordAttempt(r *http.Request, email, subjectID, outcome string) {
	ctx := r.Context()
	_ = db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		return auth.RecordAttempt(ctx, tx, h.Plane, email, subjectID, outcome,
			ClientIPString(ctx), r.UserAgent(), RequestIDFromContext(ctx))
	})
}

func hasTOTP(methods []auth.MFAMethod) bool {
	for _, m := range methods {
		if m.MethodType == "TOTP" {
			return true
		}
	}
	return false
}

func availableMethodTypes(methods []auth.MFAMethod, emailSent bool) []string {
	seen := map[string]bool{}
	var out []string
	for _, m := range methods {
		if !seen[m.MethodType] {
			seen[m.MethodType] = true
			out = append(out, m.MethodType)
		}
	}
	if emailSent && !seen["EMAIL"] {
		out = append(out, "EMAIL")
	}
	if out == nil {
		out = []string{}
	}
	return out
}

func identityResponse(identity *auth.Identity) map[string]any {
	return map[string]any{
		"id":             identity.ID,
		"email":          identity.Email,
		"display_name":   identity.Name,
		"email_verified": identity.EmailVerifiedAt != nil,
	}
}

// decodeJSON reads a bounded JSON body, writing a 400 and returning false when
// it cannot.
func decodeJSON(w http.ResponseWriter, r *http.Request, target any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	decoder := json.NewDecoder(r.Body)
	// Reject unknown fields so a typo in a client payload fails loudly instead
	// of silently doing something other than what was asked.
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(target); err != nil && err != io.EOF {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return false
	}
	return true
}
