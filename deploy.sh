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

echo "==> Building and starting containers..."
docker compose --env-file "$ENV_FILE" up -d --build "$@"

echo ""
echo "==> Status:"
docker compose ps
echo ""
echo "Admin + API:  http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_IP'):4000"
echo "Web store:    http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_IP'):4003"
