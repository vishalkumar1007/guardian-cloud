package main

import (
	"context"
	"database/sql"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"guardian-cloud/internal/api"
	"guardian-cloud/internal/config"
	"guardian-cloud/internal/crypto"
	"guardian-cloud/internal/db"
	"guardian-cloud/internal/mail"
	"guardian-cloud/migrations"
)

func main() {
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "migrate":
			runMigrate()
			return
		case "bootstrap-admin":
			runBootstrapAdmin(os.Args[2:])
			return
		}
	}
	runServe()
}

func mustConfig() *config.Config {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}
	return cfg
}

func runMigrate() {
	cfg := mustConfig()
	sqlDB, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("opening db for migrations: %v", err)
	}
	defer sqlDB.Close()

	goose.SetBaseFS(migrations.FS)
	if err := goose.SetDialect("postgres"); err != nil {
		log.Fatalf("goose dialect: %v", err)
	}
	if err := goose.Up(sqlDB, "."); err != nil {
		log.Fatalf("running migrations: %v", err)
	}
	log.Println("migrations complete")
}

func runServe() {
	cfg := mustConfig()

	sqlDB, err := db.Open(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer sqlDB.Close()

	// Apply migrations on boot for local/dev convenience.
	goose.SetBaseFS(migrations.FS)
	if err := goose.SetDialect("postgres"); err != nil {
		log.Fatalf("goose dialect: %v", err)
	}
	if err := goose.Up(sqlDB, "."); err != nil {
		log.Fatalf("running migrations: %v", err)
	}

	// Built at boot so a bad encryption key fails immediately rather than at the
	// first MFA enrolment, when someone is mid-flow.
	sealer, err := crypto.NewSealer(cfg.SecretEncryptionKey)
	if err != nil {
		log.Fatalf("secret encryption key: %v", err)
	}

	mailer := mail.New(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPFrom, cfg.SMTPUser, cfg.SMTPPass)

	srv := &http.Server{
		Addr: ":" + cfg.Port,
		Handler: api.NewRouter(api.RouterDeps{
			DB:     sqlDB,
			Config: cfg,
			Sealer: sealer,
			Mailer: mailer,
		}),
		ReadHeaderTimeout: 10 * time.Second,
	}

	// Bind before announcing. Logging first would report "listening" even when
	// the port is already taken, which turns a bind failure into a confusing
	// hunt for why requests are reaching some other process.
	listener, err := net.Listen("tcp", srv.Addr)
	if err != nil {
		log.Fatalf("listen on %s: %v", srv.Addr, err)
	}
	log.Printf("guardian-cloud listening on %s", srv.Addr)
	// The browser reports a rejected origin only as an opaque "failed to fetch",
	// so the allowlist is printed here — it is the first thing to check when the
	// frontend cannot talk to an API that is plainly running.
	log.Printf("cors: allowing origins %v", cfg.CORSAllowedOrigins)
	log.Printf("auth: legacy mode %q, cookies secure=%v", cfg.AuthLegacyMode, cfg.AuthCookieSecure)

	go func() {
		if err := srv.Serve(listener); err != nil && err != http.ErrServerClosed {
			log.Fatalf("serve: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
	log.Println("shutdown complete")
}
