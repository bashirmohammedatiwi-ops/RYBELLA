const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const [brands] = await db.query('SELECT * FROM brands ORDER BY COALESCE(sort_order, 999), name');
    res.json(brands);
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, sort_order } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name) {
      return res.status(400).json({ message: 'اسم العلامة التجارية مطلوب' });
    }

    let order = sort_order !== undefined ? parseInt(sort_order, 10) : null;
    if (order === null || isNaN(order)) {
      const [maxRow] = await db.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM brands');
      order = maxRow[0]?.next_order ?? 0;
    }

    const [result] = await db.query('INSERT INTO brands (name, logo, sort_order) VALUES (?, ?, ?)', [name, logo, order]);
    res.status(201).json({ message: 'تم إنشاء العلامة التجارية بنجاح', id: result.insertId });
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, sort_order } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : undefined;

    let query = 'UPDATE brands SET name = ?';
    const params = [name];
    if (logo) {
      query += ', logo = ?';
      params.push(logo);
    }
    if (sort_order !== undefined && sort_order !== '') {
      query += ', sort_order = ?';
      params.push(parseInt(sort_order, 10) || 0);
    }
    query += ' WHERE id = ?';
    params.push(req.params.id);
    await db.query(query, params);
    res.json({ message: 'تم تحديث العلامة التجارية بنجاح' });
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM brands WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف العلامة التجارية بنجاح' });
  } catch (error) {
    console.error('Delete brand error:', error);
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
        await db.query('UPDATE brands SET sort_order = ? WHERE id = ?', [parseInt(item.sort_order, 10) || 0, item.id]);
      }
    }
    res.json({ message: 'تم تحديث الترتيب بنجاح' });
  } catch (error) {
    console.error('Reorder brands error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
