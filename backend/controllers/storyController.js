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

function mapSlide(s, linkUrl, extra = {}) {
  const media_type = s.media_type || (s.video && !s.image ? 'video' : 'image');
  const src = s.video || s.image;
  return {
    id: s.id,
    image: src,
    video: media_type === 'video' ? src : undefined,
    media_type,
    thumbnail: s.thumbnail,
    link_url: linkUrl,
    sort_order: s.sort_order,
    ...extra,
  };
}

function isStoryActive(publishedAt, storyDays) {
  if (!publishedAt) return true;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - storyDays);
  return new Date(publishedAt.replace(' ', 'T')) > cutoff;
}

function detectMediaType(file) {
  const videoExts = /\.(mp4|webm|mov)$/i;
  const videoMimes = /^video\//;
  const imageExts = /\.(jpe?g|png|gif|webp)$/i;
  const imageMimes = /^image\//;
  const isVideo = videoExts.test(file.originalname || '') || videoMimes.test(file.mimetype || '');
  const isImage = imageExts.test(file.originalname || '') || imageMimes.test(file.mimetype || '');
  return { isVideo, isImage, media_type: isVideo ? 'video' : isImage ? 'image' : null };
}

async function buildStoryGroups(groups, resolveLinks = true, storyDays = 30) {
  const result = [];
  for (const g of groups) {
    const [slides] = await db.query(
      `SELECT id, image, link_type, link_value, sort_order, media_type, thumbnail FROM story_slides
       WHERE story_group_id = ? ORDER BY sort_order ASC, id ASC`,
      [g.id]
    );
    if (slides.length === 0) continue;
    const slidesWithUrl = [];
    for (const s of slides) {
      const link_url = resolveLinks && s.link_type && s.link_value
        ? await resolveLinkUrl(s.link_type, s.link_value)
        : null;
      const extra = resolveLinks ? {} : { link_type: s.link_type, link_value: s.link_value };
      slidesWithUrl.push(mapSlide(s, link_url, extra));
    }
    const firstImage = slides.find((s) => (s.media_type || 'image') === 'image');
    const publishedAt = g.published_at || g.created_at;
    result.push({
      id: g.id,
      created_at: g.created_at,
      published_at: publishedAt,
      is_active: isStoryActive(publishedAt, storyDays),
      avatar: g.avatar,
      publisher_name: g.publisher_name,
      duration_seconds: g.duration_seconds != null ? g.duration_seconds : 5,
      cover: g.avatar || firstImage?.image || slides[0]?.thumbnail || null,
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
      slidesWithUrl.push(mapSlide(s, link_url, extra));
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
      `SELECT sg.id, sg.created_at, sg.published_at, sg.avatar, sg.publisher_name, sg.duration_seconds FROM story_groups sg
       WHERE COALESCE(sg.published_at, sg.created_at) > datetime('now', '-${storyDays} days')
       ORDER BY COALESCE(sg.published_at, sg.created_at) DESC`
    );
    const stories = await buildStoryGroups(groups, true, storyDays);
    const highlights = await buildHighlights(true);
    res.json({ stories, highlights });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getAllAdmin = async (req, res) => {
  try {
    const storyDays = parseInt(process.env.STORY_DAYS || '30', 10) || 30;
    const [groups] = await db.query(
      'SELECT id, created_at, published_at, avatar, publisher_name, duration_seconds FROM story_groups ORDER BY COALESCE(published_at, created_at) DESC'
    );
    const stories = await buildStoryGroups(groups, false, storyDays);
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
      return res.status(400).json({ message: 'يجب إضافة صورة أو فيديو واحد على الأقل' });
    }
    const videoExts = /\.(mp4|webm|mov)$/i;
    const videoMimes = /^video\//;
    const imageExts = /\.(jpe?g|png|gif|webp)$/i;
    const imageMimes = /^image\//;
    const avatar = avatarFile ? `/uploads/${avatarFile.filename}` : null;
    const publisher_name = req.body.publisher_name || null;
    let slidesData = [];
    try {
      const raw = req.body.slides || req.body.slide;
      if (raw) slidesData = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (_) {}
    const duration_seconds = Math.min(60, Math.max(1, parseInt(req.body.duration_seconds, 10) || 5));
    const [groupResult] = await db.query(
      'INSERT INTO story_groups (avatar, publisher_name, duration_seconds, created_at, published_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [avatar, publisher_name, duration_seconds]
    );
    const groupId = groupResult.insertId;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const { isVideo, isImage, media_type } = detectMediaType(f);
      if (!isVideo && !isImage) {
        return res.status(400).json({ message: 'نوع ملف غير مدعوم. استخدم صورة (jpg, png, webp) أو فيديو (mp4, webm, mov)' });
      }
      const mediaPath = `/uploads/${f.filename}`;
      const slide = Array.isArray(slidesData) && slidesData[i] ? slidesData[i] : {};
      await db.query(
        `INSERT INTO story_slides (story_group_id, image, media_type, thumbnail, link_type, link_value, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [groupId, mediaPath, media_type, null, slide.link_type || 'none', slide.link_value || null, i]
      );
    }
    res.status(201).json({ message: 'تم إضافة اليومية بنجاح', id: groupId });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const [groups] = await db.query('SELECT id, avatar FROM story_groups WHERE id = ?', [groupId]);
    if (!groups?.length) {
      return res.status(404).json({ message: 'اليومية غير موجودة' });
    }

    const avatarFile = req.files?.avatar?.[0];
    const newFiles = req.files?.videos || req.files?.images || [];
    let slidesPayload = [];
    try {
      const raw = req.body.slides;
      if (raw) slidesPayload = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (_) {
      return res.status(400).json({ message: 'بيانات الشرائح غير صالحة' });
    }
    if (!Array.isArray(slidesPayload)) {
      return res.status(400).json({ message: 'بيانات الشرائح غير صالحة' });
    }

    const activeSlides = slidesPayload.filter((s) => !s._delete);
    if (activeSlides.length === 0) {
      return res.status(400).json({ message: 'يجب أن تحتوي اليومية على شريحة واحدة على الأقل' });
    }

    let fileIdx = 0;
    for (const sl of activeSlides) {
      const needsFile = !sl.id || sl.replace_media;
      if (needsFile) {
        if (!newFiles[fileIdx]) {
          return res.status(400).json({ message: 'ملف مفقود لإحدى الشرائح الجديدة أو المستبدلة' });
        }
        const { isVideo, isImage } = detectMediaType(newFiles[fileIdx]);
        if (!isVideo && !isImage) {
          return res.status(400).json({ message: 'نوع ملف غير مدعوم. استخدم صورة أو فيديو' });
        }
        fileIdx++;
      }
    }

    const publisher_name = req.body.publisher_name ?? null;
    const duration_seconds = Math.min(60, Math.max(1, parseInt(req.body.duration_seconds, 10) || 5));
    const avatar = avatarFile ? `/uploads/${avatarFile.filename}` : groups[0].avatar;

    await db.query(
      'UPDATE story_groups SET avatar = ?, publisher_name = ?, duration_seconds = ? WHERE id = ?',
      [avatar, publisher_name, duration_seconds, groupId]
    );

    fileIdx = 0;
    let sortOrder = 0;
    for (const sl of slidesPayload) {
      if (sl._delete && sl.id) {
        await db.query('DELETE FROM story_slides WHERE id = ? AND story_group_id = ?', [sl.id, groupId]);
        continue;
      }
      if (sl._delete) continue;

      const link_type = sl.link_type || 'none';
      const link_value = sl.link_value || null;

      if (sl.id) {
        if (sl.replace_media && newFiles[fileIdx]) {
          const f = newFiles[fileIdx++];
          const { media_type } = detectMediaType(f);
          const mediaPath = `/uploads/${f.filename}`;
          await db.query(
            `UPDATE story_slides SET image = ?, media_type = ?, thumbnail = ?, link_type = ?, link_value = ?, sort_order = ? WHERE id = ? AND story_group_id = ?`,
            [mediaPath, media_type, null, link_type, link_value, sortOrder, sl.id, groupId]
          );
        } else {
          await db.query(
            'UPDATE story_slides SET link_type = ?, link_value = ?, sort_order = ? WHERE id = ? AND story_group_id = ?',
            [link_type, link_value, sortOrder, sl.id, groupId]
          );
        }
      } else {
        const f = newFiles[fileIdx++];
        const { media_type } = detectMediaType(f);
        const mediaPath = `/uploads/${f.filename}`;
        await db.query(
          `INSERT INTO story_slides (story_group_id, image, media_type, thumbnail, link_type, link_value, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [groupId, mediaPath, media_type, null, link_type, link_value, sortOrder]
        );
      }
      sortOrder++;
    }

    res.json({ message: 'تم تحديث اليومية بنجاح' });
  } catch (error) {
    console.error('Update story error:', error);
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

exports.republish = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id FROM story_groups WHERE id = ?', [req.params.id]);
    if (!rows?.length) {
      return res.status(404).json({ message: 'اليومية غير موجودة' });
    }
    await db.query('UPDATE story_groups SET published_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم إعادة عرض اليومية بنجاح' });
  } catch (error) {
    console.error('Republish story error:', error);
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
