#!/usr/bin/env bash
# Rybella — مراقبة صحة الخدمات وإعادة تشغيلها تلقائياً
# يُشغَّل كل 5 دقائق عبر cron:
#   */5 * * * * /root/RYBELLA/deployment/watchdog.sh >> /var/log/rybella-watchdog.log 2>&1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/deployment/.env"
LOG_TAG="[rybella-watchdog $(date '+%Y-%m-%d %H:%M:%S')]"

HTTP_PORT="$(grep -E '^HTTP_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo 4000)"
WEBSTORE_PORT="$(grep -E '^WEBSTORE_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo 4003)"
HTTP_PORT="${HTTP_PORT:-4000}"
WEBSTORE_PORT="${WEBSTORE_PORT:-4003}"

check_url() {
  local url="$1"
  curl -sf --max-time 15 "$url" >/dev/null 2>&1
}

restart_stack() {
  echo "$LOG_TAG RESTART docker compose stack"
  cd "$ROOT"
  docker compose --env-file "$ENV_FILE" up -d --remove-orphans 2>/dev/null || true
}

restart_container() {
  local name="$1"
  echo "$LOG_TAG RESTART container $name"
  docker restart "$name" 2>/dev/null || true
}

# فحص المساحة — إن امتلأ القرص يتوقف كل شيء
DISK_USE="$(df / --output=pcent 2>/dev/null | tail -1 | tr -dc '0-9' || echo 0)"
if [ "${DISK_USE:-0}" -ge 92 ]; then
  echo "$LOG_TAG WARN disk ${DISK_USE}% full — prune docker logs/images"
  docker system prune -f --filter "until=72h" 2>/dev/null || true
fi

# فحص الذاكرة
MEM_AVAIL="$(free -m 2>/dev/null | awk '/^Mem:/{print $7}' || echo 999)"
if [ "${MEM_AVAIL:-999}" -lt 80 ]; then
  echo "$LOG_TAG WARN low memory: ${MEM_AVAIL}MB available"
fi

BACKEND_OK=false
ADMIN_OK=false
STORE_OK=false

if docker ps --format '{{.Names}}' | grep -q '^rybella-backend$'; then
  if docker exec rybella-backend wget -q --spider http://127.0.0.1:4000/api/health 2>/dev/null; then
    BACKEND_OK=true
  fi
fi

if check_url "http://127.0.0.1:${HTTP_PORT}/api/health"; then
  ADMIN_OK=true
fi

if check_url "http://127.0.0.1:${WEBSTORE_PORT}/"; then
  STORE_OK=true
fi

if [ "$BACKEND_OK" = false ]; then
  echo "$LOG_TAG FAIL backend unhealthy"
  restart_container rybella-backend
  sleep 8
  if ! docker exec rybella-backend wget -q --spider http://127.0.0.1:4000/api/health 2>/dev/null; then
    restart_stack
  fi
elif [ "$ADMIN_OK" = false ] || [ "$STORE_OK" = false ]; then
  echo "$LOG_TAG FAIL web unhealthy (admin=$ADMIN_OK store=$STORE_OK)"
  [ "$ADMIN_OK" = false ] && restart_container rybella-web
  [ "$STORE_OK" = false ] && restart_container rybella-webstore
else
  echo "$LOG_TAG OK backend admin store"
fi

# nginx على السيرفر (خارج Docker)
if command -v systemctl >/dev/null 2>&1 && systemctl is-active nginx >/dev/null 2>&1; then
  if ! check_url "http://127.0.0.1:${WEBSTORE_PORT}/"; then
    echo "$LOG_TAG reloading host nginx"
    systemctl reload nginx 2>/dev/null || true
  fi
fi
