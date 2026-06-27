const db = require('../config/database');
const { getFreeShippingThreshold, computeDeliveryFee } = require('../utils/delivery');
const { ORDER_STATUSES, isValidOrderStatus } = require('../utils/orderStatus');
const { validateBundleLines } = require('../services/bundleService');
const { roundSalePrice } = require('../utils/pricing');

const ORDER_ITEMS_SELECT = `
  SELECT oi.*, pv.shade_name, pv.barcode, pv.image as variant_image,
    p.name as product_name, p.main_image as product_image, p.id as product_id
  FROM order_items oi
  JOIN product_variants pv ON oi.variant_id = pv.id
  JOIN products p ON pv.product_id = p.id
  WHERE oi.order_id = ?
`;

const ORDER_BUNDLE_ITEMS_SELECT = `
  SELECT obi.*, pv.image as variant_image, p.main_image as product_image, p.id as product_id
  FROM order_bundle_items obi
  LEFT JOIN product_variants pv ON obi.variant_id = pv.id
  LEFT JOIN products p ON pv.product_id = p.id
  WHERE obi.order_bundle_id = ?
`;

async function attachOrderBundles(order) {
  const [bundles] = await db.query('SELECT * FROM order_bundles WHERE order_id = ?', [order.id]);
  for (const bundle of bundles) {
    const [lines] = await db.query(ORDER_BUNDLE_ITEMS_SELECT, [bundle.id]);
    bundle.items = lines;
  }
  order.bundles = bundles;
  return order;
}

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
    const [items] = await db.query(ORDER_ITEMS_SELECT, [order.id]);
    order.items = items;
    await attachOrderBundles(order);
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
      const [items] = await db.query(ORDER_ITEMS_SELECT, [order.id]);
      order.items = items;
      await attachOrderBundles(order);
    }

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { items, bundles, address, city, payment_method, coupon_code } = req.body;
    const userId = req.user.id;
    const lineItems = Array.isArray(items) ? items : [];
    const bundleOrders = Array.isArray(bundles) ? bundles : [];

    if ((!lineItems.length && !bundleOrders.length) || !address || !city) {
      return res.status(400).json({ message: 'عناصر الطلب والعنوان والمدينة مطلوبة' });
    }

    const [zone] = await db.query('SELECT delivery_fee FROM delivery_zones WHERE city = ?', [city]);
    const zoneFee = zone.length > 0 ? parseFloat(zone[0].delivery_fee) : 5000;
    const freeShippingThreshold = await getFreeShippingThreshold(db);

    let total_price = 0;
    let discount = 0;
    const orderItems = [];
    const orderBundles = [];

    for (const item of lineItems) {
      const [variant] = await db.query('SELECT price, stock, product_id FROM product_variants WHERE id = ?', [item.variant_id]);
      if (variant.length === 0) {
        return res.status(400).json({ message: `المنتج غير موجود: ${item.variant_id}` });
      }
      if (variant[0].stock < item.quantity) {
        return res.status(400).json({ message: `الكمية غير متوفرة للمنتج: ${item.variant_id}` });
      }
      const unitPrice = roundSalePrice(variant[0].price);
      total_price += unitPrice * item.quantity;
      orderItems.push({
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: unitPrice,
        product_id: variant[0].product_id,
      });
    }

    for (const bundle of bundleOrders) {
      const qty = parseInt(bundle.quantity, 10) || 1;
      const validation = await validateBundleLines(bundle.offer_id, bundle.lines);
      if (!validation.ok) {
        return res.status(400).json({ message: validation.message });
      }
      const bundleSubtotal = validation.pricing.subtotal * qty;
      const bundleDiscount = validation.pricing.discount * qty;
      const bundleTotal = validation.pricing.unitTotal * qty;
      total_price += bundleSubtotal;
      discount += bundleDiscount;
      orderBundles.push({
        offer_id: bundle.offer_id,
        offer_title: validation.offer.title,
        discount_percent: validation.offer.discount_percent || 0,
        quantity: qty,
        subtotal: bundleSubtotal,
        total_price: bundleTotal,
        lines: validation.lines,
      });
    }

    if (coupon_code) {
      const [coupon] = await db.query(
        "SELECT discount_percent FROM coupons WHERE code = ? AND active = 1 AND expiration_date > date('now')",
        [coupon_code]
      );
      if (coupon.length > 0) {
        discount = roundSalePrice(total_price * (coupon[0].discount_percent / 100));
      }
    }

    const delivery_fee = computeDeliveryFee(total_price, zoneFee, freeShippingThreshold);
    const final_price = roundSalePrice(total_price + delivery_fee - discount);

    const [orderResult] = await db.query(
      `INSERT INTO orders (user_id, total_price, delivery_fee, discount, final_price, status, payment_method, address, city, phone, coupon_code)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [userId, total_price, delivery_fee, discount, final_price, payment_method || 'cash', address, city, req.body.phone || null, req.body.coupon_code || null]
    );

    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await db.query(
        'INSERT INTO order_items (order_id, variant_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.variant_id, item.quantity, item.price]
      );
      await db.query('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [item.quantity, item.variant_id]);
    }

    for (const bundle of orderBundles) {
      const [bundleResult] = await db.query(
        `INSERT INTO order_bundles (order_id, offer_id, offer_title, discount_percent, quantity, subtotal, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, bundle.offer_id, bundle.offer_title, bundle.discount_percent, bundle.quantity, bundle.subtotal, bundle.total_price]
      );
      for (const line of bundle.lines) {
        await db.query(
          `INSERT INTO order_bundle_items (order_bundle_id, variant_id, product_name, shade_name, quantity, price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [bundleResult.insertId, line.variant_id, line.product_name, line.shade_name, bundle.quantity, line.price]
        );
        await db.query('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [bundle.quantity, line.variant_id]);
      }
    }

    await db.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM cart WHERE user_id = ?)', [userId]);
    await db.query('DELETE FROM cart_bundles WHERE cart_id IN (SELECT id FROM cart WHERE user_id = ?)', [userId]);

    res.status(201).json({
      message: 'تم إنشاء الطلب بنجاح',
      order_id: orderId,
      final_price
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, cancel_reason } = req.body;
    if (!isValidOrderStatus(status)) {
      return res.status(400).json({ message: 'حالة غير صالحة' });
    }

    const reason = (cancel_reason || '').trim();
    if (status === 'cancelled' && !reason) {
      return res.status(400).json({ message: 'سبب الإلغاء مطلوب عند إلغاء الطلب' });
    }

    await db.query(
      'UPDATE orders SET status = ?, cancel_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, status === 'cancelled' ? reason : null, req.params.id]
    );
    res.json({ message: 'تم تحديث حالة الطلب بنجاح', status, cancel_reason: status === 'cancelled' ? reason : null });
  } catch (error) {
    console.error('Update order status error:', error);
    const msg = String(error.message || '');
    if (msg.includes('CHECK constraint') || msg.includes('constraint failed')) {
      return res.status(400).json({
        message: 'تعذّر حفظ الحالة — أعد تشغيل الخادم لتطبيق تحديث قاعدة البيانات',
      });
    }
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

const STOCK_RESTORE_STATUSES = new Set([
  'pending', 'preparing_shipping', 'confirmed', 'processing', 'shipped',
]);

async function restoreOrderStock(orderId) {
  const [items] = await db.query(
    'SELECT variant_id, quantity FROM order_items WHERE order_id = ?',
    [orderId]
  );
  for (const item of items) {
    await db.query(
      'UPDATE product_variants SET stock = stock + ? WHERE id = ?',
      [item.quantity, item.variant_id]
    );
  }

  const [bundles] = await db.query(
    'SELECT id, quantity FROM order_bundles WHERE order_id = ?',
    [orderId]
  );
  for (const bundle of bundles) {
    const [lines] = await db.query(
      'SELECT variant_id FROM order_bundle_items WHERE order_bundle_id = ?',
      [bundle.id]
    );
    const qty = parseInt(bundle.quantity, 10) || 1;
    for (const line of lines) {
      await db.query(
        'UPDATE product_variants SET stock = stock + ? WHERE id = ?',
        [qty, line.variant_id]
      );
    }
  }
}

exports.delete = async (req, res) => {
  try {
    const orderId = req.params.id;
    const [orders] = await db.query('SELECT id, status FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    const order = orders[0];
    if (STOCK_RESTORE_STATUSES.has(order.status)) {
      await restoreOrderStock(orderId);
    }

    await db.query('DELETE FROM orders WHERE id = ?', [orderId]);
    res.json({ message: 'تم حذف الطلب بنجاح' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
