#!/usr/bin/env bash
# تثبيت مراقبة تلقائية (cron كل 5 دقائق)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WATCHDOG="${ROOT}/deployment/watchdog.sh"
CRON_LINE="*/5 * * * * ${WATCHDOG} >> /var/log/rybella-watchdog.log 2>&1"

chmod +x "${ROOT}/deployment/watchdog.sh"
chmod +x "${ROOT}/deployment/diagnose.sh"
chmod +x "${ROOT}/deployment/setup-swap.sh"

touch /var/log/rybella-watchdog.log 2>/dev/null || true

if crontab -l 2>/dev/null | grep -qF "$WATCHDOG"; then
  echo "Watchdog cron already installed"
else
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "Installed cron: $CRON_LINE"
fi

echo ""
echo "Test run:"
bash "$WATCHDOG"
echo ""
echo "Log file: /var/log/rybella-watchdog.log"
echo "Diagnose: bash ${ROOT}/deployment/diagnose.sh"
