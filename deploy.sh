#!/usr/bin/env bash
# Rybella — تحديث وتشغيل الإنتاج على السيرفر
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

migrate_docker_volumes_if_needed() {
  # عند تغيير مجلد التشغيل (deployment/ → جذر المشروع) يُنشئ Docker volumes جديدة فارغة.
  # ننسخ البيانات من الأسماء القديمة إن وُجدت.
  local pairs=(
    "deployment_backend_data:rybella_backend_data"
    "deployment_backend_uploads:rybella_backend_uploads"
    "rybella_backend_data:rybella_backend_data"
    "rybella_backend_uploads:rybella_backend_uploads"
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

echo ""
echo "==> Status:"
docker compose ps
echo ""
echo "Admin + API:  http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_IP'):4000"
echo "Web store:    http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_IP'):4003"
