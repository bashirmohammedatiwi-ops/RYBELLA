const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const [zones] = await db.query('SELECT * FROM delivery_zones ORDER BY city');
    res.json(zones);
  } catch (error) {
    console.error('Get delivery zones error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { city, delivery_fee } = req.body;
    if (!city || delivery_fee === undefined) {
      return res.status(400).json({ message: 'المدينة ورسوم التوصيل مطلوبة' });
    }

    const [result] = await db.query('INSERT INTO delivery_zones (city, delivery_fee) VALUES (?, ?)', [city, delivery_fee]);
    res.status(201).json({ message: 'تم إنشاء منطقة التوصيل بنجاح', id: result.insertId });
  } catch (error) {
    console.error('Create delivery zone error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { city, delivery_fee } = req.body;
    await db.query('UPDATE delivery_zones SET city = ?, delivery_fee = ? WHERE id = ?', [city, delivery_fee, req.params.id]);
    res.json({ message: 'تم تحديث منطقة التوصيل بنجاح' });
  } catch (error) {
    console.error('Update delivery zone error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM delivery_zones WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف منطقة التوصيل بنجاح' });
  } catch (error) {
    console.error('Delete delivery zone error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
