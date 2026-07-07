const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE role = ? ORDER BY created_at DESC',
      ['customer']
    );
    res.json(users);
  } catch (error) {
    console.error('Get customers error:', error);
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

    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'تم حذف العميل بنجاح' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
