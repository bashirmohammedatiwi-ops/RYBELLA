const db = require('../config/database');
const { enrichProductPricing } = require('../services/inventorySyncService');
const {
  isBarcodeLikeSearch,
  buildBarcodeSearchClause,
  buildSmartSearchClause,
  rankSearchResults,
} = require('../services/productSearch');

const VARIANT_PUBLIC_FIELDS = 'id, shade_name, color_code, price, original_price, discount_percent, stock, image, expiration_date, barcode, sku';

exports.getAll = async (req, res) => {
  try {
    const { brand_id, category_id, subcategory_id, min_price, max_price, search, status, featured, product_ids, tags, color_code, sort_by } = req.query;
    let query = `
      SELECT p.*, b.name as brand_name, c.name as category_name, s.name as subcategory_name,
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.stock > 0) as available_variants,
        (SELECT MIN(price) FROM product_variants WHERE product_id = p.id) as min_price,
        (SELECT MAX(price) FROM product_variants WHERE product_id = p.id) as max_price
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (brand_id) {
      query += ' AND p.brand_id = ?';
      params.push(brand_id);
    }
    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }
    if (subcategory_id) {
      query += ' AND p.subcategory_id = ?';
      params.push(subcategory_id);
    }
    if (status) {
      query += ' AND COALESCE(p.status, \'published\') = ?';
      params.push(status);
    }
    if (featured === '1' || featured === 'true') {
      query += ' AND p.is_featured = 1';
    }
    if (product_ids !== undefined && product_ids !== null) {
      const ids = String(product_ids).split(',').map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id));
      if (ids.length > 0) {
        query += ' AND p.id IN (' + ids.join(',') + ')';
      } else {
        query += ' AND 1=0';
      }
    }
    let searchMeta = null;
    if (search) {
      const searchVal = String(search).trim();
      if (isBarcodeLikeSearch(searchVal)) {
        const barcodeSearch = buildBarcodeSearchClause(searchVal);
        query += barcodeSearch.clause;
        params.push(...barcodeSearch.params);
      } else {
        const smartSearch = buildSmartSearchClause(searchVal);
        if (smartSearch) {
          query += smartSearch.clause;
          params.push(...smartSearch.params);
          searchMeta = smartSearch.meta;
        }
      }
    }
    if (tags) {
      const tagList = String(tags).split(/[,،]/).map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        const conditions = tagList.map(() => 'p.tags LIKE ?').join(' OR ');
        query += ' AND (' + conditions + ')';
        tagList.forEach((t) => params.push(`%${t}%`));
      }
    }
    if (color_code) {
      query += ' AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND (pv.color_code = ? OR LOWER(pv.shade_name) LIKE ?))';
      params.push(color_code, `%${String(color_code).toLowerCase()}%`);
    }

    const orderMap = {
      price_asc: '(SELECT MIN(price) FROM product_variants WHERE product_id = p.id) ASC',
      price_desc: '(SELECT MAX(price) FROM product_variants WHERE product_id = p.id) DESC',
      newest: 'p.created_at DESC',
    };
    const defaultOrder = 'COALESCE(c.sort_order, 999) ASC, p.sort_order ASC, p.name ASC';
    const useRelevanceSort = searchMeta && !sort_by;
    const orderClause = useRelevanceSort ? defaultOrder : (orderMap[sort_by] || defaultOrder);
    query += ' ORDER BY ' + orderClause;

    const [products] = await db.query(query, params);
    let filteredProducts = products;

    if (min_price || max_price) {
      filteredProducts = products.filter(p => {
        const min = parseFloat(p.min_price) || 0;
        const max = parseFloat(p.max_price) || Infinity;
        if (min_price && min < parseFloat(min_price)) return false;
        if (max_price && max > parseFloat(max_price)) return false;
        return true;
      });
    }

    for (const product of filteredProducts) {
      const [variants] = await db.query(
        `SELECT ${VARIANT_PUBLIC_FIELDS} FROM product_variants WHERE product_id = ?`,
        [product.id]
      );
      product.variants = variants;
      enrichProductPricing(product);
      const [images] = await db.query('SELECT image_url FROM product_images WHERE product_id = ?', [product.id]);
      product.images = images.map(i => i.image_url);
      if (product.tags && typeof product.tags === 'string') {
        product.tags = product.tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    if (searchMeta && !sort_by) {
      filteredProducts = rankSearchResults(filteredProducts, searchMeta);
    }

    res.json(filteredProducts);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getFilters = async (req, res) => {
  try {
    let tags = [];
    const [products] = await db.query('SELECT tags FROM products WHERE tags IS NOT NULL AND tags != \'\' AND COALESCE(status, \'published\') = \'published\'');
    const tagSet = new Set();
    products.forEach((p) => {
      (p.tags || '').split(/[,،]/).forEach((t) => {
        const v = t.trim();
        if (v) tagSet.add(v);
      });
    });
    tags = [...tagSet].sort();
    const [colorRows] = await db.query(
      `SELECT DISTINCT pv.color_code, pv.shade_name FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE COALESCE(p.status, 'published') = 'published' AND (pv.color_code IS NOT NULL OR pv.shade_name IS NOT NULL)
       ORDER BY pv.shade_name`
    );
    const colors = colorRows.map((r) => ({ code: r.color_code || '#000000', name: r.shade_name || r.color_code || 'غير محدد' }));
    res.json({ tags, colors });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, b.name as brand_name, b.logo as brand_logo, c.name as category_name, s.name as subcategory_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }

    const product = products[0];
    const [variants] = await db.query(`SELECT ${VARIANT_PUBLIC_FIELDS}, barcode, sku, batch_number, last_synced_at FROM product_variants WHERE product_id = ?`, [product.id]);
    product.variants = variants;
    enrichProductPricing(product);
    if (product.tags && typeof product.tags === 'string') {
      product.tags = product.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
    const [images] = await db.query('SELECT image_url FROM product_images WHERE product_id = ?', [product.id]);
    product.images = images.map(i => i.image_url);
    const [reviews] = await db.query(`
      SELECT r.*, u.name as user_name FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
    `, [product.id]);
    for (const r of reviews) {
      const [imgs] = await db.query('SELECT image_url FROM review_images WHERE review_id = ? ORDER BY id', [r.id]);
      r.images = (imgs || []).map((i) => i.image_url);
    }
    product.reviews = reviews;

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const [reviews] = await db.query(`
      SELECT r.*, u.name as user_name FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
    `, [req.params.id]);
    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, brand_id, category_id, subcategory_id, description, barcode, status, is_featured, is_best_seller, new_until, meta_title, meta_description, tags, sort_order } = req.body;
    const mainImageFile = req.files?.main_image?.[0];
    const main_image = mainImageFile ? `/uploads/${mainImageFile.filename}` : null;

    if (!name || !brand_id || !category_id) {
      return res.status(400).json({ message: 'الاسم والعلامة التجارية والفئة مطلوبة' });
    }

    const subId = subcategory_id && subcategory_id !== '' && subcategory_id !== 'null' ? subcategory_id : null;
    const prodStatus = ['draft', 'published', 'archived'].includes(status) ? status : 'published';
    const featured = is_featured === '1' || is_featured === 'true' ? 1 : 0;
    const bestSeller = is_best_seller === '1' || is_best_seller === 'true' ? 1 : 0;
    const tagsStr = Array.isArray(tags) ? tags.join(',') : (typeof tags === 'string' ? tags : '');
    let prodOrder = sort_order !== undefined && sort_order !== '' ? parseInt(sort_order, 10) : null;
    if (prodOrder === null || isNaN(prodOrder)) {
      const [maxRow] = await db.query(
        'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM products WHERE category_id = ?',
        [category_id]
      );
      prodOrder = maxRow[0]?.next_order ?? 0;
    }

    const [result] = await db.query(
      `INSERT INTO products (name, brand_id, category_id, subcategory_id, description, main_image, barcode, status, is_featured, is_best_seller, new_until, meta_title, meta_description, tags, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, brand_id, category_id, subId, description || null, main_image, barcode || null, prodStatus, featured, bestSeller, new_until || null, meta_title || null, meta_description || null, tagsStr || null, prodOrder]
    );

    const imageFiles = req.files?.images || [];
    for (const file of imageFiles) {
      await db.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [
        result.insertId,
        `/uploads/${file.filename}`
      ]);
    }

    res.status(201).json({ message: 'تم إنشاء المنتج بنجاح', id: result.insertId });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, brand_id, category_id, subcategory_id, description, barcode, status, is_featured, is_best_seller, new_until, meta_title, meta_description, tags, sort_order } = req.body;
    const mainImageFile = req.files?.main_image?.[0];
    const main_image = mainImageFile ? `/uploads/${mainImageFile.filename}` : undefined;

    const subId = subcategory_id && subcategory_id !== '' && subcategory_id !== 'null' ? subcategory_id : null;
    const prodStatus = ['draft', 'published', 'archived'].includes(status) ? status : undefined;
    const featured = is_featured === '1' || is_featured === 'true' ? 1 : is_featured === '0' || is_featured === 'false' ? 0 : undefined;
    const bestSeller = is_best_seller === '1' || is_best_seller === 'true' ? 1 : is_best_seller === '0' || is_best_seller === 'false' ? 0 : undefined;
    const tagsStr = Array.isArray(tags) ? tags.join(',') : (typeof tags === 'string' ? tags : undefined);

    let query = 'UPDATE products SET name = ?, brand_id = ?, category_id = ?, subcategory_id = ?, description = ?, barcode = ?';
    const params = [name, brand_id, category_id, subId, description || null, barcode || null];

    if (main_image) {
      query += ', main_image = ?';
      params.push(main_image);
    }
    if (prodStatus !== undefined) {
      query += ', status = ?';
      params.push(prodStatus);
    }
    if (featured !== undefined) {
      query += ', is_featured = ?';
      params.push(featured);
    }
    if (bestSeller !== undefined) {
      query += ', is_best_seller = ?';
      params.push(bestSeller);
    }
    if (new_until !== undefined) {
      query += ', new_until = ?';
      params.push(new_until || null);
    }
    if (meta_title !== undefined) {
      query += ', meta_title = ?';
      params.push(meta_title || null);
    }
    if (meta_description !== undefined) {
      query += ', meta_description = ?';
      params.push(meta_description || null);
    }
    if (tagsStr !== undefined) {
      query += ', tags = ?';
      params.push(tagsStr || null);
    }
    if (sort_order !== undefined && sort_order !== '') {
      query += ', sort_order = ?';
      params.push(parseInt(sort_order, 10) || 0);
    }
    query += ' WHERE id = ?';
    params.push(req.params.id);

    await db.query(query, params);

    const imageFiles = req.files?.images || [];
    if (imageFiles.length > 0) {
      await db.query('DELETE FROM product_images WHERE product_id = ?', [req.params.id]);
      for (const file of imageFiles) {
        await db.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [
          req.params.id,
          `/uploads/${file.filename}`
        ]);
      }
    }

    res.json({ message: 'تم تحديث المنتج بنجاح' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM product_images WHERE product_id = ?', [req.params.id]);
    await db.query('DELETE FROM product_variants WHERE product_id = ?', [req.params.id]);
    await db.query('DELETE FROM reviews WHERE product_id = ?', [req.params.id]);
    await db.query('DELETE FROM wishlist WHERE product_id = ?', [req.params.id]);
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف المنتج بنجاح' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.reorder = async (req, res) => {
  try {
    const { items, category_id: categoryId } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items مطلوب (مصفوفة من {id, sort_order})' });
    }

    if (categoryId) {
      const ids = items.map((item) => item.id).filter((id) => id != null);
      if (ids.length !== items.length) {
        return res.status(400).json({ message: 'معرّفات المنتجات غير صالحة' });
      }
      const placeholders = ids.map(() => '?').join(',');
      const [rows] = await db.query(
        `SELECT id FROM products WHERE category_id = ? AND id IN (${placeholders})`,
        [categoryId, ...ids]
      );
      if (rows.length !== ids.length) {
        return res.status(400).json({ message: 'يجب أن تكون جميع المنتجات ضمن نفس القسم' });
      }
    }

    for (const item of items) {
      if (item.id != null && item.sort_order != null) {
        await db.query('UPDATE products SET sort_order = ? WHERE id = ?', [parseInt(item.sort_order, 10) || 0, item.id]);
      }
    }
    res.json({ message: 'تم تحديث الترتيب بنجاح' });
  } catch (error) {
    console.error('Reorder products error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.duplicate = async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (products.length === 0) return res.status(404).json({ message: 'المنتج غير موجود' });
    const src = products[0];
    const [maxRow] = await db.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM products WHERE category_id = ?',
      [src.category_id]
    );
    const nextOrder = maxRow[0]?.next_order ?? 0;
    const [ins] = await db.query(
      `INSERT INTO products (name, brand_id, category_id, subcategory_id, description, main_image, barcode, status, is_featured, is_best_seller, new_until, meta_title, meta_description, tags, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        (src.name || '') + ' (نسخة)',
        src.brand_id,
        src.category_id,
        src.subcategory_id,
        src.description,
        src.main_image,
        null,
        'draft',
        src.is_featured || 0,
        src.is_best_seller || 0,
        src.new_until,
        src.meta_title,
        src.meta_description,
        src.tags,
        nextOrder,
      ]
    );
    const newId = ins.insertId;
    const [variants] = await db.query('SELECT * FROM product_variants WHERE product_id = ?', [req.params.id]);
    for (const v of variants) {
      await db.query(
        'INSERT INTO product_variants (product_id, shade_name, color_code, barcode, sku, price, stock, image, expiration_date, batch_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, v.shade_name, v.color_code || '#000000', null, null, v.price, v.stock || 0, v.image, v.expiration_date, v.batch_number]
      );
    }
    const [imgs] = await db.query('SELECT image_url FROM product_images WHERE product_id = ?', [req.params.id]);
    for (const img of imgs) {
      await db.query('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)', [newId, img.image_url, 0]);
    }
    res.status(201).json({ message: 'تم نسخ المنتج بنجاح', id: newId });
  } catch (error) {
    console.error('Duplicate product error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
