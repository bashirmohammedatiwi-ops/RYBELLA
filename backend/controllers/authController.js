const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
    }

    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, 'customer']
    );

    const jwtSecret = process.env.JWT_SECRET || 'rybella_dev_secret_change_in_production';
    const token = jwt.sign(
      { id: result.insertId, email, role: 'customer' },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'تم التسجيل بنجاح',
      token,
      user: {
        id: result.insertId,
        name,
        email,
        phone: phone || null,
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'البريد الإلكتروني وكلمة المرور مطلوبة' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
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
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    res.json(users[0]);
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
      updates.push('phone = ?');
      params.push(phone || null);
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
    res.json(users[0] || {});
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
    await db.query('DELETE FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'تم حذف الحساب بنجاح' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
