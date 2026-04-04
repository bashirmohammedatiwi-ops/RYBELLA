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
