package mail

import "fmt"

// Message templates.
//
// Plain text, built with fmt rather than html/template: these are short, have no
// user-controlled markup, and a template engine would add a failure mode to a
// path that must not fail.
//
// None of them state whether an account exists — the reset mail is only sent
// when it does, and the API answers identically either way.

// EmailOTP is the fallback second factor.
func EmailOTP(code string, validMinutes int) (subject, body string) {
	return "Your Guardian verification code",
		fmt.Sprintf(`Your Guardian verification code is:

    %s

It expires in %d minutes and can be used once.

If you did not try to sign in, someone may have your password. Change it now.
`, code, validMinutes)
}

// VerifyEmail confirms ownership of a new address.
func VerifyEmail(link string) (subject, body string) {
	return "Verify your Guardian email address",
		fmt.Sprintf(`Welcome to Guardian.

Confirm your email address to finish setting up your account:

    %s

This link expires in 24 hours.

If you did not create a Guardian account, ignore this message.
`, link)
}

// SignupAttemptOnExistingAccount goes to the real owner when someone tries to
// register an address that already has an account.
//
// Signup answers identically either way, so this mail is what makes the
// difference visible to the one person entitled to know — and it doubles as a
// warning if the attempt was not theirs.
func SignupAttemptOnExistingAccount() (subject, body string) {
	return "Someone tried to sign up with your Guardian email",
		`Someone just tried to create a Guardian account with this email address,
but you already have one.

If this was you, sign in instead — or reset your password if you've forgotten it.

If it wasn't you, no action is needed. Your account has not changed and no new
account was created.
`
}

// PasswordReset starts the recovery flow.
func PasswordReset(link string) (subject, body string) {
	return "Reset your Guardian password",
		fmt.Sprintf(`Someone asked to reset the password for this Guardian account.

Choose a new password:

    %s

This link expires in 1 hour and can be used once. Resetting your password signs
you out everywhere.

If this was not you, ignore this message — your password has not changed.
`, link)
}

// AdminInvitation invites a member of Guardian staff.
func AdminInvitation(inviterName, link string, validDays int) (subject, body string) {
	inviter := inviterName
	if inviter == "" {
		inviter = "A Guardian administrator"
	}
	return "You have been invited to the Guardian admin console",
		fmt.Sprintf(`%s has invited you to the Guardian platform admin console.

Accept the invitation and set your password:

    %s

This invitation expires in %d days and can be used once. You will be asked to
set up two-factor authentication before you can sign in.

If you were not expecting this, tell your security team.
`, inviter, link, validDays)
}

// NewSessionAlert warns about a sign-in from an unfamiliar place. Notification,
// not a challenge: it tells someone their account was used, so they can act.
func NewSessionAlert(ipAddress, userAgent string) (subject, body string) {
	return "New sign-in to your Guardian account",
		fmt.Sprintf(`Your Guardian account was signed in to.

    IP address: %s
    Device:     %s

If this was you, nothing to do. If not, change your password and sign out all
sessions from your account security settings immediately.
`, ipAddress, userAgent)
}
