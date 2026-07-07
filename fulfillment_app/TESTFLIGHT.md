# رفع تطبيق Rybella Fulfillment على TestFlight

تطبيق موظفي التجهيز — منفصل عن تطبيق العملاء `com.rybella.iraq`.

## الإعدادات

| البند | القيمة |
|-------|--------|
| اسم التطبيق | Rybella Fulfillment |
| Bundle ID | `com.rybella.fulfillmentApp` |
| Team ID | `629ARMBUX8` |
| API الإنتاج | `https://rybellairaq.com` |
| سياسة الخصوصية | `https://rybellairaq.com/privacy-policy.html` |
| الإصدار | `1.0.0` (build من `pubspec.yaml`) |

## 1. Apple Developer

1. [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles**
2. **Identifiers** → أنشئ App ID: `com.rybella.fulfillmentApp`
3. فعّل **Push Notifications** على هذا المعرف
4. **Keys** → أنشئ مفتاح APNs (إن لم يكن موجوداً) وارفعه في Firebase

## 2. App Store Connect

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **+**
2. **New App** → iOS → الاسم: **Rybella Fulfillment**
3. Bundle ID: `com.rybella.fulfillmentApp`
4. SKU: مثلاً `rybella-fulfillment`
5. **App Privacy** → أضف البيانات (حساب، معرف جهاز للإشعارات)
6. **App Information** → رابط سياسة الخصوصية أعلاه

## 3. Firebase (إشعارات Push)

في [Firebase Console](https://console.firebase.google.com) لمشروع `rybella-iraq`:

1. **Add app** → iOS → Bundle ID: `com.rybella.fulfillmentApp`
2. حمّل `GoogleService-Info.plist` إلى `ios/Runner/`
3. من مجلد `fulfillment_app`:

```bash
dart pub global activate flutterfire_cli
flutterfire configure --project=rybella-iraq --ios-bundle-id=com.rybella.fulfillmentApp
```

4. في Firebase → **Project settings** → **Cloud Messaging** → ارفع مفتاح APNs (.p8)
5. على الخادم: تأكد أن `FIREBASE_SERVICE_ACCOUNT_JSON` مضبوط (نفس مشروع Rybella)

## 4. حسابات الموظفين

من لوحة التحكم → **موظفو التجهيز** أنشئ حسابات `staff` قبل الاختبار.

التطبيق يرفض حسابات `customer` فقط.

## 5. البناء والرفع

### المتطلبات على Mac

- Xcode (أحدث إصدار مستقر)
- Flutter SDK
- تسجيل دخول Xcode بحساب Apple Developer (Team `629ARMBUX8`)

### أوامر البناء

```bash
cd fulfillment_app
chmod +x scripts/build-testflight.sh
./scripts/build-testflight.sh
```

أو يدوياً:

```bash
cd fulfillment_app
flutter pub get
flutter analyze
flutter build ipa \
  --release \
  --export-options-plist=ios/ExportOptions.plist \
  --dart-define=API_BASE=https://rybellairaq.com
```

### رفع IPA

**الطريقة 1 — Xcode:** Window → Organizer → Archives → Distribute App → App Store Connect

**الطريقة 2 — Transporter:** اسحب `build/ios/ipa/*.ipa` إلى تطبيق Transporter

**الطريقة 3 — سطر الأوامر:**

```bash
xcrun altool --upload-app -f build/ios/ipa/*.ipa -t ios -u YOUR_APPLE_ID -p @keychain:AC_PASSWORD
```

## 6. TestFlight

1. بعد المعالجة في App Store Connect → **TestFlight**
2. **Internal Testing** → أضف فريقك
3. **External Testing** (اختياري) → يحتاج مراجعة Beta App Review
4. لكل build جديد: زِد `version` في `pubspec.yaml` (مثلاً `1.0.0+2`)

## 7. لقطات الشاشة (App Store / TestFlight خارجي)

- iPhone 6.7" (1290×2796) — iPhone 15 Pro Max
- iPhone 6.5" (1242×2688) — iPhone 11 Pro Max

شاشات مقترحة: تسجيل الدخول، لوحة الإحصائيات، قائمة الطلبات، تفاصيل طلب.

## 8. التحقق قبل الإرسال

- [ ] `GoogleService-Info.plist` في `ios/Runner/`
- [ ] `firebase_options.dart` محدّث (ليس `REPLACE_ME`)
- [ ] Push Notifications على App ID في Apple Developer
- [ ] Backend منشور (`staff` APIs + CORS)
- [ ] تسجيل دخول موظف على جهاز حقيقي
- [ ] إشعار عند طلب جديد (اختبار من لوحة التحكم)

## 9. استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| Signing failed | افتح `ios/Runner.xcworkspace` في Xcode → Signing & Capabilities → Team |
| No profiles for bundle | Xcode → Product → Archive (ينشئ profile تلقائياً) |
| Push لا يعمل | تحقق من APNs في Firebase + `Runner.entitlements` + إذن الإشعارات |
| فشل تسجيل الدخول | `--dart-define=API_BASE=https://rybellairaq.com` + نشر backend |

## زيادة رقم البناء

في `pubspec.yaml`:

```yaml
version: 1.0.0+2   # +2 هو build number لـ TestFlight
```
