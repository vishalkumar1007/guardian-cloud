# Guardian Cloud — Setup

## Ports (no conflict with Avanor / Orbit)

| Service  | Host → Container |
|----------|------------------|
| Postgres | `127.0.0.1:5434` → `5432` |
| Redis    | `127.0.0.1:6381` → `6379` |
| API      | `127.0.0.1:8083` → `8083` (Compose `api` service) |
| Web      | `127.0.0.1:5175` (Vite, local) |

Avanor: 5432 / 6379 / 8080. Orbit: 5433 / 6380 / 8081.

## 1. Start Postgres + Redis + API

From `guardian-cloud` (root `docker-compose.yml` includes `deployments/`):

```bash
cd Guardian/guardian-cloud
docker compose up -d --build
# or: ./scripts/dev-api.sh
docker compose ps
```

The `api` service has `restart: unless-stopped`, migrates on boot, and serves:

- `GET /api/v1/platform/theme`
- `GET/PUT/DELETE /api/v1/admin/dashboard-theme`

Health check:

```bash
curl -s http://127.0.0.1:8083/healthz
# {"status":"ok","request_id":"..."}
```

## 2. Optional: run API on the host instead

Only if you are iterating on Go without rebuilding the image:

```bash
# stop the compose API so port 8083 is free
docker compose stop api

export DATABASE_URL='postgres://guardian:guardian@127.0.0.1:5434/guardian_cloud?sslmode=disable'
export REDIS_URL='redis://127.0.0.1:6381/0'
export PORT=8083
export GUARDIAN_PLATFORM_DEV_TOKEN=guardian-dev-super-admin

go run ./cmd/server
```

Platform theme (public GET):

```bash
curl -s http://127.0.0.1:8083/api/v1/platform/theme
```

Dashboard theme (per admin):

```bash
curl -s -H "X-User-Id: 00000000-0000-4000-8000-0000000000bb" \
  http://127.0.0.1:8083/api/v1/admin/dashboard-theme
```

Theme update (temporary platform gate until F1.1 sessions):

```bash
curl -s -X PUT http://127.0.0.1:8083/api/v1/platform/theme \
  -H "Authorization: Bearer guardian-dev-super-admin" \
  -H "Content-Type: application/json" \
  -d '{"ink":"#0b1220","ink_soft":"#3d4a5c","mist":"#e8eef4","mist_deep":"#d5dee8","signal":"#0f766e","signal_soft":"#ccfbf1","alert":"#c2410c","atmosphere_mode":"mist"}'
```

Seeded super admin email: `superadmin@guardian.local` (platform_admins SUPER_ADMIN).

Verify tables:

```bash
docker compose exec postgres \
  psql -U guardian -d guardian_cloud -c "\dt"
```

## 3. Web (Watchline + portals)

```bash
cd web
cp .env.example .env   # VITE_API_BASE_URL + VITE_PLATFORM_DEV_TOKEN
npm install
npm run dev
```

Open http://127.0.0.1:5175

| Path | Surface |
|------|---------|
| `/` | Public home (product, plans, architecture, FAQ) |
| `/login` | Sign in |
| `/signup` | Create account |
| `/admin/...` | Super-admin dashboard (Brand Studio + Theme & Customized) |

Brand Studio = global public theme (`platform_theme`). Theme & Customized = per-admin dashboard theme (`/api/v1/admin/dashboard-theme`).

## Later (not in F1.0 Compose)

NATS JetStream, MinIO, and a mail catcher are required for F1.1/F1.8 and will
be added when those features land.

## Migrations

- Embedded via `migrations/embed.go` (`//go:embed *.sql`)
- Runner: goose (Up on `migrate` and on `serve` / API container boot)
- Theme-related: `00008`–`00010` (`platform_theme`), `00011`–`00013` (`admin_settings` + dashboard theme mode)
