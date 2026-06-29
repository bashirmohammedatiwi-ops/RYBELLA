#!/usr/bin/env bash
# تشخيص سريع لسبب توقف الموقع على السيرفر
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/deployment/.env"
HTTP_PORT="$(grep -E '^HTTP_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo 4000)"
WEBSTORE_PORT="$(grep -E '^WEBSTORE_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo 4003)"

echo "========== Rybella Server Diagnose =========="
echo "Date: $(date)"
echo ""

echo "--- Memory & Disk ---"
free -h 2>/dev/null || true
echo ""
df -h / /var/lib/docker 2>/dev/null || df -h /
echo ""

echo "--- Swap ---"
swapon --show 2>/dev/null || echo "No swap"
echo ""

echo "--- Docker containers ---"
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || echo "Docker not running"
echo ""

echo "--- Health checks ---"
for url in \
  "http://127.0.0.1:${HTTP_PORT}/api/health" \
  "http://127.0.0.1:${HTTP_PORT}/" \
  "http://127.0.0.1:${WEBSTORE_PORT}/"
do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null || echo ERR)"
  echo "$url → HTTP $code"
done
echo ""

echo "--- Backend memory (from /api/health) ---"
curl -s --max-time 10 "http://127.0.0.1:${HTTP_PORT}/api/health" 2>/dev/null || echo "unreachable"
echo ""

echo "--- Recent OOM kills (kernel) ---"
dmesg -T 2>/dev/null | grep -i 'killed process' | tail -5 || journalctl -k --no-pager 2>/dev/null | grep -i 'out of memory' | tail -5 || echo "none found (or need root)"
echo ""

echo "--- Backend logs (last 30 lines) ---"
docker logs rybella-backend --tail 30 2>/dev/null || true
echo ""

echo "--- Nginx status ---"
systemctl is-active nginx 2>/dev/null || echo "nginx not managed by systemd"
echo ""

echo "========== Recommendations =========="
DISK_USE="$(df / --output=pcent 2>/dev/null | tail -1 | tr -dc '0-9' || echo 0)"
MEM_AVAIL="$(free -m 2>/dev/null | awk '/^Mem:/{print $7}' || echo 999)"
if [ "${DISK_USE:-0}" -ge 90 ]; then
  echo "⚠ Disk almost full (${DISK_USE}%) — run: docker system prune -af"
fi
if [ "${MEM_AVAIL:-999}" -lt 150 ]; then
  echo "⚠ Low RAM — run: sudo bash deployment/setup-swap.sh"
fi
if ! swapon --show 2>/dev/null | grep -q .; then
  echo "⚠ No swap — run: sudo bash deployment/setup-swap.sh"
fi
echo "Install auto-restart: sudo bash deployment/install-watchdog.sh"
echo "============================================="
