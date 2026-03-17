const db = require('../config/database');

exports.getById = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.*, u.name as customer_name, u.phone as customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [req.params.id]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }
    const order = orders[0];
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ message: 'غير مصرح' });
    }
    const [items] = await db.query(`
      SELECT oi.*, pv.shade_name, pv.barcode, p.name as product_name
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE oi.order_id = ?
    `, [order.id]);
    order.items = items;
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let query = `
      SELECT o.*, u.name as customer_name, u.phone as customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
    `;
    const params = [];
    if (!isAdmin) {
      query += ' WHERE o.user_id = ?';
      params.push(req.user.id);
    }
    query += ' ORDER BY o.created_at DESC';
    const [orders] = await db.query(query, params);

    for (const order of orders) {
      const [items] = await db.query(`
        SELECT oi.*, pv.shade_name, pv.barcode, p.name as product_name
        FROM order_items oi
        JOIN product_variants pv ON oi.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { items, address, city, payment_method, coupon_code } = req.body;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0 || !address || !city) {
      return res.status(400).json({ message: 'عناصر الطلب والعنوان والمدينة مطلوبة' });
    }

    const [zone] = await db.query('SELECT delivery_fee FROM delivery_zones WHERE city = ?', [city]);
    const delivery_fee = zone.length > 0 ? parseFloat(zone[0].delivery_fee) : 5000;

    let total_price = 0;
    const orderItems = [];
    const orderProductIds = new Set();
    for (const item of items) {
      const [variant] = await db.query('SELECT price, stock, product_id FROM product_variants WHERE id = ?', [item.variant_id]);
      if (variant.length === 0) {
        return res.status(400).json({ message: `المنتج غير موجود: ${item.variant_id}` });
      }
      if (variant[0].stock < item.quantity) {
        return res.status(400).json({ message: `الكمية غير متوفرة للمنتج: ${item.variant_id}` });
      }
      total_price += variant[0].price * item.quantity;
      orderProductIds.add(variant[0].product_id);
      orderItems.push({ variant_id: item.variant_id, quantity: item.quantity, price: variant[0].price, product_id: variant[0].product_id });
    }

    let discount = 0;
    const [offers] = await db.query('SELECT id, product_ids, discount_percent FROM offers WHERE active = 1 AND (discount_percent IS NOT NULL AND discount_percent > 0)');
    for (const offer of offers || []) {
      let offerProductIds = [];
      try {
        const parsed = typeof offer.product_ids === 'string' ? JSON.parse(offer.product_ids || '[]') : offer.product_ids || [];
        offerProductIds = Array.isArray(parsed) ? parsed.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n)) : [];
      } catch (_) {}
      if (offerProductIds.length === 0) continue;
      const offerSet = new Set(offerProductIds);
      const hasAll = offerProductIds.every((pid) => orderProductIds.has(pid));
      if (!hasAll) continue;
      const bundleSubtotal = orderItems
        .filter((oi) => offerSet.has(oi.product_id))
        .reduce((s, oi) => s + oi.price * oi.quantity, 0);
      discount += bundleSubtotal * (parseFloat(offer.discount_percent) || 0) / 100;
      break;
    }
    if (coupon_code) {
      const [coupon] = await db.query(
        "SELECT discount_percent FROM coupons WHERE code = ? AND active = 1 AND expiration_date > date('now')",
        [coupon_code]
      );
      if (coupon.length > 0) {
        discount = total_price * (coupon[0].discount_percent / 100);
      }
    }

    const final_price = total_price + delivery_fee - discount;

    const [orderResult] = await db.query(
      `INSERT INTO orders (user_id, total_price, delivery_fee, discount, final_price, status, payment_method, address, city, phone, coupon_code)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [userId, total_price, delivery_fee, discount, final_price, payment_method || 'cash', address, city, req.body.phone || null, req.body.coupon_code || null]
    );

    for (const item of orderItems) {
      await db.query(
        'INSERT INTO order_items (order_id, variant_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderResult.insertId, item.variant_id, item.quantity, item.price]
      );
      await db.query('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [item.quantity, item.variant_id]);
    }

    await db.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM cart WHERE user_id = ?)', [userId]);

    res.status(201).json({
      message: 'تم إنشاء الطلب بنجاح',
      order_id: orderResult.insertId,
      final_price
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'حالة غير صالحة' });
    }

    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'تم تحديث حالة الطلب بنجاح' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
