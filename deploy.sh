#!/usr/bin/env bash
# Rybella — نشر إنتاج كامل (بناء + فحوصات + تسخين صور البطاقات)
#
# الاستخدام:
#   ./deploy.sh                  # نشر كامل مع تسخين صور البطاقات
#   SKIP_WARM=1 ./deploy.sh      # نشر سريع بدون تسخين الصور
#   AUTO_TUNE=0 ./deploy.sh      # عدم تعديل إعدادات الأداء تلقائياً
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> Rybella deploy from: $ROOT"

REQUIRED=(
  deployment/admin.Dockerfile
  deployment/backend.Dockerfile
  deployment/storefront-premium.Dockerfile
  deployment/nginx.conf
  deployment/nginx-webstore.conf
)

missing_files() {
  local f
  for f in "${REQUIRED[@]}"; do
    [ -f "$f" ] || return 0
  done
  return 1
}

restore_deployment_files() {
  echo "==> Restoring deployment files from git..."
  git fetch origin master 2>/dev/null || true

  # إلغاء sparse-checkout إن كان يمنع الملفات
  if git config --get core.sparseCheckout 2>/dev/null | grep -qi true; then
    git sparse-checkout disable 2>/dev/null || true
  fi

  git checkout HEAD -- deployment/ 2>/dev/null || true
  git checkout origin/master -- deployment/ 2>/dev/null || true
}

if missing_files; then
  restore_deployment_files
fi

if missing_files; then
  echo "ERROR: deployment Docker files still missing after git restore."
  echo "Files in deployment/:"
  ls -la deployment/ 2>/dev/null || true
  echo ""
  echo "In git tree:"
  git ls-tree --name-only HEAD deployment/ 2>/dev/null || true
  echo ""
  echo "Try: cd ~/RYBELLA && git reset --hard origin/master"
  exit 1
fi

ENV_FILE="deployment/.env"
if [ ! -f "$ENV_FILE" ]; then
  cp deployment/.env.example "$ENV_FILE"
  echo "Created $ENV_FILE — set JWT_SECRET and API_URL for production."
fi

if ! grep -q '^JWT_SECRET=.\+' "$ENV_FILE" 2>/dev/null; then
  SECRET="$(openssl rand -base64 32 2>/dev/null || echo 'RybellaChangeThisSecretInEnv')"
  if grep -q '^JWT_SECRET=' "$ENV_FILE"; then
    sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=$SECRET|" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
  else
    echo "JWT_SECRET=$SECRET" >> "$ENV_FILE"
  fi
  echo "JWT_SECRET was missing — generated automatically in $ENV_FILE"
fi

if ! grep -q '^API_URL=.\+' "$ENV_FILE" 2>/dev/null; then
  echo "API_URL=http://187.124.23.65:4000" >> "$ENV_FILE"
fi

if ! grep -qE '^POSTGRES_PASSWORD=.{4,}' "$ENV_FILE" 2>/dev/null; then
  PG_PASS="$(openssl rand -base64 24 2>/dev/null | tr -dc 'a-zA-Z0-9' | head -c 24)"
  if grep -q '^POSTGRES_PASSWORD=' "$ENV_FILE" 2>/dev/null; then
    sed -i.bak "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$PG_PASS|" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
  else
    cat >> "$ENV_FILE" <<EOF

# PostgreSQL
POSTGRES_DB=rybella
POSTGRES_USER=rybella
POSTGRES_PASSWORD=$PG_PASS
PG_POOL_MAX=50
WEB_CONCURRENCY=2
EOF
  fi
  echo "POSTGRES_PASSWORD set in $ENV_FILE"
fi

if ! grep -q '^EXTERNAL_INVENTORY_API_URL=.\+' "$ENV_FILE" 2>/dev/null; then
  cat >> "$ENV_FILE" <<'EOF'

