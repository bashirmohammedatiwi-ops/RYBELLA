# التشغيل المحلي للتطوير والاختبار

## المتطلبات
- Node.js 18+
- npm

**ملاحظة:** المشروع يستخدم SQLite (ملف) - لا تحتاج MySQL للتطوير المحلي.

---

## التشغيل السريع (للمسارات التي تحتوي أحرف عربية)

### الطريقة 1: من سطح المكتب (مُوصى بها)
انقر مرتين على: **`C:\Users\hp\Desktop\start-rybella.bat`**
- يعمل دون الحاجة لفتح مجلد المشروع
- يتجنب مشاكل المسارات العربية في الطرفية

### الطريقة 2: من داخل المشروع
انقر مرتين على: **`dev-local.bat`**

### الطريقة 3: من PowerShell (Cursor)
```powershell
& "C:\Users\hp\Desktop\تطبيقات الحياة\rybella-application\start.ps1"
```
أو:
```powershell
Set-Location -LiteralPath "C:\Users\hp\Desktop\تطبيقات الحياة\rybella-application"
node run.js
```

### الطريقة 4: من CMD
```cmd
cd /d "C:\Users\hp\Desktop\تطبيقات الحياة\rybella-application"
node run.js
```

**مهم:** استخدم علامتي اقتباس `"` حول المسار إذا احتوى مسافات أو أحرف عربية.

### الطريقة 2: الأوامر يدوياً

```bash
# 1. تثبيت المتطلبات (مرة واحدة)
npm run setup

# 2. تشغيل Backend (نافذة أولى)
npm run backend

# 3. تشغيل لوحة التحكم (نافذة ثانية)
npm run admin
```

---

## الروابط المحلية

| الخدمة | الرابط |
|--------|--------|
| **لوحة التحكم** | http://localhost:3001 |
| **Backend API** | http://localhost:5000 |
| **API Health** | http://localhost:5000/api/health |

**تسجيل الدخول:** admin@rybella.iq / Admin@123

---

## المنافذ المستخدمة
- **5000** - Backend
- **3001** - لوحة التحكم (Admin)

---

## تطبيق الموبايل (اختياري)

للتطوير مع التطبيق على جهاز أو محاكي:

```bash
cd mobile-app
npm install
npx expo start
```

عدّل `mobile-app/.env`:
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000
```
(استخدم IP جهازك مثل 192.168.1.5 - أو 10.0.2.2 لمحاكي أندرويد)
