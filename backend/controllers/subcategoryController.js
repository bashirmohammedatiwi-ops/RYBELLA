const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const categoryId = req.query.category_id;
    let query = `
      SELECT s.*, c.name as category_name
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
      ORDER BY c.name, COALESCE(s.sort_order, 999), s.name
    `;
    const params = [];
    if (categoryId) {
      query = `
        SELECT s.*, c.name as category_name
        FROM subcategories s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.category_id = ?
        ORDER BY COALESCE(s.sort_order, 999), s.name
      `;
      params.push(categoryId);
    }
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT s.*, c.name as category_name FROM subcategories s LEFT JOIN categories c ON s.category_id = c.id WHERE s.id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'الفئة الثانوية غير موجودة' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Get subcategory error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, category_id } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    if (!name || !category_id) {
      return res.status(400).json({ message: 'الاسم والفئة الرئيسية مطلوبان' });
    }
    const [result] = await db.query(
      'INSERT INTO subcategories (name, category_id, image) VALUES (?, ?, ?)',
      [name, category_id, image]
    );
    res.status(201).json({ message: 'تم إنشاء الفئة الثانوية بنجاح', id: result.insertId });
  } catch (error) {
    console.error('Create subcategory error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, category_id, sort_order } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;
    let query = 'UPDATE subcategories SET name = ?, category_id = ?';
    const params = [name, category_id];
    if (sort_order !== undefined && sort_order !== '') {
      query += ', sort_order = ?';
      params.push(parseInt(sort_order, 10) || 0);
    }
    if (image) {
      query += ', image = ?';
      params.push(image);
    }
    query += ' WHERE id = ?';
    params.push(req.params.id);
    await db.query(query, params);
    res.json({ message: 'تم تحديث الفئة الثانوية بنجاح' });
  } catch (error) {
    console.error('Update subcategory error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('UPDATE products SET subcategory_id = NULL WHERE subcategory_id = ?', [req.params.id]);
    await db.query('DELETE FROM subcategories WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف الفئة الثانوية بنجاح' });
  } catch (error) {
    console.error('Delete subcategory error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.reorder = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items مطلوب (مصفوفة من {id, sort_order})' });
    }
    for (const item of items) {
      if (item.id != null && item.sort_order != null) {
        await db.query('UPDATE subcategories SET sort_order = ? WHERE id = ?', [parseInt(item.sort_order, 10) || 0, item.id]);
      }
    }
    res.json({ message: 'تم تحديث الترتيب بنجاح' });
  } catch (error) {
    console.error('Reorder subcategories error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
