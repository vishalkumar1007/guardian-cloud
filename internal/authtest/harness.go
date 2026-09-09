// Package authtest provides the integration harness for authentication tests.
//
// Tests here need a real PostgreSQL: the security properties being asserted —
// single-use tokens under concurrency, row locks, CHECK constraints, CIDR
// matching — live in the database, and a mock would assert nothing.
//
// Set TEST_DATABASE_URL to enable them. Without it every test skips, so
// `go test ./...` still passes on a machine with no Docker running.
package authtest

import (
	"database/sql"
	"fmt"
	"math/rand"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"guardian-cloud/migrations"
)

// Postgres returns a connection to a throwaway database with every migration
// applied, dropped when the test binary finishes.
//
// A whole database rather than a schema: migrations create extensions and rely
// on the default search path, and an isolated database keeps them honest without
// any per-connection setup.
func Postgres(t *testing.T) *sql.DB {
	t.Helper()

	baseURL := os.Getenv("TEST_DATABASE_URL")
	if baseURL == "" {
		t.Skip("TEST_DATABASE_URL is not set; skipping database-backed tests")
	}

	name := fmt.Sprintf("guardian_test_%d_%d", time.Now().UnixNano(), rand.Intn(10000))

	// Deliberately not closed here: the cleanup below still needs it to drop the
	// database, and t.Cleanup runs long after this function returns.
	admin, err := sql.Open("pgx", baseURL)
	if err != nil {
		t.Fatalf("connect for database creation: %v", err)
	}

	if _, err := admin.Exec(`CREATE DATABASE ` + quoteIdent(name)); err != nil {
		_ = admin.Close()
		t.Fatalf("create test database: %v", err)
	}

	testDB, err := sql.Open("pgx", replaceDatabase(t, baseURL, name))
	if err != nil {
		t.Fatalf("connect to test database: %v", err)
	}

	goose.SetBaseFS(migrations.FS)
	if err := goose.SetDialect("postgres"); err != nil {
		t.Fatalf("goose dialect: %v", err)
	}
	// Migrations are noisy and say nothing useful about a test failure.
	goose.SetLogger(goose.NopLogger())
	if err := goose.Up(testDB, "."); err != nil {
		t.Fatalf("apply migrations: %v", err)
	}

	t.Cleanup(func() {
		_ = testDB.Close()
		defer admin.Close()
		// Terminate stragglers first; DROP DATABASE fails while anything is
		// still connected, which would leak a database per failed run.
		_, _ = admin.Exec(
			`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`, name)
		if _, err := admin.Exec(`DROP DATABASE IF EXISTS ` + quoteIdent(name)); err != nil {
			t.Logf("could not drop test database %s: %v", name, err)
		}
	})

	return testDB
}

func replaceDatabase(t *testing.T, rawURL, database string) string {
	t.Helper()
	parsed, err := url.Parse(rawURL)
	if err != nil {
		t.Fatalf("parse TEST_DATABASE_URL: %v", err)
	}
	parsed.Path = "/" + database
	return parsed.String()
}

// quoteIdent quotes a generated identifier. The names here are built from a
// timestamp and a random number rather than from input, but CREATE DATABASE
// cannot take a placeholder, so quoting is not optional.
func quoteIdent(name string) string {
	return `"` + strings.ReplaceAll(name, `"`, `""`) + `"`
}
