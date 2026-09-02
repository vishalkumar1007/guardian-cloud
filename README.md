# Guardian Cloud

Personal + Organization endpoint security platform — cloud control plane.

This repo is the Phase 1 F1.0 foundation: Go API, PostgreSQL migrations (DBD),
Docker Compose dependencies, and the Personal Portal **Watchline** UI — plus
public home, org/super shells, and platform theme control.

## Stack

- Go API (`cmd/server`) + goose migrations
- PostgreSQL 16 + Redis 7
- Vite + React + TypeScript + Tailwind (Personal Portal)

## Quick start

See [SETUP.md](./SETUP.md).

## Phase alignment

| Area | Status |
|------|--------|
| F1.0 Infra + healthz + migrations | This build |
| F1.3 Dashboard shell (Watchline) | This build (full UI mock) |
| Platform theme GET/PUT | This build (`/super/appearance`) |
| F1.1 Auth APIs | Next |
| Agent / events pipeline | Later Phase 1 |

Plan references: `../Development-Plan/01-Phase-1-Basic-Personal-Subscription.md`,
`../Plan/Guardian-DBD.md`.
