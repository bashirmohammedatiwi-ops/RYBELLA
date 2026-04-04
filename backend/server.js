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

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Middleware - زيادة حد حجم الطلب لدعم رفع صور/فيديو متعددة (413 Payload Too Large)
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rybella Iraq API is running' });
});

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

// بدء التشغيل - الاستماع على جميع الواجهات (0.0.0.0) للسماح للأجهزة الأخرى بالاتصال
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Rybella Iraq API running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  require('./config/database').query('SELECT 1').catch((e) => console.error('DB init:', e.message));
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\nالمنفذ 5000 مشغول. أغلق نافذة Backend السابقة أو نفّذ:');
    console.error('  netstat -ano | findstr :5000');
    console.error('  taskkill /F /PID <الرقم_المعروض>\n');
  }
  throw err;
});

module.exports = app;
