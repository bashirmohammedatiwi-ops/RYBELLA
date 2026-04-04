# Rybella Iraq - تصدير APK للتوزيع الخارجي

## الإعدادات الحالية
- **السيرفر:** http://187.124.23.65:4000
- **API:** http://187.124.23.65:4000/api

## سياسة الخصوصية (للمتاجر)
- التطبيق يعرض سياسة الخصوصية من شاشة الملف الشخصي (حسابي).
- لـ App Store و Google Play: ارفع ملف `mobile-app/public/privacy-policy.html` على موقعك وضَع الرابط في إعدادات المتجر.
- مثال: `https://your-domain.com/privacy-policy.html`

---

## الطريقة 1: EAS Build (موصى بها - سحابي)

### 1. التثبيت والتهيئة (مرة واحدة)

```bash
npm install -g eas-cli
eas login
```

> حساب Expo مجاني: https://expo.dev/signup

### 2. أوامر التصدير

```bash
cd mobile-app
npm install
eas build --platform android --profile production
```

أو باستخدام السكربت:
```bash
cd mobile-app
npm run build:apk
```

### 3. مع تغيير عنوان السيرفر

```bash
cd mobile-app
EXPO_PUBLIC_API_URL=http://187.124.23.65:4000 eas build --platform android --profile production
```

### النتيجة
- بعد اكتمال البناء (حوالي 10–15 دقيقة) على https://expo.dev ستظهر:
  - **رابط APK** — للتثبيت المباشر على الأجهزة
  - **رابط AAB** — لرفعه على Google Play

---

## الطريقة 2: البناء المحلي (بدون اتصال سحابي)

### المتطلبات
- Android Studio
- Java 17 (أو أحدث)
- Node.js
- JDK 17

### إذا ظهر خطأ: GradleWrapperMain ClassNotFoundException

أضف أمر الإصلاح قبل البناء:

```powershell
cd "c:\Users\hp\Desktop\تطبيقات الحياة\rybella-application\mobile-app"
node scripts/fix-gradle-wrapper.js
```

أو: `npm run fix:gradle`

### الأوامر الكاملة (PowerShell)

```powershell
cd "c:\Users\hp\Desktop\تطبيقات الحياة\rybella-application\mobile-app"
npm install
npx expo prebuild --clean
npm run fix:gradle
cd android
.\gradlew.bat assembleRelease
```

### موقع ملف APK الناتج

```
mobile-app\android\app\build\outputs\apk\release\app-release.apk
```

---

## تغيير عنوان السيرفر

عدّل `mobile-app/src/config.js`:
```javascript
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://187.124.23.65:4000';
```

أو عند البناء:
```bash
EXPO_PUBLIC_API_URL=http://your-server.com:4000 eas build --platform android --profile production
```

---

## توقيع APK (للتوزيع الخارجي الرسمي)

للبناء المحلي وللتوزيع خارجياً بشكل رسمي، يمكنك توقيع APK باستخدام keystore:

1. إنشاء keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore rybella.keystore -alias rybella -keyalg RSA -keysize 2048 -validity 10000
```

2. إضافة التوقيع في `android/gradle.properties` أو عبر EAS credentials.

راجع: https://docs.expo.dev/build-reference/local-builds/
