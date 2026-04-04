# Rybella Iraq - Deployment Guide

## Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

---

## Local Development

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database and run schema
source database/schema.sql
source database/seed.sql
```

Or run manually:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p rybella_iraq < database/seed.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and JWT_SECRET

npm install
npm start
```

Backend runs on `http://localhost:5000`

**Default admin:** admin@rybella.iq / Admin@123

### 3. Admin Dashboard

```bash
cd admin-dashboard
cp .env.example .env  # Optional: set VITE_API_URL if backend is elsewhere
npm install
npm run dev
```

Admin runs on `http://localhost:5173`

### 4. Mobile App

```bash
cd mobile-app
npm install
npx expo start
```

- For Android: Press `a` in terminal or scan QR with Expo Go
- For iOS: Press `i` or scan with Camera app
- Update `src/config.js` with your machine's IP for physical device testing (replace localhost with 192.168.x.x)

---

## VPS Deployment

### Server Requirements

- Ubuntu 22.04 LTS (or similar)
- 2GB RAM minimum
- Node.js 18+
- MySQL 8.0
- Nginx (reverse proxy)
- PM2 (process manager)

### 1. Install Dependencies

```bash
sudo apt update
sudo apt install -y nodejs npm mysql-server nginx
sudo npm install -g pm2
```

### 2. MySQL Setup

```bash
sudo mysql -u root

CREATE DATABASE rybella_iraq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rybella'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON rybella_iraq.* TO 'rybella'@'localhost';
FLUSH PRIVILEGES;
EXIT;

mysql -u rybella -p rybella_iraq < database/schema.sql
mysql -u rybella -p rybella_iraq < database/seed.sql
```

### 3. Backend Deployment

```bash
cd /var/www/rybella-application/backend
npm install --production
cp .env.example .env
# Edit .env:
# DB_HOST=localhost
# DB_USER=rybella
# DB_PASSWORD=your_password
# DB_NAME=rybella_iraq
# JWT_SECRET=your_secure_random_string
# PORT=5000

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Start with PM2
pm2 start server.js --name rybella-api
pm2 save
pm2 startup
```

### 4. Admin Dashboard Build

```bash
cd /var/www/rybella-application/admin-dashboard
npm install
# Set VITE_API_URL to your API URL (e.g. https://api.rybella.iq)
npm run build
```

### 5. Nginx Configuration

```nginx
# /etc/nginx/sites-available/rybella

# API
server {
    listen 80;
    server_name api.rybella.iq;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        client_max_body_size 10M;
    }
    
    location /uploads {
        alias /var/www/rybella-application/backend/uploads;
    }
}

# Admin Dashboard
server {
    listen 80;
    server_name admin.rybella.iq;
    root /var/www/rybella-application/admin-dashboard/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/rybella /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL with Let's Encrypt (Recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.rybella.iq -d admin.rybella.iq
```

### 7. Mobile App Production

For production mobile app:
- Update `mobile-app/src/config.js` with production API URL
- Build with EAS Build: `eas build --platform all`
- Or use Expo's build service for APK/IPA

---

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 5000) |
| DB_HOST | MySQL host |
| DB_USER | MySQL user |
| DB_PASSWORD | MySQL password |
| DB_NAME | Database name |
| JWT_SECRET | Secret for JWT signing |

### Admin Dashboard (.env)

| Variable | Description |
|----------|-------------|
| VITE_API_URL | API base URL (e.g. https://api.rybella.iq/api) |

### Mobile App (src/config.js)

| Variable | Description |
|----------|-------------|
| API_URL | API base URL with /api |

---

## Scaling Considerations

1. **Database:** Use connection pooling (mysql2 supports it)
2. **File Storage:** Consider S3 or similar for production uploads
3. **Caching:** Add Redis for session/cache
4. **Load Balancer:** Multiple API instances behind nginx
5. **CDN:** Serve static uploads via CDN
