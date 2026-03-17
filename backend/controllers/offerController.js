const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM offers WHERE active = 1 ORDER BY sort_order ASC, id ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM offers WHERE id = ? AND active = 1',
      [req.params.id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'العرض غير موجود' });
    }
    const offer = rows[0];
    let productIds = [];
    try {
      const parsed = typeof offer.product_ids === 'string' ? JSON.parse(offer.product_ids || '[]') : offer.product_ids || [];
      productIds = Array.isArray(parsed) ? parsed.filter((n) => !isNaN(parseInt(n, 10))) : [];
    } catch (_) {}
    let products = [];
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      const [prods] = await db.query(
        `SELECT p.*, b.name as brand_name,
          (SELECT MIN(price) FROM product_variants WHERE product_id = p.id) as min_price,
          (SELECT id FROM product_variants WHERE product_id = p.id AND stock > 0 LIMIT 1) as default_variant_id
         FROM products p
         LEFT JOIN brands b ON p.brand_id = b.id
         WHERE p.id IN (${placeholders}) AND COALESCE(p.status, 'published') = 'published'`,
        productIds
      );
      const orderMap = {};
      productIds.forEach((id, i) => { orderMap[Number(id)] = i; });
      const sorted = (prods || []).sort((a, b) => (orderMap[a.id] ?? 99) - (orderMap[b.id] ?? 99));
      for (const p of sorted) {
        const [variants] = await db.query(
          'SELECT id, shade_name, color_code, price, stock, image FROM product_variants WHERE product_id = ?',
          [p.id]
        );
        const [imgs] = await db.query('SELECT image_url FROM product_images WHERE product_id = ?', [p.id]);
        p.variants = variants || [];
        p.images = (imgs || []).map((i) => i.image_url);
        p.main_image = p.main_image || (imgs?.[0]?.image_url) || (variants?.[0]?.image);
        products.push(p);
      }
    }
    res.json({ ...offer, products });
  } catch (error) {
    console.error('Get offer by id error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getAllAdmin = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM offers ORDER BY sort_order ASC, id ASC');
    res.json(rows);
  } catch (error) {
    console.error('Get offers admin error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, discount_label, product_ids, sort_order, active, discount_percent } = req.body;
    const image = req.file ? '/uploads/' + req.file.filename : null;
    if (!image) {
      return res.status(400).json({ message: 'الصورة مطلوبة' });
    }
    const productIdsStr = Array.isArray(product_ids)
      ? JSON.stringify(product_ids)
      : typeof product_ids === 'string'
        ? product_ids
        : product_ids || '[]';
    const discountPct = parseFloat(discount_percent) || 0;
    const [result] = await db.query(
      'INSERT INTO offers (title, image, discount_label, product_ids, discount_percent, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title || '', image, discount_label || null, productIdsStr, discountPct, sort_order || 0, active !== undefined ? active : 1]
    );
    res.status(201).json({ message: 'تم إنشاء العرض بنجاح', id: result.insertId });
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { title, discount_label, product_ids, sort_order, active, discount_percent } = req.body;
    const image = req.file ? '/uploads/' + req.file.filename : undefined;
    const productIdsStr = Array.isArray(product_ids)
      ? JSON.stringify(product_ids)
      : typeof product_ids === 'string'
        ? product_ids
        : product_ids || '[]';
    const discountPct = parseFloat(discount_percent) || 0;
    let query = 'UPDATE offers SET title = ?, discount_label = ?, product_ids = ?, discount_percent = ?, sort_order = ?, active = ?';
    const params = [title || '', discount_label || null, productIdsStr, discountPct, sort_order || 0, active !== undefined ? active : 1];
    if (image) {
      query += ', image = ?';
      params.push(image);
    }
    query += ' WHERE id = ?';
    params.push(req.params.id);
    await db.query(query, params);
    res.json({ message: 'تم تحديث العرض بنجاح' });
  } catch (error) {
    console.error('Update offer error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM offers WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف العرض بنجاح' });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
