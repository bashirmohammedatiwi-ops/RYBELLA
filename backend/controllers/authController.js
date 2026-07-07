const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { normalizeIraqiPhone, isValidIraqiPhone } = require('../utils/phone');
const { softDeleteCustomer } = require('../utils/customerAccount');
const { createCustomerAccount, mapCreateError } = require('../utils/createCustomer');
const { purgeUserById } = require('../utils/purgeUser');

function sanitizeUserResponse(user) {
  if (!user) return user;
  const displayEmail = user.email?.endsWith('@phone.rybella.iq') ? null : user.email;
  return {
    id: user.id,
    name: user.name,
    email: displayEmail,
    phone: user.phone,
    role: user.role,
    created_at: user.created_at,
  };
}

exports.register = async (req, res) => {
  try {
    const user = await createCustomerAccount(req.body);

    const jwtSecret = process.env.JWT_SECRET || 'rybella_dev_secret_change_in_production';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'customer' },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'تم التسجيل بنجاح',
      token,
      user: sanitizeUserResponse(user),
    });
  } catch (error) {
    if (error.code) {
      return res.status(400).json({ message: mapCreateError(error) });
    }
    console.error('Register error:', error);
    const msg = process.env.NODE_ENV === 'development' ? error.message : 'حدث خطأ في الخادم';
    res.status(500).json({ message: msg });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, phone, password, as: loginAs } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'كلمة المرور مطلوبة' });
    }

    const normalizedPhone = phone ? normalizeIraqiPhone(phone) : null;
    const trimmedEmail = email?.trim() || null;

    if (!normalizedPhone && !trimmedEmail) {
      return res.status(400).json({ message: 'رقم الهاتف وكلمة المرور مطلوبة' });
    }

    if (normalizedPhone && !isValidIraqiPhone(normalizedPhone)) {
      return res.status(400).json({ message: 'رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 11 رقم' });
    }

    let users;
    if (normalizedPhone) {
      [users] = await db.query(
        'SELECT * FROM users WHERE phone = ? AND deleted_at IS NULL',
        [normalizedPhone]
      );
    } else {
      [users] = await db.query(
        'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
        [trimmedEmail]
      );
    }

    if (loginAs === 'customer') {
      users = users.filter((u) => u.role === 'customer');
    } else if (loginAs === 'staff') {
      users = users.filter((u) => u.role === 'staff' || u.role === 'admin');
    }

    if (users.length === 0) {
      return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
    }

    let user = null;
    for (const candidate of users) {
      if (await bcrypt.compare(password, candidate.password)) {
        user = candidate;
        break;
      }
    }
    if (!user) {
      return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'rybella_dev_secret_change_in_production';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: sanitizeUserResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    const msg = process.env.NODE_ENV === 'development' ? error.message : 'حدث خطأ في الخادم';
    res.status(500).json({ message: msg });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? AND deleted_at IS NULL',
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    res.json(sanitizeUserResponse(users[0]));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updates = [];
    const params = [];
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (phone !== undefined) {
      const normalizedPhone = normalizeIraqiPhone(phone);
      if (normalizedPhone && !isValidIraqiPhone(normalizedPhone)) {
        return res.status(400).json({ message: 'رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 11 رقم' });
      }
      updates.push('phone = ?');
      params.push(normalizedPhone || null);
    }
    if (updates.length === 0) {
      return res.status(400).json({ message: 'لا توجد بيانات للتحديث' });
    }
    params.push(req.user.id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    const [users] = await db.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(sanitizeUserResponse(users[0] || {}));
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'كلمة المرور الحالية والجديدة مطلوبة' });
    }
    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'المستخدم غير موجود' });
    const valid = await bcrypt.compare(current_password, users[0].password);
    if (!valid) return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'كلمة المرور مطلوبة لتأكيد حذف الحساب' });
    }
    const [users] = await db.query('SELECT id, password, role FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    const user = users[0];
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'لا يمكن حذف حساب المدير' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: 'كلمة المرور غير صحيحة' });
    }
    if (user.role === 'customer') {
      await softDeleteCustomer(req.user.id);
    } else {
      await purgeUserById(req.user.id);
    }
    res.json({ message: 'تم حذف الحساب بنجاح' });
  } catch (error) {
    console.error('Delete account error:', error);
    if (error.code === 'USER_DELETE_FAILED') {
      return res.status(500).json({ message: 'تعذّر حذف الحساب' });
    }
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
