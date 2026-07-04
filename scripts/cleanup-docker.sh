#!/usr/bin/env bash
# تنظيف Docker على السيرفر — آمن لـ Rybella (لا يحذف volumes البيانات)
#
# الاستخدام:
#   ./scripts/cleanup-docker.sh           # تنظيف خفيف
#   ./scripts/cleanup-docker.sh aggressive  # تنظيف أعمق (صور قديمة + cache)
#   ./scripts/cleanup-docker.sh --dry-run aggressive
#
set -euo pipefail

MODE="${1:-safe}"
DRY=0
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY=1
  MODE="${2:-safe}"
fi

RYBELLA_VOLUMES=(
  rybella_postgres_data
  rybella_backend_data
  rybella_backend_uploads
  rybella_backend_backups
)

run() {
  if [[ "$DRY" -eq 1 ]]; then
    echo "[dry-run] $*"
  else
    echo ">> $*"
    eval "$@"
  fi
}

echo "==> Rybella Docker cleanup (mode: $MODE)"
echo ""

echo "--- قبل التنظيف ---"
docker system df 2>/dev/null || true
echo ""

echo "--- Rybella volumes (محمية — لن تُحذف) ---"
for v in "${RYBELLA_VOLUMES[@]}"; do
  if docker volume inspect "$v" >/dev/null 2>&1; then
    size="$(docker run --rm -v "${v}:/v" alpine du -sh /v 2>/dev/null | cut -f1 || echo '?')"
    echo "  $v ($size)"
  fi
done
echo ""

echo "--- حاويات Rybella (يجب أن تبقى شغّالة) ---"
docker ps --filter 'name=rybella-' --format '  {{.Names}}  {{.Status}}' 2>/dev/null || true
echo ""

run 'docker container prune -f'
run 'docker network prune -f'

if [[ "$MODE" == "aggressive" ]]; then
  echo ""
  echo "==> Aggressive: صور غير مستخدمة + build cache (بدون volumes)"
  run 'docker image prune -a -f --filter "until=72h"'
  run 'docker builder prune -af --filter "until=72h"'
else
  run 'docker image prune -f'
  run 'docker builder prune -f --filter "until=168h"'
fi

# لا نستخدم docker volume prune أبداً هنا — قد يحذف بيانات إن غيّرت الأسماء
echo ""
echo "NOTE: لم يُمسح أي volume. لحذف volumes يدوياً (خطر): docker volume ls"

echo ""
echo "--- بعد التنظيف ---"
docker system df 2>/dev/null || true
echo ""
echo "Done. للتحقق: docker compose --env-file deployment/.env ps"
