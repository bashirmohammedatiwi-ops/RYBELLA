#!/usr/bin/env bash
# فحص سريع للنسخ الاحتياطية — بدون token
set -euo pipefail

echo "==> Backup health (no login required)"
curl -s http://127.0.0.1:4000/api/health/backups || docker exec rybella-backend wget -qO- http://127.0.0.1:4000/api/health/backups

echo ""
echo ""
echo "==> Files on disk"
docker exec rybella-backend ls -lah /app/backups

echo ""
echo "لإنشاء نسخة: افتح لوحة التحكم → النسخ الاحتياطية → نسخة احتياطية جديدة"
