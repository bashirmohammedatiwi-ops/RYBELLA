const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const [notifications] = await db.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'العنوان والرسالة مطلوبان' });
    }
    const [result] = await db.query('INSERT INTO notifications (title, message) VALUES (?, ?)', [title, message]);
    res.status(201).json({ message: 'تم إنشاء الإشعار بنجاح', id: result.insertId });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
