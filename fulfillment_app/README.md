# Rybella Fulfillment — تطبيق تجهيز الطلبات

تطبيق Flutter مخصص لموظفي تجهيز الطلبات في Rybella.

## المميزات

- تسجيل دخول للموظفين (`staff`) والمدير
- لوحة تحكم بإحصائيات الطلبات (انتظار / تجهيز / تسليم)
- قائمة طلبات مع فلترة حسب الحالة
- تفاصيل الطلب: منتجات، باركود، عنوان، اتصال بالعميل
- تحديث حالة الطلب (بدء التجهيز → تم التسليم)
- **إشعار فوري** عند وصول طلب جديد (FCM من الخادم)
- **تذكيرات مستمرة** محلياً ومن الخادم للطلبات المعلّقة

## إعداد Firebase

```bash
cd fulfillment_app
dart pub global activate flutterfire_cli
flutterfire configure
```

أضف `FIREBASE_SERVICE_ACCOUNT_JSON` في `.env` على الخادم لإرسال FCM.

## إنشاء حساب موظف

من لوحة التحكم → **موظفو التجهيز** → إضافة موظف (هاتف + كلمة مرور).

## التشغيل

```bash
cd fulfillment_app
flutter pub get
flutter run --dart-define=API_BASE=https://rybellairaq.com
```

## بناء APK

```bash
flutter build apk --release --dart-define=API_BASE=https://rybellairaq.com
```

الملف: `build/app/outputs/flutter-apk/app-release.apk`

## متغيرات الخادم (اختياري)

| المتغير | الافتراضي | الوصف |
|---------|-----------|--------|
| `STAFF_REMINDER_ENABLED` | مفعّل | تعطيل التذكيرات = `0` |
| `STAFF_REMINDER_INTERVAL_MIN` | `5` | فحص الخادم كل X دقيقة |
| `STAFF_REMINDER_GAP_MIN` | `8` | الحد الأدنى بين تذكيرين |
