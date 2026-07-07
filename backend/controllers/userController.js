const db = require('../config/database');
const { purgeUserById } = require('../utils/purgeUser');
const { normalizeIraqiPhone, isValidIraqiPhone } = require('../utils/phone');
const {
  lookupByPhone,
  releaseCustomerPhone,
  findCustomerPhoneBlockers,
} = require('../utils/customerPhone');

exports.getAll = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
              (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS order_count
       FROM users u
       WHERE u.role = 'customer'
       ORDER BY u.created_at DESC`
    );
    res.json(users);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.lookupByPhone = async (req, res) => {
  try {
    const raw = req.query.phone || req.body?.phone;
    if (!raw) {
      return res.status(400).json({ message: 'رقم الهاتف مطلوب' });
    }
    const result = await lookupByPhone(raw);
    res.json(result);
  } catch (error) {
    console.error('Lookup phone error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.releasePhone = async (req, res) => {
  try {
    const raw = req.body?.phone;
    if (!raw) {
      return res.status(400).json({ message: 'رقم الهاتف مطلوب' });
    }
    const normalizedPhone = normalizeIraqiPhone(raw);
    if (!isValidIraqiPhone(normalizedPhone)) {
      return res.status(400).json({ message: 'رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 11 رقم' });
    }

    const blockers = await findCustomerPhoneBlockers(normalizedPhone);
    if (!blockers.length) {
      const lookup = await lookupByPhone(normalizedPhone);
      const other = lookup.users.filter((u) => u.role !== 'customer');
      if (other.length > 0) {
        return res.status(409).json({
          message: 'الرقم مستخدم لحساب غير عميل (مثل موظف أو مدير)',
          users: lookup.users,
        });
      }
      return res.status(404).json({ message: 'لا يوجد حساب عميل بهذا الرقم في قاعدة البيانات' });
    }

    const { released } = await releaseCustomerPhone(normalizedPhone, { force: true });
    res.json({
      message: released === 1
        ? 'تم تحرير الرقم وحذف حساب العميل — يمكنه التسجيل من جديد'
        : `تم تحرير الرقم وحذف ${released} حسابات عميل`,
      released,
    });
  } catch (error) {
    console.error('Release phone error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
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
      'SELECT id, role FROM users WHERE id = ?',
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

    await purgeUserById(userId);
    res.json({ message: 'تم حذف العميل بنجاح' });
  } catch (error) {
    console.error('Delete customer error:', error);
    if (error.code === 'USER_DELETE_FAILED') {
      return res.status(500).json({ message: 'تعذّر حذف العميل — حاول مرة أخرى أو تواصل مع الدعم' });
    }
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
