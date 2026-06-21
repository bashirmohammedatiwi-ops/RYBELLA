# ربط الدومين rybellairaq.com

## الفكرة

| الطبقة | الدور |
|--------|--------|
| **Nginx على السيرفر** | يستمع على 80/443 ويوجّه حسب اسم الدومين |
| **Docker Rybella** | يعمل على منافذ داخلية فقط (4000، 4003) — **لا يحتاج 80** |
| **مشاريع أخرى** | لها `server_name` خاص بها على نفس Nginx |

لا تعارض: منفذ 80 واحد على السيرفر، وكل دومين يُوجَّه لمشروعه.

```
المستخدم → rybellairaq.com:443 → Nginx (HOST) → localhost:4003 → rybella-webstore
المستخدم → admin.rybellairaq.com → Nginx (HOST) → localhost:4000 → rybella-web (admin + API)
```

---

## 1. DNS (عند مسجّل الدومين)

| النوع | الاسم | القيمة |
|-------|--------|--------|
| A | `@` | IP السيرفر (مثل `187.124.23.65`) |
| A | `www` | نفس IP |
| A | `admin` | نفس IP (اختياري — للوحة الإدارة) |

انتظر 5–30 دقيقة ثم تحقق:

```bash
dig +short rybellairaq.com
dig +short www.rybellairaq.com
```

---

## 2. متغيرات البيئة على السيرفر

```bash
cd ~/RYBELLA
nano deployment/.env
```

```env
HTTP_PORT=4000
WEBSTORE_PORT=4003
API_URL=https://rybellairaq.com
JWT_SECRET=قيمة_سرية_قوية
```

```bash
./deploy.sh
```

تحقق:

```bash
curl -s http://127.0.0.1:4003/api/health
curl -s http://127.0.0.1:4000/api/health
```

---

## 3. Nginx على السيرفر (HOST)

### متجر الويب — rybellairaq.com

```bash
cd ~/RYBELLA
git pull
sudo cp deployment/nginx-host-rybellairaq.conf /etc/nginx/sites-available/rybellairaq.com
sudo ln -sf /etc/nginx/sites-available/rybellairaq.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### لوحة الإدارة — admin.rybellairaq.com (اختياري)

```bash
sudo cp deployment/nginx-host-admin-rybellairaq.conf /etc/nginx/sites-available/admin.rybellairaq.com
sudo ln -sf /etc/nginx/sites-available/admin.rybellairaq.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. SSL (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx

# المتجر
sudo certbot --nginx -d rybellairaq.com -d www.rybellairaq.com

# لوحة الإدارة (إن أضفت admin)
sudo certbot --nginx -d admin.rybellairaq.com
```

بعد SSL، حدّث `.env`:

```env
API_URL=https://rybellairaq.com
```

```bash
cd ~/RYBELLA && ./deploy.sh
```

---

## 5. التحقق

- المتجر: https://rybellairaq.com
- API: https://rybellairaq.com/api/health
- لوحة الإدارة: https://admin.rybellairaq.com (إن فعّلتها)

---

## استكشاف الأخطاء

### الدومين يفتح مشروعاً آخر

- تحقق من `server_name` في `/etc/nginx/sites-enabled/`
- تأكد أن ملف `rybellairaq.com` مفعّل: `ls -la /etc/nginx/sites-enabled/`

### 502 Bad Gateway

```bash
docker compose ps
curl http://127.0.0.1:4003/
```

إن كانت الحاويات متوقفة: `cd ~/RYBELLA && ./deploy.sh`

### الصور لا تظهر

تأكد أن `API_URL=https://rybellairaq.com` في `deployment/.env` ثم `./deploy.sh`

### Certbot يفشل

- DNS يجب أن يشير إلى IP السيرفر
- المنفذ 80 يجب أن يكون مفتوحاً **للسيرفر** (Nginx HOST)، وليس لحاوية Rybella

---

## ملاحظة عن المنافذ

| المنفذ | الاستخدام |
|--------|-----------|
| 80 / 443 | Nginx على السيرفر — **مشترك** بين كل الدومينات |
| 4000 | Rybella Admin + API (Docker → localhost فقط) |
| 4003 | Rybella Web Store (Docker → localhost فقط) |

لا تفتح 4000 و 4003 في الجدار الناري للعامة؛ الوصول عبر الدومين فقط.