# External inventory sync (Alhayaa)
EXTERNAL_INVENTORY_API_URL=http://187.127.88.146/api/v1
EXTERNAL_INVENTORY_API_EMAIL=admin@alhayaa.com
EXTERNAL_INVENTORY_API_PASSWORD=Admin@12345
INVENTORY_SYNC_INTERVAL_MIN=15
EOF
  echo "Added Alhayaa inventory sync defaults to $ENV_FILE — verify email/password."
fi

detect_cpu_count() {
  if command -v nproc >/dev/null 2>&1; then
    nproc
  elif [ -r /proc/cpuinfo ]; then
    grep -c ^processor /proc/cpuinfo
  else
    echo 2
  fi
}

detect_ram_mb() {
  if [ -r /proc/meminfo ]; then
    awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo
  else
    echo 4096
  fi
}

set_env_default() {
  local key="$1"
  local val="$2"
  if ! grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    echo "${key}=${val}" >> "$ENV_FILE"
  fi
}

set_env_tuning() {
  local key="$1"
  local val="$2"
  if [ "${AUTO_TUNE:-1}" = "1" ]; then
    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
      sed -i.bak "s|^${key}=.*|${key}=${val}|" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
    else
      echo "${key}=${val}" >> "$ENV_FILE"
    fi
  else
    set_env_default "$key" "$val"
  fi
}

ensure_production_tuning() {
  local cpus ram workers pool sharp warm
  cpus="$(detect_cpu_count)"
  ram="$(detect_ram_mb)"

  if [ "$cpus" -ge 8 ]; then
    workers=4
  elif [ "$cpus" -ge 4 ]; then
    workers=3
  elif [ "$cpus" -ge 2 ]; then
    workers=2
  else
    workers=1
  fi

  pool=$((workers * 12))
  [ "$pool" -gt 48 ] && pool=48
  [ "$pool" -lt 20 ] && pool=20

  sharp=4
  warm=5
  if [ "$ram" -lt 2048 ]; then
    workers=1
    pool=15
    sharp=2
    warm=3
  elif [ "$ram" -lt 4096 ]; then
    sharp=3
    warm=4
  elif [ "$cpus" -ge 4 ]; then
    sharp=6
    warm=6
  fi

  set_env_tuning WEB_CONCURRENCY "$workers"
  set_env_tuning PG_POOL_MAX "$pool"
  set_env_tuning SHARP_MAX_CONCURRENT "$sharp"
  set_env_tuning WARM_CONCURRENCY "$warm"

  echo "==> ضبط الإنتاج (زوار كُثُر): CPUs=$cpus RAM=${ram}MB workers=$workers pool=$pool sharp=$sharp"
}

ensure_production_tuning

migrate_docker_volumes_if_needed() {
  # عند تغيير مجلد التشغيل (deployment/ → جذر المشروع) يُنشئ Docker volumes جديدة فارغة.
  # ننسخ البيانات من الأسماء القديمة إن وُجدت.
  local pairs=(
    "deployment_backend_data:rybella_backend_data"
    "deployment_backend_uploads:rybella_backend_uploads"
    "deployment_backend_backups:rybella_backend_backups"
    "rybella_backend_data:rybella_backend_data"
    "rybella_backend_uploads:rybella_backend_uploads"
    "rybella_backend_backups:rybella_backend_backups"
  )
  for pair in "${pairs[@]}"; do
    local from="${pair%%:*}"
    local to="${pair##*:}"
    [ "$from" = "$to" ] && continue
    if docker volume inspect "$from" >/dev/null 2>&1; then
      docker volume create "$to" >/dev/null 2>&1 || true
      local from_size to_size
      from_size="$(docker run --rm -v "${from}:/v" alpine sh -c 'du -sb /v 2>/dev/null | cut -f1' 2>/dev/null || echo 0)"
      to_size="$(docker run --rm -v "${to}:/v" alpine sh -c 'du -sb /v 2>/dev/null | cut -f1' 2>/dev/null || echo 0)"
      if [ "${from_size:-0}" -gt 4096 ] && [ "${to_size:-0}" -lt "${from_size:-0}" ]; then
        echo "==> Migrating volume $from → $to (restoring database/uploads)..."
        docker run --rm -v "${from}:/from" -v "${to}:/to" alpine sh -c 'cp -a /from/. /to/' 2>/dev/null || true
      fi
    fi
  done
}

