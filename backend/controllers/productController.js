const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { brand_id, category_id, min_price, max_price, search } = req.query;
    let query = `
      SELECT p.*, b.name as brand_name, c.name as category_name,
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.stock > 0) as available_variants,
        (SELECT MIN(price) FROM product_variants WHERE product_id = p.id) as min_price,
        (SELECT MAX(price) FROM product_variants WHERE product_id = p.id) as max_price
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
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
    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

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
        'SELECT id, shade_name, color_code, price, stock, image FROM product_variants WHERE product_id = ?',
        [product.id]
      );
      product.variants = variants;
      const [images] = await db.query('SELECT image_url FROM product_images WHERE product_id = ?', [product.id]);
      product.images = images.map(i => i.image_url);
    }

    res.json(filteredProducts);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, b.name as brand_name, b.logo as brand_logo, c.name as category_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }

    const product = products[0];
    const [variants] = await db.query('SELECT * FROM product_variants WHERE product_id = ?', [product.id]);
    product.variants = variants;
    const [images] = await db.query('SELECT image_url FROM product_images WHERE product_id = ?', [product.id]);
    product.images = images.map(i => i.image_url);
    const [reviews] = await db.query(`
      SELECT r.*, u.name as user_name FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
    `, [product.id]);
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
    const { name, brand_id, category_id, description } = req.body;
    const mainImageFile = req.files?.main_image?.[0];
    const main_image = mainImageFile ? `/uploads/${mainImageFile.filename}` : null;

    if (!name || !brand_id || !category_id) {
      return res.status(400).json({ message: 'الاسم والعلامة التجارية والفئة مطلوبة' });
    }

    const [result] = await db.query(
      'INSERT INTO products (name, brand_id, category_id, description, main_image) VALUES (?, ?, ?, ?, ?)',
      [name, brand_id, category_id, description || null, main_image]
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
    const { name, brand_id, category_id, description } = req.body;
    const mainImageFile = req.files?.main_image?.[0];
    const main_image = mainImageFile ? `/uploads/${mainImageFile.filename}` : undefined;

    let query = 'UPDATE products SET name = ?, brand_id = ?, category_id = ?, description = ?';
    const params = [name, brand_id, category_id, description || null];

    if (main_image) {
      query += ', main_image = ?';
      params.push(main_image);
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
