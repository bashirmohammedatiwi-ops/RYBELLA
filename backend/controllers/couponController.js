const db = require('../config/database');

exports.create = async (req, res) => {
  try {
    const { code, discount_percent, expiration_date } = req.body;

    if (!code || !discount_percent) {
      return res.status(400).json({ message: 'الكود ونسبة الخصم مطلوبة' });
    }

    const [existing] = await db.query('SELECT id FROM coupons WHERE code = ?', [code]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'هذا الكود مستخدم بالفعل' });
    }

    await db.query(
      'INSERT INTO coupons (code, discount_percent, expiration_date, active) VALUES (?, ?, ?, 1)',
      [code.toUpperCase(), discount_percent, expiration_date || null]
    );
    res.status(201).json({ message: 'تم إنشاء الكوبون بنجاح' });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.apply = async (req, res) => {
  try {
    const { code, total_price } = req.body;

    if (!code || !total_price) {
      return res.status(400).json({ message: 'الكود والمبلغ الإجمالي مطلوبان' });
    }

    const [coupons] = await db.query(
      'SELECT * FROM coupons WHERE code = ? AND active = 1 AND (expiration_date IS NULL OR expiration_date > NOW())',
      [code.toUpperCase()]
    );

    if (coupons.length === 0) {
      return res.status(400).json({ message: 'الكوبون غير صالح أو منتهي الصلاحية' });
    }

    const coupon = coupons[0];
    const discount = total_price * (coupon.discount_percent / 100);
    res.json({
      valid: true,
      discount_percent: coupon.discount_percent,
      discount_amount: discount,
      final_price: total_price - discount
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const [coupons] = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json(coupons);
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
