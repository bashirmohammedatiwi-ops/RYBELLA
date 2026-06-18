# Rybella Admin — تطبيق سطح المكتب

تطبيق سطح مكتب **عالي الأداء** مبني بـ [Tauri 2](https://tauri.app/) — يستخدم WebView الخاص بالنظام (WebView2 على Windows، WKWebView على macOS) بدلاً من Chromium كامل كما في Electron.

**الحجم التقريبي:** ~5–15 MB (مقابل 150+ MB في Electron)

---

## المتطلبات

### macOS
```bash
xcode-select --install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Windows
- [Rust](https://rustup.rs/)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) مع C++
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (مثبت مسبقاً على Windows 10/11)

---

## التثبيت

```bash
cd admin-dashboard
npm install
npm run desktop:icon
```

---

## التطوير (وضع التطوير)

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — تطبيق سطح المكتب
cd admin-dashboard
npm run desktop:dev
```

---

## بناء ملف التثبيت

### macOS (Apple Silicon)
```bash
cd admin-dashboard
npm run desktop:build:mac
```

### macOS (Intel)
```bash
npm run desktop:build:mac-intel
```

### Windows
```bash
npm run desktop:build:win
```

### جميع المنصات (على الجهاز الحالي)
```bash
npm run desktop:build
```

**مخرجات البناء:**
- macOS: `src-tauri/target/release/bundle/dmg/` و `.app`
- Windows: `src-tauri/target/release/bundle/msi/` و `.exe`

---

## إعداد عنوان السيرفر

عدّل `admin-dashboard/.env.desktop` قبل البناء:

```env
VITE_API_URL=http://187.124.23.65:4000/api
VITE_DESKTOP_SERVER=http://187.124.23.65:4000
```

يُضبط عنوان السيرفر في `admin-dashboard/.env.desktop` عند البناء فقط.

---

## لماذا Tauri وليس Electron؟

| | Tauri | Electron |
|---|-------|----------|
| الحجم | ~5–15 MB | ~150+ MB |
| الذاكرة | WebView النظام | Chromium كامل |
| الأداء | ممتاز | جيد |
| مناسب للوحة إدارة | ✅ | ✅ (أثقل) |

لوحة الإدارة تتصل بـ API على السيرفر — لا حاجة لتشغيل Node.js داخل التطبيق، لذلك Tauri هو الخيار الأمثل.

---

## ملاحظات

- التطبيق يعمل **online** ويتصل بـ API على السيرفر
- تأكد أن السيرفر يعمل على المنفذ `4000` وأن CORS مفعّل (مفعّل افتراضياً)
- نفس حساب المسؤول المستخدم في الويب
