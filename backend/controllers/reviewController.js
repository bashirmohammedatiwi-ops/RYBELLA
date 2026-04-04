const db = require('../config/database');

exports.create = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;
    const user_id = req.user.id;
    const imageFiles = req.files || [];

    if (!product_id || !rating) {
      return res.status(400).json({ message: 'معرف المنتج والتقييم مطلوبان' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'التقييم يجب أن يكون بين 1 و 5' });
    }

    const [existing] = await db.query('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?', [user_id, product_id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'لقد قمت بتقييم هذا المنتج مسبقاً' });
    }

    const [result] = await db.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
      [user_id, product_id, rating, comment || null]
    );
    const reviewId = result.insertId;
    for (const file of imageFiles) {
      const imageUrl = `/uploads/${file.filename}`;
      await db.query('INSERT INTO review_images (review_id, image_url) VALUES (?, ?)', [reviewId, imageUrl]);
    }
    res.status(201).json({ message: 'تم إضافة التقييم بنجاح', id: reviewId });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const [reviews] = await db.query(`
      SELECT r.*, u.name as user_name, p.name as product_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `);
    for (const r of reviews) {
      const [imgs] = await db.query('SELECT image_url FROM review_images WHERE review_id = ? ORDER BY id', [r.id]);
      r.images = (imgs || []).map((i) => i.image_url);
    }
    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getByProduct = async (req, res) => {
  try {
    const [reviews] = await db.query(`
      SELECT r.*, u.name as user_name FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
    `, [req.params.productId]);
    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM review_images WHERE review_id = ?', [req.params.id]);
    await db.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف التقييم بنجاح' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
