# Rybella Iraq - دليل النشر على VPS باستخدام Docker

> **تنبيه:** الملف [`deployment/docker-compose.yml`](docker-compose.yml) القديم (SQLite) **مهمل**. استخدم [`docker-compose.yml`](../docker-compose.yml) في جذر المشروع مع PostgreSQL و `./deploy.sh`.

## هيكل المشروع

| المكون | التقنية | الوصف |
|--------|---------|-------|
| **Backend** | Node.js + Express | API على المنفذ 4000 |
| **Admin Dashboard** | React + Vite | لوحة إدارة (المنفذ 4000) |
| **Web Store** | React + Vite | متجر الويب (المنفذ 4003) |
| **قاعدة البيانات** | PostgreSQL 16 | حاوية `postgres` |
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

# 3. تشغيل المشروع (بناء وتشغيل) — من جذر المشروع
./deploy.sh

# أو يدوياً:
docker compose --env-file deployment/.env up -d --build

# للتشغيل لاحقاً بدون إعادة بناء:
docker compose --env-file deployment/.env up -d
```

### تحديث السيرفر (بعد git pull)

```bash
cd ~/RYBELLA
git pull origin master
./deploy.sh
```

---

## التحقق من التشغيل

```bash
# عرض الحاويات
docker compose ps

# عرض السجلات
docker compose logs -f

# لوحة الإدارة: http://YOUR_VPS_IP:4000
# متجر الويب:  http://YOUR_VPS_IP:4003
```

### صور البطاقات والأداء

بعد النشر، يشغّل `deploy.sh` تلقائياً تسخين صور البطاقات (WebP 200px) **قبل** إعلان الجاهزية.

```bash
# تسخين يدوي لصور البطاقات فقط
docker exec rybella-backend node scripts/warm-upload-images.js --cards-only

# ضغط الصور الموجودة على السيرفر (معاينة بدون تغيير)
docker exec rybella-backend node scripts/compress-upload-images.js --dry-run

# ضغط فعلي + نسخة احتياطية + إعادة توليد WebP
docker exec rybella-backend node scripts/compress-upload-images.js --backup --rewarm

# تنظيف ملفات cache اليتيمة (بدون أصل)
docker exec rybella-backend node scripts/prune-image-cache.js

# تخطي التسخين عند النشر
SKIP_WARM=1 ./deploy.sh
```

**ضغط الصور:** يُصغّر الملفات الأكبر من 100KB إلى عرض أقصى 1400px بجودة ~82% (نفس الاسم — لا يحتاج تحديث قاعدة البيانات). الصور الجديدة تُضغَّط تلقائياً عند الرفع من لوحة التحكم.

متغيرات اختيارية في `deployment/.env`:
- `IMAGE_MAX_ORIGINAL_WIDTH=1400`
- `IMAGE_ORIGINAL_JPEG_QUALITY=82`
- `IMAGE_COMPRESS_MIN_BYTES=100000`

Nginx في متجر الويب يخزّن مؤقتاً:
- JSON الكتالوج و `/api/storefront/home` (90 ثانية)
- `/uploads/.cache/` و `/api/img` (حتى 365 يوم للملفات الجاهزة)

راقب `X-Cache-Status` في سجلات Nginx لمعرفة نسبة الـ hit.

**بيانات الدخول الافتراضية للوحة الإدارة:**
- البريد: `admin@rybella.iq`
- كلمة المرور: `Admin@123`

---

## شرح الملفات

### 1. `backend.Dockerfile`
- **الغرض:** بناء صورة Docker لـ Backend API
- **القاعدة:** `node:20-alpine` (مطلوب لـ sharp / تحسين الصور)
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

---

## معايير التحقق بعد النشر

1. **صور البطاقات:** على `/` و `/explore` — لا تختفي الصور بعد التحميل ولا تظهر أيقونة مكسورة
2. **أول فتح:** LCP أقل من 3 ثوانٍ على محاكاة mobile/4G (DevTools Lighthouse)
3. **السيرفر:** طلب cache miss لنفس الصورة = عملية Sharp واحدة (in-flight dedup)
4. **بعد `./deploy.sh`:** يكتمل warm البطاقات قبل رسالة «جاهز للاستخدام»
5. **Network:** صفحة explore الأولى — بطاقات WebP ~200px

```bash
# تحقق من عينة cache
curl -I "https://rybellairaq.com/uploads/.cache/w200_q72_webp/..."
# يجب: HTTP 200 + Cache-Control: public, immutable
```
