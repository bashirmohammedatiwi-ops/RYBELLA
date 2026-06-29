const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// التأكد من وجود مجلد uploads محلياً
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const variantRoutes = require('./routes/variants');
const brandRoutes = require('./routes/brands');
const categoryRoutes = require('./routes/categories');
const subcategoryRoutes = require('./routes/subcategories');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const couponRoutes = require('./routes/coupons');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const deliveryZoneRoutes = require('./routes/deliveryZones');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const bannerRoutes = require('./routes/banners');
const storyRoutes = require('./routes/stories');
const offerRoutes = require('./routes/offers');
const webSettingsRoutes = require('./routes/webSettings');
const inventorySyncRoutes = require('./routes/inventorySync');
const backupRoutes = require('./routes/backups');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Middleware - زيادة حد حجم الطلب لدعم رفع صور/فيديو متعددة (413 Payload Too Large)
const allowedOrigins = [
  'https://rybellairaq.com',
  'https://www.rybellairaq.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/delivery-zones', deliveryZoneRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/web-settings', webSettingsRoutes);
app.use('/api/sync', inventorySyncRoutes);
app.use('/api/backups', backupRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'ok',
    message: 'Rybella Iraq API is running',
    uptime: Math.floor(process.uptime()),
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    },
  });
});

app.get('/api/health/backups', require('./controllers/backupController').health);

let syncJobRunning = false;

function startInventorySyncJob() {
  const intervalMin = parseInt(process.env.INVENTORY_SYNC_INTERVAL_MIN || '15', 10);
  if (!process.env.EXTERNAL_INVENTORY_API_URL) {
    console.log('Inventory auto-sync: EXTERNAL_INVENTORY_API_URL not set — bulk POS sync only');
    return;
  }
  const inventorySync = require('./services/inventorySyncService');
  const run = async () => {
    if (syncJobRunning) {
      console.warn('Inventory sync skipped: previous run still in progress');
      return;
    }
    syncJobRunning = true;
    try {
      const stats = await inventorySync.refreshAllFromExternal();
      if (!stats.authConfigured) {
        console.warn('Inventory sync skipped: configure EXTERNAL_INVENTORY_API_EMAIL/PASSWORD or TOKEN for Alhayaa');
        return;
      }
      console.log(`Inventory sync: ${stats.synced}/${stats.total} fetched, ${stats.linked} variants updated, ${stats.failed} failed`);
      if (stats.lastError) console.warn('Inventory sync last error:', stats.lastError);
      await require('./config/database').flushDb();
    } catch (e) {
      console.error('Inventory sync job error:', e.message);
    } finally {
      syncJobRunning = false;
    }
  };
  inventorySync.getSyncStatus().then((s) => {
    if (!s.authOk) {
      console.warn('Inventory sync: Alhayaa auth not configured — prices will NOT update until EMAIL/PASSWORD or TOKEN is set');
    } else {
      console.log('Inventory sync: Alhayaa auth OK');
    }
  }).catch(() => {});
  setTimeout(run, 15000);
  setInterval(run, Math.max(1, intervalMin) * 60 * 1000);
  console.log(`Inventory auto-sync every ${intervalMin} min from ${process.env.EXTERNAL_INVENTORY_API_URL}`);
}

// Database check endpoint (for debugging)
app.get('/api/health/db', async (req, res) => {
  try {
    const db = require('./config/database');
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('DB check error:', err.message);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: err.message,
      hint: 'تأكد من تشغيل MySQL وتنفيذ schema.sql و seed.sql'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  require('./config/database').flushDb()
    .catch(() => {})
    .finally(() => process.exit(1));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Rybella Iraq API running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  require('./config/database').query('SELECT 1').catch((e) => console.error('DB init:', e.message));
  startInventorySyncJob();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nالمنفذ ${PORT} مشغول. أغلق العملية السابقة أو غيّر PORT في .env\n`);
  }
  throw err;
});

['SIGTERM', 'SIGINT'].forEach((sig) => {
  process.on(sig, () => {
    console.log(`${sig} received — flushing database...`);
    require('./config/database').flushDb()
      .catch(() => {})
      .finally(() => {
        server.close(() => process.exit(0));
      });
  });
});

module.exports = app;
