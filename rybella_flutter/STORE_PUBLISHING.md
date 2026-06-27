# نشر تطبيق Rybella Flutter على المتاجر

## الإعدادات الحالية

| البند | القيمة |
|-------|--------|
| الدومين / API | `https://rybellairaq.com/api` |
| سياسة الخصوصية | `https://rybellairaq.com/privacy-policy.html` |
| معرّف Android / iOS | `com.rybella.iraq` |
| اسم التطبيق | Rybella Iraq |

## قبل البناء

### 1. Firebase (إشعارات الهاتف)

```bash
cd rybella_flutter
dart pub global activate flutterfire_cli
flutterfire configure
```

- أضف `google-services.json` إلى `android/app/`
- أضف `GoogleService-Info.plist` إلى `ios/Runner/`
- على الخادم: عيّن `FIREBASE_SERVICE_ACCOUNT_JSON` في `.env` (محتوى ملف service account JSON)

### 2. توقيع Android (Release)

```bash
keytool -genkey -v -keystore rybella-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias rybella
```

أضف في `android/key.properties` وفعّل `signingConfigs` في `android/app/build.gradle.kts`.

### 3. Apple Developer

- Bundle ID: `com.rybella.iraq` (طابق `ios/Runner.xcodeproj`)
- Push Notifications capability + APNs key في Firebase
- App Store Connect: رابط سياسة الخصوصية أعلاه

## البناء

```bash
cd rybella_flutter
flutter pub get
flutter analyze
flutter build appbundle --release
flutter build ipa --release
```

## متطلبات Google Play

- [x] سياسة خصوصية URL عام
- [x] `POST_NOTIFICATIONS` (Android 13+)
- [x] `INTERNET`
- [ ] لقطات شاشة (هاتف + تابلت)
- [ ] أيقونة 512×512 و Feature Graphic
- [ ] Data safety: حساب، طلبات، إشعارات (بموافقة)

## متطلبات App Store

- [x] `NSUserNotificationsUsageDescription`
- [x] `ITSAppUsesNonExemptEncryption = false`
- [ ] Privacy Nutrition Labels في App Store Connect
- [ ] لقطات iPhone 6.7" و 6.5"

## اختبار قبل النشر

1. تسجيل دخول برقم عراقي `07xxxxxxxxx`
2. بحث باركود → منتج واحد
3. إضافة عرض (Bundle) للسلة
4. إتمام طلب
5. الإشعارات داخل التطبيق + Push بعد Firebase
6. زر واتساب + سياسة الخصوصية

## API مخصص (اختياري)

```bash
flutter build appbundle --dart-define=API_BASE=https://rybellairaq.com
```
