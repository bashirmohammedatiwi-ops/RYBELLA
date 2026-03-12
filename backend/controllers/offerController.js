const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM offers WHERE active = 1 ORDER BY sort_order ASC, id ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getAllAdmin = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM offers ORDER BY sort_order ASC, id ASC');
    res.json(rows);
  } catch (error) {
    console.error('Get offers admin error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, discount_label, product_ids, sort_order, active } = req.body;
    const image = req.file ? '/uploads/' + req.file.filename : null;
    if (!image) {
      return res.status(400).json({ message: 'الصورة مطلوبة' });
    }
    const productIdsStr = Array.isArray(product_ids)
      ? JSON.stringify(product_ids)
      : typeof product_ids === 'string'
        ? product_ids
        : product_ids || '[]';
    const [result] = await db.query(
      'INSERT INTO offers (title, image, discount_label, product_ids, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)',
      [title || '', image, discount_label || null, productIdsStr, sort_order || 0, active !== undefined ? active : 1]
    );
    res.status(201).json({ message: 'تم إنشاء العرض بنجاح', id: result.insertId });
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { title, discount_label, product_ids, sort_order, active } = req.body;
    const image = req.file ? '/uploads/' + req.file.filename : undefined;
    const productIdsStr = Array.isArray(product_ids)
      ? JSON.stringify(product_ids)
      : typeof product_ids === 'string'
        ? product_ids
        : product_ids || '[]';
    let query = 'UPDATE offers SET title = ?, discount_label = ?, product_ids = ?, sort_order = ?, active = ?';
    const params = [title || '', discount_label || null, productIdsStr, sort_order || 0, active !== undefined ? active : 1];
    if (image) {
      query += ', image = ?';
      params.push(image);
    }
    query += ' WHERE id = ?';
    params.push(req.params.id);
    await db.query(query, params);
    res.json({ message: 'تم تحديث العرض بنجاح' });
  } catch (error) {
    console.error('Update offer error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM offers WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف العرض بنجاح' });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
