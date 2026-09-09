package api

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"time"

	"guardian-cloud/internal/audit"
	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/crypto"
	"guardian-cloud/internal/db"
	"guardian-cloud/internal/mail"
)

// Customer account creation and recovery.
//
// Every response here is deliberately identical whether or not the address is
// already registered. Signup, password reset and verification resend are all
// classic account-enumeration oracles, and the product spec calls this out
// explicitly: "return a generic 'check your email' response on both the
// new-signup and already-registered paths".
//
// The consequence is that signup never issues a session — doing so on the new
// path but not the existing one would leak exactly what the generic body hides.
// New users go to sign-in with a "check your email" notice instead.

const (
	// personalOwnerRoleID is seeded by migration 00003.
	personalOwnerRoleID = "00000000-0000-4000-8000-000000000001"
	// personalBasicPlanID is seeded by migration 00006.
	personalBasicPlanID = "00000000-0000-4000-8000-000000000010"

	// trialDays matches the Phase 1 assumption: a 14-day trial starts at signup.
	trialDays = 14

	emailVerificationTTL = 24 * time.Hour
	passwordResetTTL     = time.Hour
)

type signupRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
}

// Signup creates a customer account, its personal tenant and a trial
// subscription in one transaction.
//
// The spec is emphatic that these are inseparable: "steps succeed together or
// the whole signup rolls back; no user is ever left without a tenant".
func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var req signupRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	ctx := r.Context()
	email := auth.NormalizeEmail(req.Email)

	if !auth.LooksLikeEmail(email) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "enter a valid email address"})
		return
	}
	// Password policy is enforced before the existence check, so a weak password
	// fails the same way for a new and an existing address.
	if err := auth.CheckPasswordPolicy(req.Password, h.PasswordMinLength(ctx)); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	verificationToken, err := h.createAccount(ctx, r, email, req.Password, req.DisplayName)
	if err != nil && !errors.Is(err, errEmailAlreadyRegistered) {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not create your account"})
		return
	}

	if errors.Is(err, errEmailAlreadyRegistered) {
		// Tell the real owner that someone tried to sign up as them, and say
		// nothing different to the caller.
		subject, body := mail.SignupAttemptOnExistingAccount()
		h.Mailer.SendAsync(email, subject, body)
	} else {
		link := fmt.Sprintf("%s/verify-email?token=%s", h.Config.PublicWebURL, verificationToken)
		subject, body := mail.VerifyEmail(link)
		h.Mailer.SendAsync(email, subject, body)
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"status":  "verification_sent",
		"message": "Check your email to confirm your address.",
	})
}

var errEmailAlreadyRegistered = errors.New("email already registered")

