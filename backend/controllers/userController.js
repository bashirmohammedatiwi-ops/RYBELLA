const db = require('../config/database');
const { softDeleteCustomer, setCustomerDisabled } = require('../utils/customerAccount');
const { createCustomerAccount, mapCreateError } = require('../utils/createCustomer');
const { normalizeIraqiPhone, isValidIraqiPhone } = require('../utils/phone');

function sanitizeCustomer(user) {
  if (!user) return user;
  const hiddenEmail = user.email?.endsWith('@phone.rybella.iq') || user.email?.includes('@deleted.rybella.iq');
  return {
    id: user.id,
    name: user.name,
    email: hiddenEmail ? null : user.email,
    phone: user.phone,
    role: user.role,
    created_at: user.created_at,
    order_count: user.order_count,
    is_disabled: !!user.is_disabled,
  };
}

exports.getAll = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at, COALESCE(u.is_disabled, FALSE) AS is_disabled,
              (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS order_count
       FROM users u
       WHERE u.role = 'customer' AND u.deleted_at IS NULL
       ORDER BY u.is_disabled ASC, u.created_at DESC`
    );
    res.json(users.map(sanitizeCustomer));
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const user = await createCustomerAccount(req.body);
    res.status(201).json({
      message: 'تم إنشاء حساب العميل بنجاح',
      user: sanitizeCustomer(user),
    });
  } catch (error) {
    if (error.code) {
      return res.status(400).json({ message: mapCreateError(error) });
    }
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    res.json(sanitizeCustomer(users[0]));
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.setDisabled = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: 'معرّف العميل غير صالح' });
    }

    if (req.user.id === userId) {
      return res.status(400).json({ message: 'لا يمكنك تعطيل حسابك الحالي' });
    }

    const disabled = !!req.body.disabled;
    await setCustomerDisabled(userId, disabled);

    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at, COALESCE(u.is_disabled, FALSE) AS is_disabled,
              (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS order_count
       FROM users u WHERE u.id = ?`,
      [userId]
    );

    res.json({
      message: disabled ? 'تم تعطيل حساب العميل' : 'تم تفعيل حساب العميل',
      user: sanitizeCustomer(users[0]),
    });
  } catch (error) {
    console.error('Set customer disabled error:', error);
    if (error.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }
    if (error.code === 'NOT_CUSTOMER') {
      return res.status(403).json({ message: 'يمكن تعطيل العملاء فقط' });
    }
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: 'معرّف العميل غير صالح' });
    }

    if (req.user.id === userId) {
      return res.status(400).json({ message: 'لا يمكنك حذف حسابك الحالي' });
    }

    const [users] = await db.query(
      'SELECT id, role FROM users WHERE id = ? AND deleted_at IS NULL',
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }

    const user = users[0];
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'لا يمكن حذف حساب المدير' });
    }
    if (user.role !== 'customer') {
      return res.status(403).json({ message: 'يمكن حذف العملاء فقط من هذه الصفحة' });
    }

    await softDeleteCustomer(userId);
    res.json({ message: 'تم حذف العميل وتحرير رقم الهاتف' });
  } catch (error) {
    console.error('Delete customer error:', error);
    if (error.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
