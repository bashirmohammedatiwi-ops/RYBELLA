# Rybella Iraq - Cosmetics E-commerce Platform

A professional cosmetics e-commerce platform for the Iraqi market, built with Node.js, React, and React Native.

## Features

- **Cosmetics-specific:** Multiple shades/colors per product, barcodes, expiration dates, batch tracking
- **Arabic RTL:** Full Arabic interface with right-to-left layout
- **Currency:** Iraqi Dinar (IQD)
- **REST API:** JWT authentication, image uploads
- **Admin Dashboard:** Complete product, order, and customer management
- **Mobile App:** Native experience with Expo (iOS & Android)

## Project Structure

```
rybella-application/
├── backend/           # Node.js + Express API
├── admin-dashboard/  # React admin panel (MUI)
├── mobile-app/       # React Native Expo app
├── database/         # MySQL schema & seed
└── docs/             # API docs & deployment
```

## قبل التشغيل - إيقاف العمليات الجارية

**يُفضّل إيقاف أي عمليات تعمل مسبقاً (Backend، Admin، Mobile) قبل التشغيل لتجنب تعارض المنافذ.**

### Windows (PowerShell)

```powershell
# إيقاف عمليات Node.js على المنافذ المستخدمة
# المنفذ 5000 (Backend) | المنفذ 5173 (Admin) | المنفذ 8081 (Expo)

# عرض العمليات على المنفذ 5000
netstat -ano | findstr :5000

# إيقاف العملية (استبدل PID برقم العملية من الأمر السابق)
taskkill /PID <PID> /F

# أو إيقاف جميع عمليات node
taskkill /IM node.exe /F
```

### أوامر سريعة

| المنفذ | الاستخدام | الأمر |
|--------|-----------|-------|
| 5000 | Backend API | `netstat -ano \| findstr :5000` |
| 5173 | Admin Dashboard | `netstat -ano \| findstr :5173` |
| 8081 | Expo Metro | `netstat -ano \| findstr :8081` |

---

## Quick Start

### 1. Database
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p rybella_iraq < database/seed.sql
```

### 2. Backend
```bash
cd backend && npm install && cp .env.example .env
# Edit .env with MySQL credentials
npm start
```

### 3. Admin Dashboard
```bash
cd admin-dashboard && npm install && npm run dev
```

### 4. Mobile App
```bash
cd mobile-app && npm install && npx expo start
```

**Default Admin:** admin@rybella.iq / Admin@123

## Documentation

- [API Documentation](docs/API_DOCUMENTATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, MySQL, JWT, Multer |
| Admin | React, Vite, MUI, Axios |
| Mobile | React Native, Expo, React Navigation |
| Database | MySQL 8.0 |

## License

Proprietary - Rybella Iraq
