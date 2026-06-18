#!/usr/bin/env bash
# توافق مع الأوامر القديمة: cd deployment && ./deploy.sh
exec "$(dirname "$0")/../deploy.sh" "$@"