migrate_docker_volumes_if_needed

echo "==> Stopping previous containers (if any)..."
docker compose --env-file "$ENV_FILE" down --remove-orphans 2>/dev/null || true
for name in rybella-backend rybella-web rybella-webstore; do
  docker rm -f "$name" 2>/dev/null || true
done

echo "==> Building and starting containers..."
docker compose --env-file "$ENV_FILE" up -d --build "$@"

if docker ps --format '{{.Names}}' | grep -q '^rybella-backend$'; then
  if docker exec rybella-backend test -f /app/data/rybella.db 2>/dev/null; then
    echo "==> SQLite detected — migrating to PostgreSQL..."
    chmod +x deployment/migrate-to-postgres.sh
    docker exec -e FORCE_MIGRATE=1 rybella-backend node scripts/migrate-sqlite-to-postgres.js || echo "WARN: migration failed — run: bash deployment/migrate-to-postgres.sh"
  fi
fi

wait_for_service() {
  local i
  for i in $(seq 1 30); do
    if docker exec rybella-backend wget -q --spider http://127.0.0.1:4000/api/health/live 2>/dev/null; then
      return 0
    fi
    sleep 2
  done
  return 1
}

warm_product_images() {
  if [ "${SKIP_WARM:-0}" = "1" ]; then
    echo "==> SKIP_WARM=1 — تخطي تسخين الصور"
    return 0
  fi

  if ! docker ps --format '{{.Names}}' | grep -q '^rybella-backend$'; then
    echo "WARN: backend غير شغّال — تخطي تسخين الصور"
    return 1
  fi

  local warm_concurrency
  warm_concurrency="$(grep -E '^WARM_CONCURRENCY=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo 5)"
  warm_concurrency="${warm_concurrency:-5}"

  echo ""
  echo "==> [1/2] تسخين صور بطاقات المتجر (قبل دخول الزبائن)..."
  if ! docker exec -e "WARM_CONCURRENCY=${warm_concurrency}" rybella-backend \
    node scripts/warm-upload-images.js --cards-only; then
    echo "WARN: فشل تسخين بطاقات الصور"
    echo "      شغّل يدوياً: docker exec rybella-backend node scripts/warm-upload-images.js --cards-only"
    return 1
  fi

  echo "==> تنظيف ملفات cache اليتيمة..."
  docker exec rybella-backend node scripts/prune-image-cache.js 2>/dev/null || true

  echo "==> [2/2] تسخين باقي أحجام الصور (خلفية، أولوية منخفضة)..."
  docker exec -d rybella-backend sh -c \
    "nice -n 15 ionice -c3 node scripts/warm-upload-images.js --skip-cards >> /tmp/rybella-warm.log 2>&1" \
    2>/dev/null \
    || docker exec -d rybella-backend node scripts/warm-upload-images.js --skip-cards \
    2>/dev/null \
    || true
  return 0
}

