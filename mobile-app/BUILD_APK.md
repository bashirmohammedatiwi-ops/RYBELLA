# Rybella Iraq - تصدير APK

## الإعدادات الحالية
- **السيرفر:** http://187.124.23.65
- **API:** http://187.124.23.65/api

---

## الطريقة 1: EAS Build (موصى بها - سحابي)

### المتطلبات
- حساب Expo (مجاني): https://expo.dev/signup
- تثبيت EAS CLI: `npm install -g eas-cli`
- تسجيل الدخول: `eas login`

### الأمر الكامل للتصدير

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

### النتيجة
- بعد اكتمال البناء (حوالي 10–15 دقيقة)، ستظهر روابط لتحميل:
  - **APK** (للتثبيت المباشر)
  - **AAB** (لرفعه على Google Play)

---

## الطريقة 2: البناء المحلي (بدون EAS)

### المتطلبات
- Android Studio
- Java 17
- Node.js

### الأوامر

```bash
cd mobile-app
npm install
npx expo prebuild
cd android
./gradlew assembleRelease
```

### موقع ملف APK
```
mobile-app/android/app/build/outputs/apk/release/app-release.apk
```

### ملاحظة Windows
استخدم بدلاً من `./gradlew`:
```bash
gradlew.bat assembleRelease
```

---

## تغيير عنوان السيرفر
عدّل الملف `src/config.js`:
```javascript
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_NEW_IP';
```

أو عند البناء:
```bash
EXPO_PUBLIC_API_URL=http://your-server.com eas build --platform android
```

---

## توقيع APK للنشر (البناء المحلي)
للتوزيع الخارجي، تحتاج لتوقيع التطبيق:
1. إنشاء keystore
2. إضافة بيانات التوقيع في `android/gradle.properties`

راجع: https://docs.expo.dev/build-reference/local-builds/
