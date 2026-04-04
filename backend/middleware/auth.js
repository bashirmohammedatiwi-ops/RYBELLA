const jwt = require('jsonwebtoken');

// محلياً: تخطي تسجيل الدخول للتطوير
const SKIP_AUTH = process.env.SKIP_AUTH === 'true' || process.env.NODE_ENV === 'development';

const auth = (req, res, next) => {
  if (SKIP_AUTH) {
    req.user = { id: 1, email: 'admin@rybella.iq', role: 'admin' };
    return next();
  }
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'الوصول غير مصرح به' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
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

module.exports = {
  auth,
  authenticate: auth,
  adminAuth,
  adminOnly: adminAuth,
  requireAdmin: adminAuth,
  authorizeAdmin: adminAuth
};
