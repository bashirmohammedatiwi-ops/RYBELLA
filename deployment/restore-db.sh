#!/usr/bin/env bash
# استعادة قاعدة البيانات من أحدث نسخة احتياطية
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/deployment/.env"

echo "==> Rybella — restore database from backup"

if ! docker ps --format '{{.Names}}' | grep -q '^rybella-backend$'; then
  echo "ERROR: rybella-backend container not running"
  exit 1
fi

BACKUP_DIR="/app/backups"
LATEST="$(docker exec rybella-backend sh -c "ls -t ${BACKUP_DIR}/rybella-backup-*.zip 2>/dev/null | head -1" || true)"

if [ -z "$LATEST" ]; then
  echo "ERROR: No backup zip found in ${BACKUP_DIR}"
  exit 1
fi

echo "Using backup: $LATEST"

docker exec rybella-backend sh -c "
  set -e
  cp /app/data/rybella.db /app/data/rybella.db.bak.\$(date +%s) 2>/dev/null || true
  unzip -p '$LATEST' rybella.db > /app/data/rybella.db.restore
  mv /app/data/rybella.db.restore /app/data/rybella.db
  echo 'Database file restored'
"

echo "==> Restarting backend..."
docker restart rybella-backend
sleep 10

HEALTH="$(curl -sf --max-time 15 http://127.0.0.1:4000/api/health/db 2>/dev/null || docker exec rybella-backend wget -qO- http://127.0.0.1:4000/api/health/db 2>/dev/null || echo FAIL)"
echo "DB health: $HEALTH"

if echo "$HEALTH" | grep -q '"database":"connected"'; then
  echo "SUCCESS — database restored and connected"
else
  echo "WARN — check logs: docker logs rybella-backend --tail 50"
  exit 1
fi
