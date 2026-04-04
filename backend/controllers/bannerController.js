const db = require('../config/database');
const path = require('path');

/**
 * يحلّل link_value (اسم أو باركود) إلى رابط فعلي
 * - product: اسم المنتج أو باركود المنتج/العنصر
 * - category: اسم الفئة
 * - subcategory: اسم الفئة الثانوية
 * - brand: اسم البراند
 */
async function resolveLinkUrl(linkType, linkValue) {
  if (!linkValue || !String(linkValue).trim()) return null;
  const val = String(linkValue).trim();
  const isNumericId = /^\d+$/.test(val);
  try {
    if (linkType === 'product') {
      if (isNumericId) {
        const [byId] = await db.query('SELECT id FROM products WHERE id = ?', [parseInt(val, 10)]);
        if (byId?.length) return `/products/${byId[0].id}`;
      }
      const [byBarcode] = await db.query(
        `SELECT p.id FROM products p
         LEFT JOIN product_variants pv ON pv.product_id = p.id
         WHERE p.barcode = ? OR pv.barcode = ?
         LIMIT 1`,
        [val, val]
      );
      if (byBarcode?.length) return `/products/${byBarcode[0].id}`;
      const [byName] = await db.query(
        'SELECT id FROM products WHERE name LIKE ? AND COALESCE(status, \'published\') = \'published\' LIMIT 1',
        [`%${val}%`]
      );
      if (byName?.length) return `/products/${byName[0].id}`;
      return null;
    }
    if (linkType === 'category') {
      if (isNumericId) {
        const [byId] = await db.query('SELECT id FROM categories WHERE id = ?', [parseInt(val, 10)]);
        if (byId?.length) return `/explore?category=${byId[0].id}`;
      }
      const [rows] = await db.query('SELECT id FROM categories WHERE name LIKE ? LIMIT 1', [`%${val}%`]);
      return rows?.length ? `/explore?category=${rows[0].id}` : null;
    }
    if (linkType === 'subcategory') {
      if (isNumericId) {
        const [byId] = await db.query('SELECT id FROM subcategories WHERE id = ?', [parseInt(val, 10)]);
        if (byId?.length) return `/explore?subcategory=${byId[0].id}`;
      }
      const [rows] = await db.query('SELECT id FROM subcategories WHERE name LIKE ? LIMIT 1', [`%${val}%`]);
      return rows?.length ? `/explore?subcategory=${rows[0].id}` : null;
    }
    if (linkType === 'brand') {
      if (isNumericId) {
        const [byId] = await db.query('SELECT id FROM brands WHERE id = ?', [parseInt(val, 10)]);
        if (byId?.length) return `/explore?brand=${byId[0].id}`;
      }
      const [rows] = await db.query('SELECT id FROM brands WHERE name LIKE ? LIMIT 1', [`%${val}%`]);
      return rows?.length ? `/explore?brand=${rows[0].id}` : null;
    }
    if (linkType === 'url' && (val.startsWith('http') || val.startsWith('/'))) {
      return val;
    }
  } catch (e) {
    console.error('resolveLinkUrl error:', e);
  }
  return null;
}

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM banners WHERE active = 1 ORDER BY sort_order ASC, id ASC'
    );
    for (const b of rows) {
      if (b.link_type && b.link_value) {
        const url = await resolveLinkUrl(b.link_type, b.link_value);
        b.link_url = url;
        if (url) {
          const m = url.match(/^\/products\/(\d+)$/);
          if (m) b.link_product_id = parseInt(m[1], 10);
          const cm = url.match(/category=(\d+)/);
          if (cm) b.link_category_id = parseInt(cm[1], 10);
          const sm = url.match(/subcategory=(\d+)/);
          if (sm) b.link_subcategory_id = parseInt(sm[1], 10);
          const bm = url.match(/brand=(\d+)/);
          if (bm) b.link_brand_id = parseInt(bm[1], 10);
        }
      } else {
        b.link_url = null;
      }
    }
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
    const { title, subtitle, discount_percent, discount_label, button_text, button_color, background_color, border_color, border_radius, link_type, link_value, sort_order, active, image_pos_x, image_pos_y, image_size } = req.body;
    const image = req.files?.image?.[0] ? `/uploads/${req.files.image[0].filename}` : null;
    const backgroundImage = req.files?.background_image?.[0] ? `/uploads/${req.files.background_image[0].filename}` : null;
    if (!image) {
      return res.status(400).json({ message: 'الصورة مطلوبة' });
    }
    const posX = image_pos_x != null ? parseFloat(image_pos_x) : 80;
    const posY = image_pos_y != null ? parseFloat(image_pos_y) : 70;
    const size = image_size != null ? parseFloat(image_size) : 0;
    const borderRadius = border_radius != null ? parseFloat(border_radius) : null;
    const [result] = await db.query(
      `INSERT INTO banners (title, subtitle, discount_percent, discount_label, button_text, button_color, background_color, border_color, border_radius, image, background_image, link_type, link_value, sort_order, active, image_pos_x, image_pos_y, image_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title || null, subtitle || null, (discount_percent !== '' && discount_percent != null) ? parseInt(discount_percent, 10) : null, discount_label || null, button_text || null, button_color || null, background_color || null, border_color || null, borderRadius, image, backgroundImage || null, link_type || 'none', link_value || null, sort_order || 0, active !== undefined ? active : 1, posX, posY, size]
    );
    res.status(201).json({ message: 'تم إنشاء البانر بنجاح', id: result.insertId });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { title, subtitle, discount_percent, discount_label, button_text, button_color, background_color, border_color, border_radius, link_type, link_value, sort_order, active, image_pos_x, image_pos_y, image_size } = req.body;
    const image = req.files?.image?.[0] ? `/uploads/${req.files.image[0].filename}` : undefined;
    const backgroundImage = req.files?.background_image?.[0] ? `/uploads/${req.files.background_image[0].filename}` : undefined;
    let query = 'UPDATE banners SET title = ?, subtitle = ?, discount_percent = ?, discount_label = ?, button_text = ?, button_color = ?, background_color = ?, border_color = ?, border_radius = ?, link_type = ?, link_value = ?, sort_order = ?, active = ?';
    const params = [
      title || null,
      subtitle || null,
      (discount_percent !== '' && discount_percent != null) ? parseInt(discount_percent, 10) : null,
      discount_label || null,
      button_text || null,
      button_color || null,
      background_color || null,
      border_color || null,
      border_radius != null ? parseFloat(border_radius) : null,
      link_type || 'none',
      link_value || null,
      sort_order || 0,
      active !== undefined ? active : 1,
    ];
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
