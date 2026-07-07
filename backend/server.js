const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cluster = require('cluster');
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
const manualDiscountRoutes = require('./routes/manualDiscounts');
const staffRoutes = require('./routes/staff');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const WEB_CONCURRENCY = Math.max(1, parseInt(process.env.WEB_CONCURRENCY || '1', 10));
const USE_CLUSTER = process.env.NODE_ENV === 'production' && WEB_CONCURRENCY > 1;

let syncJobRunning = false;

function startOrderReminderJob() {
  const { startOrderReminderJob: start } = require('./services/orderReminderService');
  start();
}

function startManualDiscountExpiryJob() {
  const { expireManualDiscounts } = require('./services/pricingService');
  const db = require('./config/database');
  const run = async () => {
    try {
      const expired = await expireManualDiscounts(db);
      if (expired > 0) {
        console.log(`Manual discounts expired: restored sync pricing for ${expired} variants`);
      }
    } catch (e) {
      console.error('Manual discount expiry job error:', e.message);
    }
  };
  setTimeout(run, 20000);
  setInterval(run, 5 * 60 * 1000);
}

function startInventorySyncJob() {
  if (process.env.INVENTORY_AUTO_SYNC === '0' || process.env.INVENTORY_AUTO_SYNC === 'false') {
    console.log('Inventory auto-sync: disabled (INVENTORY_AUTO_SYNC=0)');
    return;
  }
  const intervalMin = parseInt(process.env.INVENTORY_SYNC_INTERVAL_MIN || '30', 10);
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

function createApp() {
const app = express();

// Middleware - زيادة حد حجم الطلب لدعم رفع صور/فيديو متعددة (413 Payload Too Large)
const allowedOrigins = [
  'https://rybellairaq.com',
  'https://www.rybellairaq.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return true;
    }
  } catch (_) {
    /* ignore */
  }
  return false;
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
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
app.use('/api/manual-discounts', manualDiscountRoutes);
app.use('/api/staff', staffRoutes);

// Health check — يفحص الذاكرة وقاعدة البيانات
app.get('/api/health', async (req, res) => {
  const mem = process.memoryUsage();
  let dbOk = false;
  let dbError = null;
  try {
    const database = require('./config/database');
    await database.query('SELECT 1');
    dbOk = await database.checkIntegrity();
  } catch (e) {
    dbError = e.message;
  }
  const status = dbOk ? 'ok' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    status,
    message: dbOk ? 'Rybella Iraq API is running' : 'API up but database unavailable',
    uptime: Math.floor(process.uptime()),
    database: dbOk ? 'connected' : 'error',
    dbError,
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    },
  });
});

app.get('/api/health/backups', require('./controllers/backupController').health);

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
      hint: 'تحقق من DATABASE_URL وخدمة postgres',
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

return app;
}

function attachProcessHandlers(server) {
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  require('./config/database').flushDb()
    .catch(() => {})
    .finally(() => process.exit(1));
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
}

function startHttpServer() {
  const app = createApp();
  const server = app.listen(PORT, '0.0.0.0', async () => {
    const workerLabel = cluster.isWorker ? ` worker ${cluster.worker.id}` : '';
    console.log(`Rybella Iraq API running on http://localhost:${PORT}${workerLabel}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    try {
      await require('./config/database').init();
      console.log('[pg] database connected');
    } catch (e) {
      console.error('DB init:', e.message);
    }
    if (!USE_CLUSTER) {
      startInventorySyncJob();
      startManualDiscountExpiryJob();
      startOrderReminderJob();
    }
  });
  attachProcessHandlers(server);
  return { app, server };
}

function bootstrap() {
  if (USE_CLUSTER && cluster.isPrimary) {
    console.log(`Starting ${WEB_CONCURRENCY} API workers (WEB_CONCURRENCY=${WEB_CONCURRENCY})`);
    for (let i = 0; i < WEB_CONCURRENCY; i += 1) {
      cluster.fork();
    }
    cluster.on('exit', (worker, code) => {
      console.warn(`Worker ${worker.process.pid} exited (${code}), restarting...`);
      cluster.fork();
    });
    require('./config/database').init()
      .then(() => {
        console.log('[pg] primary database connected');
        startInventorySyncJob();
        startManualDiscountExpiryJob();
        startOrderReminderJob();
      })
      .catch((e) => console.error('Primary DB init:', e.message));
    return null;
  }

  const { app } = startHttpServer();
  return app;
}

const app = bootstrap();

module.exports = app;
