const db = require('../config/database');
const path = require('path');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM banners WHERE active = 1 ORDER BY sort_order ASC, id ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getAllAdmin = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM banners ORDER BY sort_order ASC, id ASC');
    res.json(rows);
  } catch (error) {
    console.error('Get banners admin error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, link_type, link_value, sort_order, active, image_pos_x, image_pos_y, image_size } = req.body;
    const image = req.files?.image?.[0] ? `/uploads/${req.files.image[0].filename}` : null;
    const backgroundImage = req.files?.background_image?.[0] ? `/uploads/${req.files.background_image[0].filename}` : null;
    if (!image) {
      return res.status(400).json({ message: 'الصورة مطلوبة' });
    }
    const posX = image_pos_x != null ? parseFloat(image_pos_x) : 100;
    const posY = image_pos_y != null ? parseFloat(image_pos_y) : 50;
    const size = image_size != null ? parseFloat(image_size) : 0;
    const [result] = await db.query(
      `INSERT INTO banners (title, image, background_image, link_type, link_value, sort_order, active, image_pos_x, image_pos_y, image_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title || null, image, backgroundImage || null, link_type || 'none', link_value || null, sort_order || 0, active !== undefined ? active : 1, posX, posY, size]
    );
    res.status(201).json({ message: 'تم إنشاء البانر بنجاح', id: result.insertId });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { title, link_type, link_value, sort_order, active, image_pos_x, image_pos_y, image_size } = req.body;
    const image = req.files?.image?.[0] ? `/uploads/${req.files.image[0].filename}` : undefined;
    const backgroundImage = req.files?.background_image?.[0] ? `/uploads/${req.files.background_image[0].filename}` : undefined;
    let query = 'UPDATE banners SET title = ?, link_type = ?, link_value = ?, sort_order = ?, active = ?';
    const params = [title || null, link_type || 'none', link_value || null, sort_order || 0, active !== undefined ? active : 1];
    if (image) {
      query += ', image = ?';
      params.push(image);
    }
    if (backgroundImage) {
      query += ', background_image = ?';
      params.push(backgroundImage);
    }
    if (image_pos_x != null) {
      query += ', image_pos_x = ?';
      params.push(parseFloat(image_pos_x));
    }
    if (image_pos_y != null) {
      query += ', image_pos_y = ?';
      params.push(parseFloat(image_pos_y));
    }
    if (image_size != null) {
      query += ', image_size = ?';
      params.push(parseFloat(image_size));
    }
    query += ' WHERE id = ?';
    params.push(req.params.id);
    await db.query(query, params);
    res.json({ message: 'تم تحديث البانر بنجاح' });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM banners WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف البانر بنجاح' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
