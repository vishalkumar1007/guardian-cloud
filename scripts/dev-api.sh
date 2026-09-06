#!/usr/bin/env bash
# Start Postgres + Redis + API (restart-safe) for local theme / admin work.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

docker compose up -d --build

echo "Waiting for API on :8083 ..."
for i in $(seq 1 60); do
  if curl -sf http://127.0.0.1:8083/healthz >/dev/null; then
    echo "API healthy:"
    curl -s http://127.0.0.1:8083/healthz
    echo
    exit 0
  fi
  sleep 1
done

echo "API did not become healthy in time. Recent logs:"
docker compose logs --tail=40 api
exit 1
