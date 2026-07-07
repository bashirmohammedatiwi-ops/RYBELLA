#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-https://rybellairaq.com}"
EXPORT_PLIST="${EXPORT_PLIST:-ios/ExportOptions.plist}"

echo "==> Rybella Fulfillment — TestFlight build"
echo "    API_BASE=$API_BASE"

if [[ ! -f ios/Runner/GoogleService-Info.plist ]]; then
  echo ""
  echo "تحذير: ios/Runner/GoogleService-Info.plist غير موجود."
  echo "شغّل من مجلد fulfillment_app:"
  echo "  dart pub global activate flutterfire_cli"
  echo "  flutterfire configure --project=rybella-iraq --ios-bundle-id=com.rybella.fulfillmentApp"
  echo ""
fi

flutter pub get
flutter analyze

flutter build ipa \
  --release \
  --export-options-plist="$EXPORT_PLIST" \
  --dart-define="API_BASE=$API_BASE"

echo ""
echo "تم البناء. ارفع من Xcode Organizer أو:"
echo "  xcrun altool --upload-app -f build/ios/ipa/*.ipa -t ios -u YOUR_APPLE_ID"
echo "أو استخدم Transporter من Mac App Store."
