const db = require('../config/database');

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
        `SELECT p.id FROM products p LEFT JOIN product_variants pv ON pv.product_id = p.id
         WHERE p.barcode = ? OR pv.barcode = ? LIMIT 1`,
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
    if (linkType === 'url' && (val.startsWith('http') || val.startsWith('/'))) return val;
  } catch (e) {
    console.error('resolveLinkUrl error:', e);
  }
  return null;
}

/**
 * اليوميات - مثل انستغرام: تظهر 24 ساعة ثم تختفي
 * GET /api/stories - للمتجر: يعيد اليوميات النشطة خلال آخر 24 ساعة
 */
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM stories 
       WHERE created_at > datetime('now', '-24 hours') 
       ORDER BY created_at DESC`
    );
    for (const s of rows) {
      s.link_url = (s.link_type && s.link_value) ? await resolveLinkUrl(s.link_type, s.link_value) : null;
    }
    res.json(rows);
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getAllAdmin = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM stories ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Get stories admin error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { link_type, link_value } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    if (!image) {
      return res.status(400).json({ message: 'الصورة مطلوبة' });
    }
    const [result] = await db.query(
      `INSERT INTO stories (image, link_type, link_value) VALUES (?, ?, ?)`,
      [image, link_type || 'none', link_value || null]
    );
    res.status(201).json({ message: 'تم إضافة اليومية بنجاح', id: result.insertId });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM stories WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف اليومية بنجاح' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
