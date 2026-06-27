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

function mapVideoSlide(s, linkUrl, extra = {}) {
  const video = s.video || s.image;
  return {
    id: s.id,
    image: video,
    video,
    media_type: 'video',
    thumbnail: s.thumbnail,
    link_url: linkUrl,
    sort_order: s.sort_order,
    ...extra,
  };
}

async function buildStoryGroups(groups, resolveLinks = true) {
  const result = [];
  for (const g of groups) {
    const [slides] = await db.query(
      `SELECT id, image, link_type, link_value, sort_order, media_type, thumbnail FROM story_slides
       WHERE story_group_id = ? ORDER BY sort_order ASC, id ASC`,
      [g.id]
    );
    const videoSlides = slides.filter((s) => (s.media_type || 'video') === 'video');
    if (videoSlides.length === 0) continue;
    const slidesWithUrl = [];
    for (const s of videoSlides) {
      const link_url = resolveLinks && s.link_type && s.link_value
        ? await resolveLinkUrl(s.link_type, s.link_value)
        : null;
      const extra = resolveLinks ? {} : { link_type: s.link_type, link_value: s.link_value };
      slidesWithUrl.push(mapVideoSlide(s, link_url, extra));
    }
    result.push({
      id: g.id,
      created_at: g.created_at,
      avatar: g.avatar,
      publisher_name: g.publisher_name,
      cover: g.avatar || videoSlides[0]?.thumbnail || null,
      cover_media_type: 'image',
      slides: slidesWithUrl,
    });
  }
  return result;
}

async function buildHighlights(resolveLinks = true) {
  const [highlights] = await db.query(
    'SELECT id, title, cover, sort_order, created_at FROM story_highlights ORDER BY sort_order ASC, id ASC'
  );
  const result = [];
  for (const h of highlights) {
    const [slides] = await db.query(
      `SELECT id, video, link_type, link_value, sort_order, thumbnail FROM story_highlight_slides
       WHERE highlight_id = ? ORDER BY sort_order ASC, id ASC`,
      [h.id]
    );
    if (slides.length === 0) continue;
    const slidesWithUrl = [];
    for (const s of slides) {
      const link_url = resolveLinks && s.link_type && s.link_value
        ? await resolveLinkUrl(s.link_type, s.link_value)
        : null;
      const extra = resolveLinks ? {} : { link_type: s.link_type, link_value: s.link_value };
      slidesWithUrl.push(mapVideoSlide(s, link_url, extra));
    }
    result.push({
      id: h.id,
      title: h.title,
      cover: h.cover || null,
      sort_order: h.sort_order,
      created_at: h.created_at,
      slides: slidesWithUrl,
    });
  }
  return result;
}

exports.getAll = async (req, res) => {
  try {
    const storyDays = parseInt(process.env.STORY_DAYS || '30', 10) || 30;
    const [groups] = await db.query(
      `SELECT sg.id, sg.created_at, sg.avatar, sg.publisher_name FROM story_groups sg
       WHERE sg.created_at > datetime('now', '-${storyDays} days')
       ORDER BY sg.created_at DESC`
    );
    const stories = await buildStoryGroups(groups, true);
    const highlights = await buildHighlights(true);
    res.json({ stories, highlights });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getAllAdmin = async (req, res) => {
  try {
    const [groups] = await db.query(
      'SELECT id, created_at, avatar, publisher_name FROM story_groups ORDER BY created_at DESC'
    );
    const stories = await buildStoryGroups(groups, false);
    const highlights = await buildHighlights(false);
    res.json({ stories, highlights });
  } catch (error) {
    console.error('Get stories admin error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const avatarFile = req.files?.avatar?.[0];
    const files = req.files?.videos || req.files?.images || [];
    if (!files.length) {
      return res.status(400).json({ message: 'يجب إضافة فيديو واحد على الأقل' });
    }
    const videoExts = /\.(mp4|webm|mov)$/i;
    const videoMimes = /^video\//;
    for (const f of files) {
      const isVideo = videoExts.test(f.originalname || '') || videoMimes.test(f.mimetype || '');
      if (!isVideo) {
        return res.status(400).json({ message: 'اليوميات تدعم فيديو فقط (mp4, webm, mov)' });
      }
    }
    const avatar = avatarFile ? `/uploads/${avatarFile.filename}` : null;
    const publisher_name = req.body.publisher_name || null;
    let slidesData = [];
    try {
      const raw = req.body.slides || req.body.slide;
      if (raw) slidesData = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (_) {}
    const [groupResult] = await db.query(
      'INSERT INTO story_groups (avatar, publisher_name, duration_seconds, created_at) VALUES (?, ?, 5, CURRENT_TIMESTAMP)',
      [avatar, publisher_name]
    );
    const groupId = groupResult.insertId;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const mediaPath = `/uploads/${f.filename}`;
      const slide = Array.isArray(slidesData) && slidesData[i] ? slidesData[i] : {};
      await db.query(
        `INSERT INTO story_slides (story_group_id, image, media_type, thumbnail, link_type, link_value, sort_order) VALUES (?, ?, 'video', ?, ?, ?, ?)`,
        [groupId, mediaPath, null, slide.link_type || 'none', slide.link_value || null, i]
      );
    }
    res.status(201).json({ message: 'تم إضافة اليومية بنجاح', id: groupId });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.createHighlight = async (req, res) => {
  try {
    const coverFile = req.files?.cover?.[0];
    const files = req.files?.videos || req.files?.images || [];
    const title = (req.body.title || '').trim();
    if (!title) return res.status(400).json({ message: 'اسم الهايلايت مطلوب' });
    if (!files.length) return res.status(400).json({ message: 'يجب إضافة فيديو واحد على الأقل' });
    const videoExts = /\.(mp4|webm|mov)$/i;
    const videoMimes = /^video\//;
    for (const f of files) {
      if (!videoExts.test(f.originalname || '') && !videoMimes.test(f.mimetype || '')) {
        return res.status(400).json({ message: 'الهايلايت يدعم فيديو فقط (mp4, webm, mov)' });
      }
    }
    const cover = coverFile ? `/uploads/${coverFile.filename}` : null;
    let slidesData = [];
    try {
      const raw = req.body.slides;
      if (raw) slidesData = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (_) {}
    const sort_order = parseInt(req.body.sort_order, 10) || 0;
    const [hlResult] = await db.query(
      'INSERT INTO story_highlights (title, cover, sort_order, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [title, cover, sort_order]
    );
    const highlightId = hlResult.insertId;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const videoPath = `/uploads/${f.filename}`;
      const slide = Array.isArray(slidesData) && slidesData[i] ? slidesData[i] : {};
      await db.query(
        `INSERT INTO story_highlight_slides (highlight_id, video, thumbnail, link_type, link_value, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
        [highlightId, videoPath, null, slide.link_type || 'none', slide.link_value || null, i]
      );
    }
    res.status(201).json({ message: 'تم إضافة الهايلايت بنجاح', id: highlightId });
  } catch (error) {
    console.error('Create highlight error:', error);
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

exports.deleteHighlight = async (req, res) => {
  try {
    await db.query('DELETE FROM story_highlights WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف الهايلايت بنجاح' });
  } catch (error) {
    console.error('Delete highlight error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
