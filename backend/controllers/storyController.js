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
 * اليوميات - للمتجر: مجموعات مع صور متعددة، تظهر 24 ساعة
 * Response: [{ id, created_at, cover, slides: [{ id, image, link_url, sort_order }] }]
 */
exports.getAll = async (req, res) => {
  try {
    const [groups] = await db.query(
      `SELECT sg.id, sg.created_at FROM story_groups sg
       WHERE sg.created_at > datetime('now', '-24 hours')
       ORDER BY sg.created_at DESC`
    );
    const result = [];
    for (const g of groups) {
      const [slides] = await db.query(
        `SELECT id, image, link_type, link_value, sort_order FROM story_slides
         WHERE story_group_id = ? ORDER BY sort_order ASC, id ASC`,
        [g.id]
      );
      if (slides.length === 0) continue;
      const slidesWithUrl = [];
      for (const s of slides) {
        const link_url = (s.link_type && s.link_value) ? await resolveLinkUrl(s.link_type, s.link_value) : null;
        slidesWithUrl.push({ id: s.id, image: s.image, link_url, sort_order: s.sort_order });
      }
      result.push({
        id: g.id,
        created_at: g.created_at,
        cover: slides[0].image,
        slides: slidesWithUrl,
      });
    }
    res.json(result);
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

/**
 * للأدمن: كل المجموعات مع الصور
 */
exports.getAllAdmin = async (req, res) => {
  try {
    const [groups] = await db.query('SELECT id, created_at FROM story_groups ORDER BY created_at DESC');
    const result = [];
    for (const g of groups) {
      const [slides] = await db.query(
        `SELECT id, image, link_type, link_value, sort_order FROM story_slides
         WHERE story_group_id = ? ORDER BY sort_order ASC, id ASC`,
        [g.id]
      );
      result.push({
        id: g.id,
        created_at: g.created_at,
        cover: slides[0]?.image,
        slides: slides,
      });
    }
    res.json(result);
  } catch (error) {
    console.error('Get stories admin error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

/**
 * إنشاء يومية جديدة - صور متعددة
 * Body: images[] (files), slides: JSON [{ link_type, link_value }]
 */
exports.create = async (req, res) => {
  try {
    const files = req.files?.images || (req.file ? [req.file] : []);
    if (!files.length) {
      return res.status(400).json({ message: 'يجب إضافة صورة واحدة على الأقل' });
    }
    let slidesData = [];
    try {
      const raw = req.body.slides || req.body.slide;
      if (raw) slidesData = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (_) {}
    const [groupResult] = await db.query('INSERT INTO story_groups (created_at) VALUES (CURRENT_TIMESTAMP)');
    const groupId = groupResult.insertId;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const image = `/uploads/${f.filename}`;
      const slide = Array.isArray(slidesData) && slidesData[i] ? slidesData[i] : {};
      const link_type = slide.link_type || 'none';
      const link_value = slide.link_value || null;
      await db.query(
        `INSERT INTO story_slides (story_group_id, image, link_type, link_value, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [groupId, image, link_type, link_value, i]
      );
    }
    res.status(201).json({ message: 'تم إضافة اليومية بنجاح', id: groupId });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM story_groups WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف اليومية بنجاح' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
