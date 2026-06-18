# رفع المشروع عبر Docker على المنفذ 4000

## متطلبات
- Docker
- Docker Compose

## التشغيل السريع

```bash
cd RYBELLA
cp deployment/.env.example deployment/.env
# عدّل deployment/.env: JWT_SECRET, API_URL
./deploy.sh
```

**أو على Windows:** انقر مرتين على `deployment/docker-up.bat`

## الوصول
- **لوحة التحكم:** http://localhost:4000 (أو http://YOUR_SERVER_IP:4000)
- **تسجيل الدخول:** admin@rybella.iq / Admin@123

## الأوامر
| الأمر | الوصف |
|-------|-------|
| `docker compose up -d --build` | بناء وتشغيل |
| `docker compose down` | إيقاف |
| `docker compose logs -f` | عرض السجلات |
| `docker compose ps` | عرض الحالة |
