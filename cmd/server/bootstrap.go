package main

import (
	"context"
	"database/sql"
	"errors"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"syscall"

	"golang.org/x/term"

	"guardian-cloud/internal/auth"
	"guardian-cloud/internal/db"
)

// runBootstrapAdmin creates or repairs the first Guardian staff account.
//
// This exists so no default password ever ships in a migration. The seeded
// superadmin row has no credential until someone with shell access to the
// deployment runs this, which means an unbootstrapped install has no way in
// rather than a well-known way in.
func runBootstrapAdmin(args []string) {
	flags := flag.NewFlagSet("bootstrap-admin", flag.ExitOnError)
	email := flags.String("email", "superadmin@guardian.local", "staff email address")
	name := flags.String("name", "", "display name (only used when creating)")
	role := flags.String("role", "SUPER_ADMIN", "role key to grant")
	password := flags.String("password", "", "password; omit to be prompted (preferred — a flag lands in shell history)")
	_ = flags.Parse(args)

	cfg := mustConfig()
	sqlDB, err := db.Open(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer sqlDB.Close()

	secret := *password
	if secret == "" {
		secret = promptPassword()
	}

	if err := auth.CheckPasswordPolicy(secret, auth.DefaultPasswordMinLength); err != nil {
		log.Fatalf("password rejected: %v", err)
	}

	ctx := context.Background()
	normalized := auth.NormalizeEmail(*email)

	err = db.InTx(ctx, sqlDB, func(tx *sql.Tx) error {
		adminID, created, err := ensureAdminUser(ctx, tx, normalized, *name)
		if err != nil {
			return err
		}
		if err := auth.SetPassword(ctx, tx, auth.AdminPlane, adminID, secret); err != nil {
			return err
		}
		if err := grantRole(ctx, tx, adminID, *role); err != nil {
			return err
		}
		// Bootstrapping from the shell is an alternative to the browser setup
		// screen, so it closes that screen too — otherwise a deployment
		// bootstrapped this way would still offer unauthenticated super-admin
		// creation to anyone who reached the login page first.
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO platform_settings (key, value, updated_at)
			VALUES ('setupCompleted', 'true'::jsonb, now())
			ON CONFLICT (key) DO UPDATE SET value = 'true'::jsonb, updated_at = now()
		`); err != nil {
			return fmt.Errorf("mark setup complete: %w", err)
		}

		cleared, err := clearMFARequirementIfUnenrolled(ctx, tx, adminID)
		if err != nil {
			return err
		}
		if cleared {
			log.Printf("no second factor enrolled: MFA requirement lifted for this account so it can sign in")
		}
		if created {
			log.Printf("created staff account %s", normalized)
		} else {
			log.Printf("reset password for existing staff account %s", normalized)
		}
		return nil
	})
	if err != nil {
		log.Fatalf("bootstrap failed: %v", err)
	}

	log.Printf("granted role %s. Sign in at %s/super/login", *role, cfg.PublicWebURL)
	log.Printf("two-factor authentication is optional; enable requireMfaAdmin to enforce it for all staff.")
}

func ensureAdminUser(ctx context.Context, tx *sql.Tx, email, name string) (id string, created bool, err error) {
	err = tx.QueryRowContext(ctx,
		`SELECT id::text FROM guardian_admin_users WHERE email = $1 AND deleted_at IS NULL`, email,
	).Scan(&id)
	if err == nil {
		// Re-activate: bootstrap is also the recovery path for a locked-out
		// deployment, so a suspended account must come back usable.
		if _, err := tx.ExecContext(ctx,
			`UPDATE guardian_admin_users SET status = 'ACTIVE', updated_at = now() WHERE id = $1`, id,
		); err != nil {
			return "", false, fmt.Errorf("reactivate staff account: %w", err)
		}
		return id, false, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return "", false, fmt.Errorf("look up staff account: %w", err)
	}

	displayName := name
	if displayName == "" {
		displayName = "Guardian Administrator"
	}
	if err := tx.QueryRowContext(ctx, `
		INSERT INTO guardian_admin_users (email, display_name, email_verified_at, status)
		VALUES ($1, $2, now(), 'ACTIVE')
		RETURNING id::text
	`, email, displayName).Scan(&id); err != nil {
		return "", false, fmt.Errorf("create staff account: %w", err)
	}
	return id, true, nil
}

// clearMFARequirementIfUnenrolled lets a freshly bootstrapped account sign in.
//
// Older deployments may still have mfa_required=true on accounts with nothing
// enrolled. Lift the flag only when no verified factor exists so bootstrap
// recovery does not silently strip MFA from a protected account.
func clearMFARequirementIfUnenrolled(ctx context.Context, tx *sql.Tx, adminID string) (bool, error) {
	var enrolled int
	if err := tx.QueryRowContext(ctx, `
		SELECT count(*) FROM guardian_admin_mfa_methods
		WHERE admin_user_id = $1 AND revoked_at IS NULL AND verified_at IS NOT NULL
	`, adminID).Scan(&enrolled); err != nil {
		return false, fmt.Errorf("count mfa methods: %w", err)
	}
	if enrolled > 0 {
		return false, nil
	}

	if _, err := tx.ExecContext(ctx,
		`UPDATE guardian_admin_users SET mfa_required = false WHERE id = $1`, adminID,
	); err != nil {
		return false, fmt.Errorf("clear mfa requirement: %w", err)
	}
	return true, nil
}

func grantRole(ctx context.Context, tx *sql.Tx, adminID, roleKey string) error {
	var roleID string
	if err := tx.QueryRowContext(ctx,
		`SELECT id::text FROM guardian_roles WHERE role_key = $1`, roleKey,
	).Scan(&roleID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("unknown role %q", roleKey)
		}
		return fmt.Errorf("look up role: %w", err)
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO guardian_admin_roles (admin_user_id, role_id)
		VALUES ($1, $2)
		ON CONFLICT (admin_user_id, role_id) WHERE revoked_at IS NULL DO NOTHING
	`, adminID, roleID); err != nil {
		return fmt.Errorf("grant role: %w", err)
	}
	return nil
}

// promptPassword reads a password without echoing it, so it does not end up on
// screen or in shell history.
func promptPassword() string {
	fmt.Fprint(os.Stderr, "New password: ")
	first, err := term.ReadPassword(int(syscall.Stdin))
	fmt.Fprintln(os.Stderr)
	if err != nil {
		log.Fatalf("read password: %v", err)
	}

	fmt.Fprint(os.Stderr, "Confirm password: ")
	second, err := term.ReadPassword(int(syscall.Stdin))
	fmt.Fprintln(os.Stderr)
	if err != nil {
		log.Fatalf("read password: %v", err)
	}

	if strings.TrimSpace(string(first)) != strings.TrimSpace(string(second)) {
		log.Fatal("passwords do not match")
	}
	return string(first)
}
