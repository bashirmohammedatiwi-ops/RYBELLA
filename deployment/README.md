# Rybella Iraq - دليل النشر على VPS باستخدام Docker

## هيكل المشروع

| المكون | التقنية | الوصف |
|--------|---------|-------|
| **Backend** | Node.js + Express | API على المنفذ 4000 |
| **Admin Dashboard** | React + Vite | لوحة إدارة (المنفذ 4000) |
| **Web Store** | React + Vite | متجر الويب (المنفذ 4001) |
| **قاعدة البيانات** | SQLite (sql.js) | ملفية، لا تحتاج حاوية منفصلة |
| **Mobile** | Expo/React Native | يعمل على الأجهزة، يتصل بـ API المنشور |

---

## الأوامر الكاملة للنشر على VPS

```bash
# 1. استنساخ المستودع
git clone https://github.com/bashirmohammedatiwi-ops/RYBELLA.git
cd RYBELLA

# 2. نسخ ملف البيئة وتعديله
cp deployment/.env.example deployment/.env
nano deployment/.env   # أو استخدم محرر آخر

# 3. تشغيل المشروع (بناء وتشغيل)
cd deployment
docker compose up -d --build

# للتشغيل لاحقاً بدون إعادة بناء:
docker compose up -d
```

---

## التحقق من التشغيل

```bash
# عرض الحاويات
docker compose ps

# عرض السجلات
docker compose logs -f

# لوحة الإدارة: http://YOUR_VPS_IP:4000
# متجر الويب:  http://YOUR_VPS_IP:4001
```

**بيانات الدخول الافتراضية للوحة الإدارة:**
- البريد: `admin@rybella.iq`
- كلمة المرور: `Admin@123`

---

## شرح الملفات

### 1. `backend.Dockerfile`
- **الغرض:** بناء صورة Docker لـ Backend API
- **القاعدة:** `node:18-alpine`
- **الخطوات:**
  - نسخ ملفات Backend وملف seed
  - تثبيت الحزم (إنتاج فقط)
  - تشغيل التطبيق على المنفذ 4000
- **المنفذ الداخلي:** 4000 (لتجنب التعارض مع المنفذ 3000)

### 2. `admin.Dockerfile`
- **الغرض:** بناء لوحة الإدارة وخدمتها
- **مرحلتان:**
  1. **Builder:** بناء تطبيق React باستخدام Vite
  2. **Production:** نسخ الملفات المبنية إلى Nginx
- **متغير البناء:** `VITE_API_URL=/api` لربط الواجهة بالـ API عبر المسار النسبي

### 3. `docker-compose.yml`
- **الخدمات:**
  - **backend:** API على المنفذ 4000، مع volumes لقاعدة البيانات والملفات المرفوعة
  - **web:** لوحة الإدارة (Nginx) على المنفذ 4000
  - **webstore:** متجر الويب (Nginx) على المنفذ 4001
- **الشبكة:** `rybella-network` للاتصال بين الخدمات
- **Volumes:** حفظ قاعدة البيانات والملفات المرفوعة

### 4. `nginx.conf`
- **الغرض:** إعداد Nginx كـ Reverse Proxy
- **المسارات:**
  - `/api/` → Backend:4000
  - `/uploads/` → Backend:4000
  - `/` → ملفات لوحة الإدارة (SPA)
- **إضافات:** ضغط Gzip وتخزين مؤقت للملفات الثابتة

### 5. `.env.example` و `.env`
- **الغرض:** متغيرات البيئة للإنتاج
- **المتغيرات الأساسية:**
  - `JWT_SECRET`: مفتاح JWT (يجب تغييره)
  - `API_URL`: رابط الموقع (لروابط الصور)
  - `HTTP_PORT`: منفذ الوصول (افتراضي 4000)

---

## أوامر إضافية مفيدة

```bash
# إيقاف المشروع
docker compose down

# إيقاف مع حذف الـ volumes (سيحذف قاعدة البيانات!)
docker compose down -v

# إعادة البناء من الصفر
docker compose build --no-cache
docker compose up -d

# عرض سجلات خدمة معينة
docker compose logs -f backend
docker compose logs -f web
docker compose logs -f webstore
```

---

## ملاحظات Production

1. **JWT_SECRET:** استخدم قيمة عشوائية قوية في الإنتاج
2. **API_URL:** ضع رابط الدومين الفعلي (مثل `https://rybella.example.com`)
3. **HTTPS:** استخدم Certbot أو Nginx كـ reverse proxy أمامي لتفعيل SSL
4. **النسخ الاحتياطي:** احفظ مجلدات `backend_data` و `backend_uploads` بشكل دوري
