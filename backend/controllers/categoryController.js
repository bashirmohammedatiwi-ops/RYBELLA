const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY COALESCE(sort_order, 999), name');
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (categories.length === 0) {
      return res.status(404).json({ message: 'الفئة غير موجودة' });
    }
    res.json(categories[0]);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, sort_order, icon, overlay_text } = req.body;
    const imageFile = req.files?.image?.[0];
    const iconFile = req.files?.icon_image?.[0];
    const image = imageFile ? `/uploads/${imageFile.filename}` : null;
    const iconImage = iconFile ? `/uploads/${iconFile.filename}` : null;

    if (!name) {
      return res.status(400).json({ message: 'اسم الفئة مطلوب' });
    }

    let order = sort_order !== undefined && sort_order !== '' ? parseInt(sort_order, 10) : null;
    if (order === null || isNaN(order)) {
      const [maxRow] = await db.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM categories');
      order = maxRow[0]?.next_order ?? 0;
    }

    const iconVal = iconImage ? iconImage : (icon && typeof icon === 'string' ? icon.trim() || null : null);
    const overlayVal = overlay_text && typeof overlay_text === 'string' ? overlay_text.trim() || null : null;

    const [result] = await db.query(
      'INSERT INTO categories (name, image, sort_order, icon, overlay_text) VALUES (?, ?, ?, ?, ?)',
      [name, image, order, iconVal, overlayVal]
    );
    res.status(201).json({ message: 'تم إنشاء الفئة بنجاح', id: result.insertId });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, sort_order, icon, overlay_text } = req.body;
    const imageFile = req.files?.image?.[0];
    const iconFile = req.files?.icon_image?.[0];
    const image = imageFile ? `/uploads/${imageFile.filename}` : undefined;
    const iconImage = iconFile ? `/uploads/${iconFile.filename}` : undefined;

    let query = 'UPDATE categories SET name = ?';
    const params = [name];
    if (sort_order !== undefined && sort_order !== '') {
      query += ', sort_order = ?';
      params.push(parseInt(sort_order, 10) || 0);
    }
    if (image) {
      query += ', image = ?';
      params.push(image);
    }
    if (iconImage) {
      query += ', icon = ?';
      params.push(iconImage);
    } else if (icon !== undefined) {
      query += ', icon = ?';
      params.push(icon && typeof icon === 'string' ? icon.trim() || null : null);
    }
    if (overlay_text !== undefined) {
      query += ', overlay_text = ?';
      params.push(overlay_text && typeof overlay_text === 'string' ? overlay_text.trim() || null : null);
    }
    query += ' WHERE id = ?';
    params.push(req.params.id);
    await db.query(query, params);
    res.json({ message: 'تم تحديث الفئة بنجاح' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف الفئة بنجاح' });
  } catch (error) {
    console.error('Delete category error:', error);
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
        await db.query('UPDATE categories SET sort_order = ? WHERE id = ?', [parseInt(item.sort_order, 10) || 0, item.id]);
      }
    }
    res.json({ message: 'تم تحديث الترتيب بنجاح' });
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