verify_card_cache_samples() {
  local count
  count="$(docker exec rybella-backend sh -c 'find /app/uploads/.cache -type f -name "*.webp" 2>/dev/null | head -3 | wc -l' 2>/dev/null || echo 0)"
  count="$(echo "$count" | tr -d '[:space:]')"
  if [ "${count:-0}" -lt 1 ]; then
    echo "WARN: لا توجد عينات WebP في cache بعد التسخين"
    return 1
  fi

  local sample_file url_path webstore_port http_code
  sample_file="$(docker exec rybella-backend sh -c 'find /app/uploads/.cache/w200_q72_webp -type f -name "*.webp" 2>/dev/null | head -1' 2>/dev/null || true)"
  if [ -n "$sample_file" ]; then
    url_path="/uploads/.cache/w200_q72_webp/$(basename "$sample_file")"
    webstore_port="$(grep -E '^WEBSTORE_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo 4003)"
    webstore_port="${webstore_port:-4003}"
    http_code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${webstore_port}${url_path}" 2>/dev/null || echo 000)"
    if [ "$http_code" = "200" ]; then
      echo "OK  عينة cache بطاقة HTTP 200"
    else
      echo "WARN: عينة cache بطاقة أعادت HTTP ${http_code} (${url_path})"
      return 1
    fi
  fi

  echo "OK  وجدت عينات WebP في cache (${count}+)"
  return 0
}

post_deploy_checks() {
  echo ""
  echo "==> Post-deploy checks..."

  if ! wait_for_service; then
    echo "WARN: Backend health check timed out — see: docker compose logs backend"
    return 1
  fi
  echo "OK  Backend /api/health"

  local db_health
  db_health="$(docker exec rybella-backend wget -qO- http://127.0.0.1:4000/api/health/db 2>/dev/null || true)"
  if echo "$db_health" | grep -q '"database":"connected"'; then
    echo "OK  PostgreSQL connected"
  else
    echo "FAIL Database: $db_health"
    return 1
  fi

  if docker exec rybella-backend test -d /app/backups 2>/dev/null; then
    echo "OK  Backup directory /app/backups"
  else
    echo "FAIL Backup directory missing"
    return 1
  fi

  local backup_health
  backup_health="$(docker exec rybella-backend wget -qO- http://127.0.0.1:4000/api/health/backups 2>/dev/null || true)"
  if echo "$backup_health" | grep -q '"ok":true'; then
    echo "OK  Backup API ready ($backup_health)"
  else
    echo "FAIL Backup health: $backup_health"
    return 1
  fi

  local http_port
  http_port="$(grep -E '^HTTP_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo 4000)"
  http_port="${http_port:-4000}"
  local nginx_code
  nginx_code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${http_port}/api/health/backups" 2>/dev/null || echo 000)"
  if [ "$nginx_code" = "200" ]; then
    echo "OK  Admin Nginx /api/health/backups (HTTP $nginx_code)"
  else
    echo "WARN Admin Nginx returned HTTP $nginx_code for /api/health/backups (rebuild web container if needed)"
  fi

  local warm_ok=0
  if ! warm_product_images; then
    warm_ok=1
  fi
  if ! verify_card_cache_samples; then
    warm_ok=1
  fi

  if [ "$warm_ok" -ne 0 ]; then
    echo ""
    echo "WARN: تسخين صور البطاقات لم يكتمل — قد تتأخر الصور عند أول زيارة"
    echo "      docker exec rybella-backend node scripts/warm-upload-images.js --cards-only"
  fi

  echo ""
  echo "============================================"
  echo "  Rybella — جاهز للاستخدام"
  echo "============================================"
  echo "  المتجر:        https://rybellairaq.com"
  echo "  لوحة التحكم:   https://admin.rybellairaq.com"
  echo "  النسخ الاحتياطية: سجّل دخول → النسخ الاحتياطية → نسخة جديدة"
  echo "  استقرار السيرفر:   sudo bash deployment/setup-swap.sh"
  echo "                     sudo bash deployment/install-watchdog.sh"
  echo "============================================"
}

post_deploy_checks || true

echo ""
echo "==> Status:"
docker compose --env-file "$ENV_FILE" ps
echo ""
HTTP_PORT="$(grep -E '^HTTP_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo 4000)"
WEBSTORE_PORT="$(grep -E '^WEBSTORE_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo 4003)"
echo "Admin + API:  http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_IP'):${HTTP_PORT:-4000}"
echo "Web store:    http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_IP'):${WEBSTORE_PORT:-4003}"
