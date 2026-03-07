const db = require('../config/database');

exports.create = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { shade_name, color_code, barcode, sku, price, stock, expiration_date } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!shade_name || !price) {
      return res.status(400).json({ message: 'اسم الظل والسعر مطلوبان' });
    }
    if (!barcode || !barcode.trim()) {
      return res.status(400).json({ message: 'الباركود مطلوب لكل منتج/ظل' });
    }

    const [result] = await db.query(
      `INSERT INTO product_variants (product_id, shade_name, color_code, barcode, sku, price, stock, image, expiration_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [product_id, shade_name, color_code || null, barcode || null, sku || null, price, stock || 0, image, expiration_date || null]
    );

    res.status(201).json({ message: 'تم إنشاء الظل بنجاح', id: result.insertId });
  } catch (error) {
    console.error('Create variant error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { shade_name, color_code, barcode, sku, price, stock, expiration_date } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    let query = `UPDATE product_variants SET shade_name = ?, color_code = ?, barcode = ?, sku = ?, price = ?, stock = ?, expiration_date = ?`;
    const params = [shade_name, color_code || null, barcode || null, sku || null, price, stock || 0, expiration_date || null];

    if (image) {
      query += ', image = ?';
      params.push(image);
    }
    query += ' WHERE id = ?';
    params.push(req.params.id);

    await db.query(query, params);
    res.json({ message: 'تم تحديث الظل بنجاح' });
  } catch (error) {
    console.error('Update variant error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM order_items WHERE variant_id = ?', [req.params.id]);
    await db.query('DELETE FROM cart_items WHERE variant_id = ?', [req.params.id]);
    await db.query('DELETE FROM product_variants WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف الظل بنجاح' });
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
