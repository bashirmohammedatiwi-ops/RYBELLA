const jwt = require('jsonwebtoken');
const db = require('../config/database');

// محلياً: تخطي تسجيل الدخول للتطوير
const SKIP_AUTH = process.env.SKIP_AUTH === 'true' || process.env.NODE_ENV === 'development';

const auth = async (req, res, next) => {
  if (SKIP_AUTH) {
    req.user = { id: 1, email: 'admin@rybella.iq', role: 'admin' };
    return next();
  }
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'الوصول غير مصرح به' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (decoded.role === 'customer') {
      const [rows] = await db.query(
        'SELECT is_disabled FROM users WHERE id = ? AND deleted_at IS NULL',
        [decoded.id]
      );
      if (!rows.length) {
        return res.status(401).json({ message: 'الحساب غير موجود' });
      }
      if (rows[0].is_disabled) {
        return res.status(403).json({ message: 'تم تعطيل حسابك. تواصلي مع الدعم.' });
      }
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'رمز غير صالح أو منتهي الصلاحية' });
  }
};

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح - للمسؤولين فقط' });
    }
    next();
  });
};

const staffAuth = (req, res, next) => {
  auth(req, res, () => {
    if (!['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'غير مصرح - لموظفي التجهيز فقط' });
    }
    next();
  });
};

const staffOrAdminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (!['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'غير مصرح - للمسؤولين وموظفي التجهيز فقط' });
    }
    next();
  });
};

module.exports = {
  auth,
  authenticate: auth,
  adminAuth,
  adminOnly: adminAuth,
  requireAdmin: adminAuth,
  authorizeAdmin: adminAuth,
  staffAuth,
  staffOrAdminAuth,
};
