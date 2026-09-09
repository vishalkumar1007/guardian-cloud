package auth

import "errors"

// Sentinel errors for every way authentication can be refused.
//
// Callers map these to status codes. Two of them — ErrInvalidCredentials and
// ErrUnknownAccount — must produce byte-identical responses, or the difference
// enumerates which email addresses have accounts.
var (
	// ErrUnknownAccount and ErrInvalidCredentials are distinct internally so the
	// login_attempts record is accurate, and identical to the client.
	ErrUnknownAccount     = errors.New("auth: account not found")
	ErrInvalidCredentials = errors.New("auth: invalid credentials")

	ErrAccountDisabled  = errors.New("auth: account is disabled")
	ErrAccountSuspended = errors.New("auth: account is suspended")

	ErrLockedOut = errors.New("auth: too many failed attempts")
	ErrIPDenied  = errors.New("auth: source address not permitted")

	// ErrMFARequired means a challenge was issued; the caller must complete it.
	ErrMFARequired = errors.New("auth: mfa challenge required")
	// ErrMFAEnrollmentRequired means policy demands MFA but nothing is enrolled.
	ErrMFAEnrollmentRequired = errors.New("auth: mfa enrollment required")
	ErrMFAInvalidCode        = errors.New("auth: invalid verification code")
	ErrChallengeExpired      = errors.New("auth: challenge expired or already used")

	ErrNoSession      = errors.New("auth: no session")
	ErrSessionExpired = errors.New("auth: session expired")
	ErrSessionIdle    = errors.New("auth: session idle timeout")

	ErrWeakPassword       = errors.New("auth: password does not meet policy")
	ErrPasswordCommon     = errors.New("auth: password is too common")
	ErrCredentialNotFound = errors.New("auth: no password credential")
)

// LockedError carries how long the caller must wait, so the client can render a
// countdown instead of a bare rejection.
type LockedError struct {
	RetryAfterSeconds int
}

func (e *LockedError) Error() string { return ErrLockedOut.Error() }
func (e *LockedError) Unwrap() error { return ErrLockedOut }
