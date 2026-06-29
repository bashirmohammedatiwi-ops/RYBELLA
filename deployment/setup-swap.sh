#!/usr/bin/env bash
# إضافة swap 2GB إن لم يكن موجوداً — يمنع توقف VPS بسبب نفاد الذاكرة
set -euo pipefail

SWAP_FILE="/swapfile"
SWAP_SIZE="${SWAP_SIZE:-2G}"

if swapon --show 2>/dev/null | grep -q .; then
  echo "Swap already active:"
  swapon --show
  free -h
  exit 0
fi

if [ -f "$SWAP_FILE" ]; then
  echo "Swap file exists, enabling..."
  chmod 600 "$SWAP_FILE"
  mkswap "$SWAP_FILE" 2>/dev/null || true
  swapon "$SWAP_FILE"
else
  echo "Creating ${SWAP_SIZE} swap at $SWAP_FILE ..."
  fallocate -l "$SWAP_SIZE" "$SWAP_FILE" 2>/dev/null || dd if=/dev/zero of="$SWAP_FILE" bs=1M count=2048 status=progress
  chmod 600 "$SWAP_FILE"
  mkswap "$SWAP_FILE"
  swapon "$SWAP_FILE"
fi

if ! grep -q "$SWAP_FILE" /etc/fstab 2>/dev/null; then
  echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
  echo "Added to /etc/fstab"
fi

# تقليل aggressiveness للـ swap
sysctl vm.swappiness=10 2>/dev/null || true
grep -q 'vm.swappiness' /etc/sysctl.conf 2>/dev/null || echo 'vm.swappiness=10' >> /etc/sysctl.conf

echo "Done:"
free -h
