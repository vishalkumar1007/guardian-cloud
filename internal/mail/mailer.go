// Package mail sends the transactional messages authentication depends on:
// email verification, password reset, one-time codes and staff invitations.
//
// Built on stdlib net/smtp. Local development points at Mailpit, which needs no
// authentication and captures everything at http://127.0.0.1:8026, so nothing
// ever escapes a developer machine.
package mail

import (
	"fmt"
	"log"
	"net"
	"net/smtp"
	"strings"
)

// Mailer delivers messages over SMTP.
type Mailer struct {
	host string
	port string
	from string
	auth smtp.Auth
}

// New builds a Mailer. Credentials are optional: Mailpit accepts anonymous
// submission, and requiring them would make local development harder for no gain.
func New(host, port, from, username, password string) *Mailer {
	var auth smtp.Auth
	if username != "" {
		auth = smtp.PlainAuth("", username, password, host)
	}
	return &Mailer{host: host, port: port, from: from, auth: auth}
}

// Send delivers a plain-text message.
//
// Errors are returned, but auth handlers deliberately do not fail a request on
// them: a signup whose verification mail bounces should still create the
// account, with a resend available, rather than losing the registration.
func (m *Mailer) Send(to, subject, body string) error {
	if m == nil || m.host == "" {
		return fmt.Errorf("mailer is not configured")
	}

	message := buildMessage(m.from, to, subject, body)
	addr := net.JoinHostPort(m.host, m.port)
	if err := smtp.SendMail(addr, m.auth, senderAddress(m.from), []string{to}, message); err != nil {
		return fmt.Errorf("send mail to %s: %w", to, err)
	}
	return nil
}

// SendAsync delivers in the background and logs failures.
//
// Used where the message is a side effect of a request the user is waiting on —
// SMTP latency should not be added to a login.
func (m *Mailer) SendAsync(to, subject, body string) {
	go func() {
		if err := m.Send(to, subject, body); err != nil {
			log.Printf("mail: %v", err)
		}
	}()
}

func buildMessage(from, to, subject, body string) []byte {
	// Strip CR and LF from the header values: an address or subject carrying a
	// newline could otherwise inject extra headers or a second message body.
	var sb strings.Builder
	sb.WriteString("From: " + sanitizeHeader(from) + "\r\n")
	sb.WriteString("To: " + sanitizeHeader(to) + "\r\n")
	sb.WriteString("Subject: " + sanitizeHeader(subject) + "\r\n")
	sb.WriteString("MIME-Version: 1.0\r\n")
	sb.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	sb.WriteString("\r\n")
	sb.WriteString(body)
	return []byte(sb.String())
}

func sanitizeHeader(value string) string {
	return strings.NewReplacer("\r", "", "\n", "").Replace(value)
}

// senderAddress extracts the bare address from a "Name <addr>" From value, which
// is what the SMTP envelope requires.
func senderAddress(from string) string {
	if start := strings.LastIndex(from, "<"); start >= 0 {
		if end := strings.LastIndex(from, ">"); end > start {
			return from[start+1 : end]
		}
	}
	return strings.TrimSpace(from)
}
