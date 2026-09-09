package db

import (
	"context"
	"database/sql"
	"fmt"
)

// InTx runs fn inside a database transaction, rolling back on error or panic.
//
// Every state-changing auth/IAM operation goes through this: the spec requires
// an audit row to be written in the same transaction as the change it describes,
// so the two must commit or fail together.
func InTx(ctx context.Context, sqlDB *sql.DB, fn func(tx *sql.Tx) error) error {
	tx, err := sqlDB.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}
	return nil
}
