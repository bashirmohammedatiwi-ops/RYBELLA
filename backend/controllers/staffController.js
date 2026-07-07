const db = require('../config/database');
const bcrypt = require('bcrypt');
const { normalizeIraqiPhone, isValidIraqiPhone } = require('../utils/phone');
const { purgeUserById } = require('../utils/purgeUser');

function phonePlaceholderEmail(phone) {
  return `${phone}@staff.rybella.iq`;
}

function sanitizeStaff(user) {
  if (!user) return user;
  const displayEmail = user.email?.endsWith('@staff.rybella.iq') || user.email?.endsWith('@phone.rybella.iq')
    ? null
    : user.email;
  return {
    id: user.id,
    name: user.name,
    email: displayEmail,
    phone: user.phone,
    role: user.role,
    created_at: user.created_at,
  };
}

exports.getAll = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, name, email, phone, role, created_at
       FROM users WHERE role = 'staff' ORDER BY created_at DESC`
    );
    res.json(users.map(sanitizeStaff));
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, password, email } = req.body;
    if (!name?.trim() || !password) {
      return res.status(400).json({ message: 'الاسم وكلمة المرور مطلوبة' });
    }

    const normalizedPhone = phone ? normalizeIraqiPhone(phone) : null;
    if (!normalizedPhone) {
      return res.status(400).json({ message: 'رقم الهاتف مطلوب' });
    }
    if (!isValidIraqiPhone(normalizedPhone)) {
      return res.status(400).json({ message: 'رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 11 رقم' });
    }

    const [existingPhone] = await db.query('SELECT id FROM users WHERE phone = ?', [normalizedPhone]);
    if (existingPhone.length > 0) {
      return res.status(400).json({ message: 'رقم الهاتف مستخدم بالفعل' });
    }

    const userEmail = email?.trim() || phonePlaceholderEmail(normalizedPhone);
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [userEmail]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'البريد أو الهاتف مستخدم بالفعل' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), userEmail, hashedPassword, normalizedPhone, 'staff']
    );

    res.status(201).json({
      message: 'تم إنشاء حساب الموظف بنجاح',
      user: sanitizeStaff({
        id: result.insertId,
        name: name.trim(),
        email: userEmail,
        phone: normalizedPhone,
        role: 'staff',
      }),
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: 'معرّف غير صالح' });
    }

    const [users] = await db.query('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }
    if (users[0].role !== 'staff') {
      return res.status(403).json({ message: 'يمكن حذف حسابات موظفي التجهيز فقط' });
    }

    await purgeUserById(userId);
    res.json({ message: 'تم حذف الموظف بنجاح' });
  } catch (error) {
    console.error('Delete staff error:', error);
    if (error.code === 'USER_DELETE_FAILED') {
      return res.status(500).json({ message: 'تعذّر حذف الموظف' });
    }
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'preparing_shipping')::int AS preparing,
        COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
        COUNT(*)::int AS total
      FROM orders
    `);
    res.json(rows[0] || { pending: 0, preparing: 0, delivered: 0, cancelled: 0, total: 0 });
  } catch (error) {
    console.error('Staff stats error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.subscribePush = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = String(req.body.token || '').trim();
    const platform = String(req.body.platform || 'android').toLowerCase();
    if (!token) {
      return res.status(400).json({ message: 'رمز الإشعار مطلوب' });
    }
    const mobilePlatform = ['android', 'ios'].includes(platform) ? platform : 'android';

    await db.query(
      'DELETE FROM push_tokens WHERE user_id = ? AND token = ?',
      [userId, token]
    );
    await db.query(
      `INSERT INTO push_tokens (user_id, token, platform, endpoint, app) VALUES (?, ?, ?, ?, 'fulfillment')`,
      [userId, token, mobilePlatform, token]
    );
    res.json({ message: 'تم تفعيل إشعارات التجهيز' });
  } catch (error) {
    console.error('Staff subscribe push error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.unsubscribePush = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.body?.token ? String(req.body.token) : null;
    if (token) {
      await db.query(
        `DELETE FROM push_tokens WHERE user_id = ? AND token = ? AND app = 'fulfillment'`,
        [userId, token]
      );
    } else {
      await db.query(`DELETE FROM push_tokens WHERE user_id = ? AND app = 'fulfillment'`, [userId]);
    }
    res.json({ message: 'تم إيقاف إشعارات التجهيز' });
  } catch (error) {
    console.error('Staff unsubscribe push error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
