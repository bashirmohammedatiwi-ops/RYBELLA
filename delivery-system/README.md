# شركة ديما الحياة - نظام التوصيل

## التحديث من GitHub على السيرفر

```bash
cd /opt/delivery-system
git pull origin main

# إيقاف Nginx إن كان يستخدم المنفذ 80
systemctl stop nginx

# إعادة تشغيل Caddy مع التعديلات الجديدة
docker-compose --profile https up -d caddy --force-recreate

# مسح الشهادات القديمة إن استمرت المشكلة
# docker-compose --profile https stop caddy
# docker volume rm delivery-system_caddy-data
# docker-compose --profile https up -d caddy
```

## التحقق

```bash
docker port delivery-caddy
# يجب أن يظهر: 80/tcp و 443/tcp

curl -I https://demaalhayaadelivery.online
# HTTP/2 200 بدون أخطاء SSL
```

## التعديلات المهمة

- **docker-compose.yml**: منفذ 80 مطلوب لـ Let's Encrypt (تحدي HTTP-01)
- **Caddyfile**: `tls <email>` لشهادة Let's Encrypt (لا تستخدم `tls internal`)
