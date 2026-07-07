# رفع تطبيق Rybella Fulfillment على TestFlight

تطبيق موظفي التجهيز — منفصل عن تطبيق العملاء `com.rybella.iraq`.

## الإعدادات

| البند | القيمة |
|-------|--------|
| اسم التطبيق | Rybella Fulfillment |
| Bundle ID | `com.rybella.fulfillment.staff` |

> **ملاحظة:** المعرف القديم `com.rybella.fulfillmentApp` حُذف من App Store Connect — استُبدل بهذا المعرف الجديد.
| Team ID | `629ARMBUX8` |
| API الإنتاج | `https://rybellairaq.com` |
| سياسة الخصوصية | `https://rybellairaq.com/privacy-policy.html` |
| الإصدار | `1.0.0` (build من `pubspec.yaml`) |

## 1. Apple Developer

1. [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles**
2. **Identifiers** → أنشئ App ID: `com.rybella.fulfillment.staff`
3. فعّل **Push Notifications** على هذا المعرف
4. **Keys** → أنشئ مفتاح APNs (إن لم يكن موجوداً) وارفعه في Firebase

## 2. App Store Connect

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **+**
2. **New App** → iOS
3. **الاسم في App Store** (يجب أن يكون **فريداً** في حسابك — لا يمكن تكرار اسم تطبيق آخر):

| مقترح | ملاحظة |
|-------|--------|
| **Rybella Staff** | موصى به إن كان "Rybella" أو "Rybella Fulfillment" محجوزاً |
| **Rybella تجهيز** | بالعربية |
| **Rybella Warehouse** | بديل إنجليزي |

> اسم الشاشة على الجهاز (`Rybella Fulfillment`) منفصل عن اسم App Store — يمكن أن يختلفا.

4. Bundle ID: `com.rybella.fulfillment.staff` (اختره من القائمة — يجب أن يكون مسجّلاً في Developer)
5. SKU: مثلاً `rybella-fulfillment`
6. **App Privacy** → أضف البيانات (حساب، معرف جهاز للإشعارات)
7. **App Information** → رابط سياسة الخصوصية أعلاه

### خطأ: App name already in use

إذا ظهر في Xcode:

> *App Record Creation failed… app name you entered is already being used*

**الحل:** لا تترك Xcode ينشئ التطبيق تلقائياً. أنشئه يدوياً في App Store Connect باسم **فريد** (مثل **Rybella Staff**) ثم ارفع الـ archive مرة أخرى — Xcode سيربطه بالتطبيق الموجود.

### خطأ: App record was previously removed

إذا ظهر:

> *App record with bundle identifier 'com.rybella.fulfillment.staff' was previously removed… Go to App Store Connect to restore the app*

**الحل (استعادة — الأفضل):**

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Apps**
2. من القائمة أو أعلى الصفحة: **Removed Apps** / **التطبيقات المحذوفة**
3. اختر التطبيق ذا Bundle ID `com.rybella.fulfillment.staff`
4. **Restore App** / **استعادة**
5. انتظر دقيقة ثم أعد **Distribute App** من Xcode

**إن لم يظهر خيار الاستعادة** (انتهت المدة أو حُذف نهائياً):

1. أنشئ تطبيقاً جديداً في App Store Connect بنفس Bundle ID إن كان متاحاً، أو
2. غيّر Bundle ID في المشروع (مثلاً `com.rybella.fulfillment.staff`) في:
   - `ios/Runner.xcodeproj` → Runner → Bundle Identifier
   - Apple Developer → Identifiers → سجّل المعرف الجديد
   - أعد Archive وارفع

## 3. Firebase (إشعارات Push)

في [Firebase Console](https://console.firebase.google.com) لمشروع `rybella-iraq`:

1. **Add app** → iOS → Bundle ID: `com.rybella.fulfillment.staff`
2. حمّل `GoogleService-Info.plist` إلى `ios/Runner/`
3. من مجلد `fulfillment_app`:

```bash
dart pub global activate flutterfire_cli
flutterfire configure --project=rybella-iraq --ios-bundle-id=com.rybella.fulfillment.staff
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

### خطأ PLA Update available

```
Unable to process request - PLA Update available
```

**الحل:** ادخل [developer.apple.com/account](https://developer.apple.com/account) بحساب صاحب الفريق `629ARMBUX8` → **Agreements, Tax, and Banking** → وافق على الاتفاقية الجديدة (Program License Agreement). ثم أعد فتح Xcode.

### خطأ Push Notifications / aps-environment

```
Provisioning profile doesn't include the Push Notifications capability
Provisioning profile doesn't include the aps-environment entitlement
```

**الحل (بالترتيب):**

1. بعد قبول PLA، ادخل [Identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. أنشئ أو افتح App ID: `com.rybella.fulfillment.staff`
3. فعّل **Push Notifications** → **Save**
4. في Xcode: Runner → **Signing & Capabilities** → **+ Capability** → **Push Notifications**
5. **Product** → **Clean Build Folder** (⇧⌘K)
6. Xcode → **Settings** → **Accounts** → اختر حسابك → **Download Manual Profiles**
7. أعد **Archive** (Product → Archive)

### حقل Version يظهر "Version" في Xcode

شغّل `flutter pub get` من مجلد `fulfillment_app` ثم أعد فتح `Runner.xcworkspace`. الإصدار يُقرأ من `pubspec.yaml` عبر `FLUTTER_BUILD_NAME` (حالياً `1.0.0`).

### بديل مؤقت (بدون Push) — **مفعّل حالياً**

تم تعطيل `aps-environment` مؤقتاً حتى ينجح البناء والرفع على TestFlight.

- الملف الفارغ: `ios/Runner/Runner.entitlements`
- النسخة الاحتياطية مع Push: `ios/Runner/Runner.entitlements.push`

**لإعادة تفعيل Push لاحقاً:**
1. قبول PLA + تفعيل Push على App ID في Apple Developer
2. انسخ: `cp ios/Runner/Runner.entitlements.push ios/Runner/Runner.entitlements`
3. في Xcode → Runner → Build Settings → `CODE_SIGN_ENTITLEMENTS` = `Runner/Runner.entitlements`
4. Signing & Capabilities → + Push Notifications

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