// createAccount performs the signup transaction, returning the raw verification
// token to email.
func (h *AuthHandler) createAccount(ctx context.Context, r *http.Request, email, password, displayName string) (string, error) {
	rawToken, tokenHash, err := crypto.NewOpaqueToken()
	if err != nil {
		return "", err
	}

	err = db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		var userID string
		err := tx.QueryRowContext(ctx, `
			INSERT INTO users (email, display_name)
			VALUES ($1, NULLIF($2,''))
			ON CONFLICT (email) DO NOTHING
			RETURNING id::text
		`, email, displayName).Scan(&userID)

		// No row back means the address is taken. Rolled back so the attempt
		// leaves no trace to probe.
		if errors.Is(err, sql.ErrNoRows) {
			return errEmailAlreadyRegistered
		}
		if err != nil {
			return fmt.Errorf("create user: %w", err)
		}

		if err := auth.SetPassword(ctx, tx, auth.CustomerPlane, userID, password); err != nil {
			return err
		}

		tenantName := displayName
		if tenantName == "" {
			tenantName = "Personal"
		}
		var tenantID string
		if err := tx.QueryRowContext(ctx, `
			INSERT INTO tenants (type, name, owner_user_id)
			VALUES ('PERSONAL', $1, $2)
			RETURNING id::text
		`, tenantName, userID).Scan(&tenantID); err != nil {
			return fmt.Errorf("create tenant: %w", err)
		}

		if _, err := tx.ExecContext(ctx, `
			INSERT INTO memberships (user_id, tenant_id, role_id)
			VALUES ($1, $2, $3)
		`, userID, tenantID, personalOwnerRoleID); err != nil {
			return fmt.Errorf("create membership: %w", err)
		}

		// The trial starts now; billing converts it before it lapses.
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO subscriptions
				(tenant_id, plan_id, status, seat_or_device_limit, current_period_start, current_period_end)
			SELECT $1, id, 'TRIALING', device_limit, now(), now() + $3::interval
			FROM plans WHERE id = $2
		`, tenantID, personalBasicPlanID, fmt.Sprintf("%d days", trialDays)); err != nil {
			return fmt.Errorf("create subscription: %w", err)
		}

		if _, err := tx.ExecContext(ctx, `
			INSERT INTO email_verification_tokens (plane, subject_id, token_hash, expires_at)
			VALUES ('customer', $1, $2, now() + $3::interval)
		`, userID, tokenHash, fmt.Sprintf("%d seconds", int(emailVerificationTTL.Seconds()))); err != nil {
			return fmt.Errorf("create verification token: %w", err)
		}

		return audit.Write(ctx, tx, audit.Entry{
			TenantID:   &tenantID,
			ActorPlane: audit.PlaneCustomer,
			ActorType:  audit.ActorUser,
			ActorID:    &userID,
			Action:     "ACCOUNT_CREATED",
			TargetType: "user",
			TargetID:   &userID,
			IPAddress:  ClientIPString(ctx),
			UserAgent:  r.UserAgent(),
			RequestID:  RequestIDFromContext(ctx),
		})
	})
	if err != nil {
		return "", err
	}
	return rawToken, nil
}

type tokenRequest struct {
	Token string `json:"token"`
}

// VerifyEmail consumes a verification token.
func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var req tokenRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	ctx := r.Context()

	err := db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		// Consuming and validating in one statement is what makes this
		// single-use under concurrency: a second request matches no row.
		var userID string
		err := tx.QueryRowContext(ctx, `
			UPDATE email_verification_tokens SET consumed_at = now()
			WHERE token_hash = $1 AND plane = $2
			  AND consumed_at IS NULL AND expires_at > now()
			RETURNING subject_id::text
		`, crypto.HashToken(req.Token), h.Plane.Name).Scan(&userID)

		if errors.Is(err, sql.ErrNoRows) {
			return errTokenNotUsable
		}
		if err != nil {
			return err
		}

		usersTable := h.Plane.UsersTable
		if _, err := tx.ExecContext(ctx, fmt.Sprintf(
			`UPDATE %s SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = $1`,
			usersTable), userID); err != nil {
			return err
		}

		return audit.Write(ctx, tx, audit.Entry{
			ActorPlane: h.Plane.Name,
			ActorType:  h.Plane.AuditActorType,
			ActorID:    &userID,
			Action:     "EMAIL_VERIFIED",
			TargetType: "user",
			TargetID:   &userID,
			IPAddress:  ClientIPString(ctx),
			UserAgent:  r.UserAgent(),
			RequestID:  RequestIDFromContext(ctx),
		})
	})

	if errors.Is(err, errTokenNotUsable) {
		// Expired, already used and never-valid are one answer: distinguishing
		// them would confirm that a token was once real.
		writeJSON(w, http.StatusGone, map[string]string{
			"error": "This confirmation link is no longer valid. Request a new one.",
		})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not verify your email"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"verified": true})
}

var errTokenNotUsable = errors.New("token expired, consumed, or unknown")

type emailRequest struct {
	Email string `json:"email"`
}

// ResendVerification issues a fresh confirmation link.
func (h *AuthHandler) ResendVerification(w http.ResponseWriter, r *http.Request) {
	var req emailRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	ctx := r.Context()
	email := auth.NormalizeEmail(req.Email)

	// Errors are swallowed on purpose: the response must not vary with whether
	// the address exists or is already verified.
	if identity, err := auth.LoadIdentityByEmail(ctx, h.DB, h.Plane, email); err == nil &&
		identity.EmailVerifiedAt == nil {
		rawToken, tokenHash, tokenErr := crypto.NewOpaqueToken()
		if tokenErr == nil {
			_ = db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
				_, err := tx.ExecContext(ctx, `
					INSERT INTO email_verification_tokens (plane, subject_id, token_hash, expires_at)
					VALUES ($1, $2, $3, now() + $4::interval)
				`, h.Plane.Name, identity.ID, tokenHash,
					fmt.Sprintf("%d seconds", int(emailVerificationTTL.Seconds())))
				return err
			})
			link := fmt.Sprintf("%s/verify-email?token=%s", h.Config.PublicWebURL, rawToken)
			subject, body := mail.VerifyEmail(link)
			h.Mailer.SendAsync(email, subject, body)
		}
	}

	writeJSON(w, http.StatusAccepted, map[string]any{
		"sent":    true,
		"message": "If that address needs confirming, we've sent a new link.",
	})
}

// ForgotPassword starts account recovery.
//
// Always 202, whatever the address. The spec states this directly: "always 200 —
// anti-enumeration, same reasoning as signup".
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req emailRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	ctx := r.Context()
	email := auth.NormalizeEmail(req.Email)

	if identity, err := auth.LoadIdentityByEmail(ctx, h.DB, h.Plane, email); err == nil {
		rawToken, tokenHash, tokenErr := crypto.NewOpaqueToken()
		if tokenErr == nil {
			_ = db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
				_, err := tx.ExecContext(ctx, `
					INSERT INTO password_reset_tokens (plane, subject_id, token_hash, expires_at, requested_ip)
					VALUES ($1, $2, $3, now() + $4::interval, NULLIF($5,'')::inet)
				`, h.Plane.Name, identity.ID, tokenHash,
					fmt.Sprintf("%d seconds", int(passwordResetTTL.Seconds())), ClientIPString(ctx))
				return err
			})
			link := fmt.Sprintf("%s%s?token=%s", h.Config.PublicWebURL, h.resetPath(), rawToken)
			subject, body := mail.PasswordReset(link)
			h.Mailer.SendAsync(email, subject, body)
		}
	}

	writeJSON(w, http.StatusAccepted, map[string]any{
		"sent":    true,
		"message": "If an account exists for that address, we've sent a reset link.",
	})
}

type resetPasswordRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

// ResetPassword completes recovery and signs the account out everywhere.
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req resetPasswordRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	ctx := r.Context()

	if err := auth.CheckPasswordPolicy(req.Password, h.PasswordMinLength(ctx)); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	err := db.InTx(ctx, h.DB, func(tx *sql.Tx) error {
		var subjectID string
		err := tx.QueryRowContext(ctx, `
			UPDATE password_reset_tokens SET consumed_at = now()
			WHERE token_hash = $1 AND plane = $2
			  AND consumed_at IS NULL AND expires_at > now()
			RETURNING subject_id::text
		`, crypto.HashToken(req.Token), h.Plane.Name).Scan(&subjectID)

		if errors.Is(err, sql.ErrNoRows) {
			return errTokenNotUsable
		}
		if err != nil {
			return err
		}

		if err := auth.SetPassword(ctx, tx, h.Plane, subjectID, req.Password); err != nil {
			return err
		}

		// Every session goes, including the current one. A reset is often
		// triggered *because* the account is compromised, so leaving the
		// attacker's session alive would defeat the point.
		if _, err := auth.RevokeSessionsForSubject(ctx, tx, h.Plane, subjectID, "", "PASSWORD_CHANGE"); err != nil {
			return err
		}

		// Any other outstanding reset links are dead too.
		if _, err := tx.ExecContext(ctx, `
			UPDATE password_reset_tokens SET consumed_at = now()
			WHERE plane = $1 AND subject_id = $2 AND consumed_at IS NULL
		`, h.Plane.Name, subjectID); err != nil {
			return err
		}

		return audit.Write(ctx, tx, audit.Entry{
			ActorPlane: h.Plane.Name,
			ActorType:  h.Plane.AuditActorType,
			ActorID:    &subjectID,
			Action:     "PASSWORD_RESET_COMPLETED",
			TargetType: "user",
			TargetID:   &subjectID,
			IPAddress:  ClientIPString(ctx),
			UserAgent:  r.UserAgent(),
			RequestID:  RequestIDFromContext(ctx),
		})
	})

	if errors.Is(err, errTokenNotUsable) {
		writeJSON(w, http.StatusGone, map[string]string{
			"error": "This reset link is no longer valid. Request a new one.",
		})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not reset your password"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"reset": true})
}

// resetPath is where the emailed reset link lands, which differs per plane.
func (h *AuthHandler) resetPath() string {
	if h.Plane.IsAdmin() {
		return "/super/reset-password"
	}
	return "/reset-password"
}
