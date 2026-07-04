#!/usr/bin/env bash
# استعادة PostgreSQL من أحدث نسخة احتياطية (rybella.sql داخل ZIP)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/deployment/.env"
source <(grep -E '^POSTGRES_' "$ENV_FILE" | sed 's/^/export /')

echo "==> Rybella — restore PostgreSQL from backup"

LATEST="$(docker exec rybella-backend sh -c 'ls -t /app/backups/rybella-backup-*.zip 2>/dev/null | head -1' || true)"
if [ -z "$LATEST" ]; then
  echo "ERROR: No backup zip found"
  exit 1
fi

echo "Using: $LATEST"
TMP="/tmp/rybella-restore-$$"
mkdir -p "$TMP"
docker cp "rybella-backend:$LATEST" "$TMP/backup.zip"
unzip -o "$TMP/backup.zip" -d "$TMP"

if [ -f "$TMP/rybella.sql" ]; then
  echo "Restoring rybella.sql..."
  docker exec -i rybella-postgres psql -U "${POSTGRES_USER:-rybella}" -d "${POSTGRES_DB:-rybella}" < "$TMP/rybella.sql"
elif [ -f "$TMP/rybella.db" ]; then
  echo "Legacy SQLite backup — run: bash deployment/migrate-to-postgres.sh after copying db"
  docker cp "$TMP/rybella.db" rybella-backend:/app/data/rybella.db
  bash "$ROOT/deployment/migrate-to-postgres.sh"
else
  echo "ERROR: No rybella.sql or rybella.db in backup"
  exit 1
fi

rm -rf "$TMP"
docker restart rybella-backend
echo "Done."
