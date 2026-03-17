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
      `SELECT sg.id, sg.created_at, sg.avatar, sg.publisher_name, sg.duration_seconds FROM story_groups sg
       WHERE sg.created_at > datetime('now', '-24 hours')
       ORDER BY sg.created_at DESC`
    );
    const result = [];
    for (const g of groups) {
      const [slides] = await db.query(
        `SELECT id, image, link_type, link_value, sort_order, media_type, thumbnail FROM story_slides
         WHERE story_group_id = ? ORDER BY sort_order ASC, id ASC`,
        [g.id]
      );
      if (slides.length === 0) continue;
      const slidesWithUrl = [];
      let cover = null;
      for (const s of slides) {
        const link_url = (s.link_type && s.link_value) ? await resolveLinkUrl(s.link_type, s.link_value) : null;
        const media_type = s.media_type || 'image';
        slidesWithUrl.push({ id: s.id, image: s.image, media_type, thumbnail: s.thumbnail, link_url, sort_order: s.sort_order });
        if (!cover) cover = media_type === 'image' ? s.image : (s.thumbnail || null);
      }
      for (const s of slides) {
        if (!cover && (s.media_type || 'image') === 'image') { cover = s.image; break; }
      }
      const firstSlide = slides[0];
      const coverMediaType = cover ? 'image' : (firstSlide?.media_type || 'image');
      result.push({
        id: g.id,
        created_at: g.created_at,
        avatar: g.avatar,
        publisher_name: g.publisher_name,
        duration_seconds: g.duration_seconds != null ? g.duration_seconds : 5,
        cover: cover || (coverMediaType === 'image' ? firstSlide?.image : null),
        cover_media_type: cover ? 'image' : coverMediaType,
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
    const [groups] = await db.query('SELECT id, created_at, avatar, publisher_name, duration_seconds FROM story_groups ORDER BY created_at DESC');
    const result = [];
    for (const g of groups) {
      const [slides] = await db.query(
        `SELECT id, image, link_type, link_value, sort_order, media_type, thumbnail FROM story_slides
         WHERE story_group_id = ? ORDER BY sort_order ASC, id ASC`,
        [g.id]
      );
      result.push({
        id: g.id,
        created_at: g.created_at,
        avatar: g.avatar,
        publisher_name: g.publisher_name,
        duration_seconds: g.duration_seconds != null ? g.duration_seconds : 5,
        cover: slides[0]?.image,
        slides: slides.map((s) => ({ ...s, media_type: s.media_type || 'image' })),
      });
    }
    res.json(result);
  } catch (error) {
    console.error('Get stories admin error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

/**
 * إنشاء يومية جديدة - صورة الناشر + صور متعددة
 * Body: avatar (file), images[] (files), publisher_name, slides: JSON [{ link_type, link_value }]
 */
exports.create = async (req, res) => {
  try {
    const avatarFile = req.files?.avatar?.[0];
    const files = req.files?.images || [];
    if (!files.length) {
      return res.status(400).json({ message: 'يجب إضافة صورة أو فيديو واحد على الأقل' });
    }
    const avatar = avatarFile ? `/uploads/${avatarFile.filename}` : null;
    const publisher_name = req.body.publisher_name || null;
    let slidesData = [];
    try {
      const raw = req.body.slides || req.body.slide;
      if (raw) slidesData = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (_) {}
    const duration_seconds = Math.min(60, Math.max(1, parseInt(req.body.duration_seconds, 10) || 5));
    const [groupResult] = await db.query(
      'INSERT INTO story_groups (avatar, publisher_name, duration_seconds, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [avatar, publisher_name, duration_seconds]
    );
    const groupId = groupResult.insertId;
    const videoExts = /\.(mp4|webm|mov)$/i;
    const videoMimes = /^video\//;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const mediaPath = `/uploads/${f.filename}`;
      const isVideo = videoExts.test(f.originalname || '') || videoMimes.test(f.mimetype || '');
      const media_type = isVideo ? 'video' : 'image';
      const thumbnail = null;
      const slide = Array.isArray(slidesData) && slidesData[i] ? slidesData[i] : {};
      const link_type = slide.link_type || 'none';
      const link_value = slide.link_value || null;
      await db.query(
        `INSERT INTO story_slides (story_group_id, image, media_type, thumbnail, link_type, link_value, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [groupId, mediaPath, media_type, thumbnail, link_type, link_value, i]
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
