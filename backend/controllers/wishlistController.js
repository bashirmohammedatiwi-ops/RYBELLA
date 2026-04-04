const db = require('../config/database');

exports.getWishlist = async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT p.*, b.name as brand_name,
        (SELECT MIN(price) FROM product_variants WHERE product_id = p.id) as min_price,
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.stock > 0) as in_stock
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE w.user_id = ?
    `, [req.user.id]);
    res.json(items);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!productId) {
      return res.status(400).json({ message: 'معرف المنتج مطلوب' });
    }

    const [existing] = await db.query('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'المنتج موجود بالفعل في المفضلة' });
    }

    await db.query('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [req.user.id, productId]);
    res.status(201).json({ message: 'تمت الإضافة إلى المفضلة' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    await db.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
    res.json({ message: 'تم الحذف من المفضلة' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
