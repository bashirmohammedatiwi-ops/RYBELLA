#!/usr/bin/env bash
# نقل البيانات من SQLite القديم إلى PostgreSQL (مرة واحدة)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/deployment/.env"

cd "$ROOT"

if ! docker ps --format '{{.Names}}' | grep -q '^rybella-postgres$'; then
  echo "ERROR: rybella-postgres not running. Run ./deploy.sh first."
  exit 1
fi

if ! docker exec rybella-backend test -f /app/data/rybella.db 2>/dev/null; then
  echo "No SQLite file at /app/data/rybella.db — skip migration (fresh install or already migrated)"
  exit 0
fi

echo "==> Migrating SQLite → PostgreSQL (FORCE_MIGRATE=1)..."
docker exec -e FORCE_MIGRATE=1 rybella-backend node scripts/migrate-sqlite-to-postgres.js

echo "==> Verifying..."
docker exec rybella-backend wget -qO- http://127.0.0.1:4000/api/health/db

echo ""
echo "==> Renaming old SQLite (backup)..."
docker exec rybella-backend sh -c 'mv /app/data/rybella.db /app/data/rybella.db.migrated.$(date +%s) 2>/dev/null || true'

echo "Migration done. Restart backend:"
docker restart rybella-backend
sleep 8
curl -sf "http://127.0.0.1:${HTTP_PORT:-4000}/api/products?limit=1" | head -c 200 || true
echo ""
