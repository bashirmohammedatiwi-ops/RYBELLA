const db = require('../config/database');
const { normalizeOrderStatus } = require('../utils/orderStatus');
const { getFreeShippingThreshold, computeDeliveryFee } = require('../utils/delivery');
const { ORDER_STATUSES, isValidOrderStatus } = require('../utils/orderStatus');
const { validateBundleLines } = require('../services/bundleService');
const { normalizeIraqiPhone, isValidIraqiPhone } = require('../utils/phone');
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
    const forCustomer = req.user.role !== 'admin' && req.user.role !== 'staff';
    order.status = normalizeOrderStatus(order.status, { forCustomer });
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && order.user_id !== req.user.id) {
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
    const isStaff = req.user.role === 'admin' || req.user.role === 'staff';
    let query = `
      SELECT o.*, u.name as customer_name, u.phone as customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
    `;
    const params = [];
    if (!isStaff) {
      query += ' WHERE o.user_id = ?';
      params.push(req.user.id);
    }
    query += ' ORDER BY o.created_at DESC';
    const [orders] = await db.query(query, params);

    for (const order of orders) {
      order.status = normalizeOrderStatus(order.status, { forCustomer: !isStaff });
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
        "SELECT discount_percent FROM coupons WHERE code = ? AND active IS TRUE AND expiration_date > CURRENT_DATE",
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

    try {
      const { sendStaffNewOrderPush } = require('../services/pushService');
      await sendStaffNewOrderPush(orderId, final_price);
    } catch (pushErr) {
      console.error('Staff new order push error:', pushErr.message);
    }

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

const STOCK_RESTORE_STATUSES = new Set([
  'pending', 'preparing_shipping', 'ready_to_ship', 'shipped',
  'confirmed', 'processing',
]);

async function recalculateOrderTotals(orderId, city) {
  const [items] = await db.query(
    'SELECT quantity, price FROM order_items WHERE order_id = ?',
    [orderId]
  );
  const [bundles] = await db.query(
    'SELECT subtotal, total_price FROM order_bundles WHERE order_id = ?',
    [orderId]
  );
  const [orders] = await db.query('SELECT coupon_code FROM orders WHERE id = ?', [orderId]);
  const couponCode = orders[0]?.coupon_code;

  const itemsSubtotal = items.reduce(
    (sum, row) => sum + (Number(row.price) || 0) * (Number(row.quantity) || 0),
    0
  );
  const bundlesSubtotal = bundles.reduce((sum, row) => sum + (Number(row.subtotal) || 0), 0);
  const bundlesDiscount = bundles.reduce(
    (sum, row) => sum + ((Number(row.subtotal) || 0) - (Number(row.total_price) || 0)),
    0
  );

  let total_price = itemsSubtotal + bundlesSubtotal;
  let discount = bundlesDiscount;

  if (couponCode) {
    const [coupon] = await db.query(
      "SELECT discount_percent FROM coupons WHERE code = ? AND active IS TRUE AND expiration_date > CURRENT_DATE",
      [couponCode]
    );
    if (coupon.length > 0) {
      discount += roundSalePrice(itemsSubtotal * (coupon[0].discount_percent / 100));
    }
  }

  const [zone] = await db.query('SELECT delivery_fee FROM delivery_zones WHERE city = ?', [city]);
  const zoneFee = zone.length > 0 ? parseFloat(zone[0].delivery_fee) : 5000;
  const freeShippingThreshold = await getFreeShippingThreshold(db);
  const delivery_fee = computeDeliveryFee(total_price, zoneFee, freeShippingThreshold);
  const final_price = roundSalePrice(total_price + delivery_fee - discount);

  return { total_price, discount, delivery_fee, final_price };
}

async function applyOrderItemUpdates(orderId, itemUpdates) {
  if (!Array.isArray(itemUpdates) || itemUpdates.length === 0) {
    return { ok: true };
  }

  for (const upd of itemUpdates) {
    const itemId = parseInt(upd.id, 10);
    const newQty = parseInt(upd.quantity, 10);
    if (!itemId || Number.isNaN(newQty) || newQty < 0) {
      return { ok: false, message: 'بيانات المنتجات غير صالحة' };
    }

    const [rows] = await db.query(
      'SELECT oi.*, p.name AS product_name FROM order_items oi JOIN product_variants pv ON pv.id = oi.variant_id JOIN products p ON p.id = pv.product_id WHERE oi.id = ? AND oi.order_id = ?',
      [itemId, orderId]
    );
    if (!rows.length) {
      return { ok: false, message: 'عنصر غير موجود في الطلب' };
    }

    const item = rows[0];
    const oldQty = Number(item.quantity) || 0;
    if (newQty === oldQty) continue;

    if (newQty === 0) {
      await db.query('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [oldQty, item.variant_id]);
      await db.query('DELETE FROM order_items WHERE id = ?', [itemId]);
      continue;
    }

    const delta = newQty - oldQty;
    if (delta > 0) {
      const [variant] = await db.query('SELECT stock FROM product_variants WHERE id = ?', [item.variant_id]);
      if (!variant.length || variant[0].stock < delta) {
        return { ok: false, message: `الكمية غير متوفرة: ${item.product_name}` };
      }
      await db.query('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [delta, item.variant_id]);
    } else {
      await db.query('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [-delta, item.variant_id]);
    }
    await db.query('UPDATE order_items SET quantity = ? WHERE id = ?', [newQty, itemId]);
  }

  return { ok: true };
}

async function applyOrderBundleUpdates(orderId, bundleUpdates) {
  if (!Array.isArray(bundleUpdates) || bundleUpdates.length === 0) {
    return { ok: true };
  }

  for (const upd of bundleUpdates) {
    const bundleId = parseInt(upd.id, 10);
    const newQty = parseInt(upd.quantity, 10);
    if (!bundleId || Number.isNaN(newQty) || newQty < 0) {
      return { ok: false, message: 'بيانات الباكجات غير صالحة' };
    }

    const [rows] = await db.query(
      'SELECT * FROM order_bundles WHERE id = ? AND order_id = ?',
      [bundleId, orderId]
    );
    if (!rows.length) {
      return { ok: false, message: 'باكج غير موجود في الطلب' };
    }

    const bundle = rows[0];
    const oldQty = Number(bundle.quantity) || 1;
    if (newQty === oldQty) continue;

    const [lines] = await db.query(
      'SELECT variant_id FROM order_bundle_items WHERE order_bundle_id = ?',
      [bundleId]
    );

    if (newQty === 0) {
      for (const line of lines) {
        await db.query('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [oldQty, line.variant_id]);
      }
      await db.query('DELETE FROM order_bundles WHERE id = ?', [bundleId]);
      continue;
    }

    const delta = newQty - oldQty;
    if (delta > 0) {
      for (const line of lines) {
        const [variant] = await db.query('SELECT stock FROM product_variants WHERE id = ?', [line.variant_id]);
        if (!variant.length || variant[0].stock < delta) {
          return { ok: false, message: `الكمية غير متوفرة لباكج: ${bundle.offer_title}` };
        }
      }
      for (const line of lines) {
        await db.query('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [delta, line.variant_id]);
      }
    } else {
      for (const line of lines) {
        await db.query('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [-delta, line.variant_id]);
      }
    }

    const unitSubtotal = (Number(bundle.subtotal) || 0) / oldQty;
    const unitTotal = (Number(bundle.total_price) || 0) / oldQty;
    await db.query(
      'UPDATE order_bundles SET quantity = ?, subtotal = ?, total_price = ? WHERE id = ?',
      [newQty, roundSalePrice(unitSubtotal * newQty), roundSalePrice(unitTotal * newQty), bundleId]
    );
    await db.query('UPDATE order_bundle_items SET quantity = ? WHERE order_bundle_id = ?', [newQty, bundleId]);
  }

  return { ok: true };
}

async function assertOrderHasLines(orderId) {
  const [itemRows] = await db.query('SELECT COUNT(*)::int AS count FROM order_items WHERE order_id = ?', [orderId]);
  const [bundleRows] = await db.query('SELECT COUNT(*)::int AS count FROM order_bundles WHERE order_id = ?', [orderId]);
  const count = (itemRows[0]?.count || 0) + (bundleRows[0]?.count || 0);
  if (count < 1) {
    return { ok: false, message: 'يجب أن يحتوي الطلب على منتج واحد على الأقل' };
  }
  return { ok: true };
}

exports.updateByCustomer = async (req, res) => {
  try {
    const orderId = req.params.id;
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    const order = orders[0];
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && order.user_id !== req.user.id) {
      return res.status(403).json({ message: 'غير مصرح' });
    }

    const status = normalizeOrderStatus(order.status);
    if (status !== 'pending') {
      return res.status(400).json({ message: 'يمكن تعديل الطلب فقط عندما تكون حالته قيد الانتظار' });
    }

    const { address, city, phone, notes, items, bundles } = req.body;
    const newAddress = (address != null ? String(address) : order.address).trim();
    const newCity = (city != null ? String(city) : order.city).trim();
    const newNotes = notes != null ? String(notes).trim() : (order.notes || '');
    const newPhone = phone != null ? normalizeIraqiPhone(phone) : (order.phone || '');

    if (!newAddress) {
      return res.status(400).json({ message: 'العنوان مطلوب' });
    }
    if (!newCity) {
      return res.status(400).json({ message: 'المحافظة مطلوبة' });
    }
    if (phone != null && !isValidIraqiPhone(newPhone)) {
      return res.status(400).json({ message: 'رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 11 رقم' });
    }

    if (items != null) {
      const itemResult = await applyOrderItemUpdates(orderId, items);
      if (!itemResult.ok) {
        return res.status(400).json({ message: itemResult.message });
      }
    }

    if (bundles != null) {
      const bundleResult = await applyOrderBundleUpdates(orderId, bundles);
      if (!bundleResult.ok) {
        return res.status(400).json({ message: bundleResult.message });
      }
    }

    if (items != null || bundles != null) {
      const lineCheck = await assertOrderHasLines(orderId);
      if (!lineCheck.ok) {
        return res.status(400).json({ message: lineCheck.message });
      }
    }

    const [zone] = await db.query('SELECT delivery_fee FROM delivery_zones WHERE city = ?', [newCity]);
    if (zone.length === 0) {
      return res.status(400).json({ message: 'المحافظة غير متاحة للتوصيل' });
    }

    const zoneFee = parseFloat(zone[0].delivery_fee) || 5000;
    const totals = await recalculateOrderTotals(orderId, newCity);
    const { total_price, discount, delivery_fee, final_price } = totals;

    await db.query(
      `UPDATE orders
       SET address = ?, city = ?, phone = ?, notes = ?, total_price = ?, discount = ?, delivery_fee = ?, final_price = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newAddress, newCity, newPhone || null, newNotes || null, total_price, discount, delivery_fee, final_price, orderId]
    );

    const [updated] = await db.query(`
      SELECT o.*, u.name as customer_name, u.phone as customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);
    const result = updated[0];
    result.status = normalizeOrderStatus(result.status, {
      forCustomer: req.user.role !== 'admin' && req.user.role !== 'staff',
    });
    const [items] = await db.query(ORDER_ITEMS_SELECT, [orderId]);
    result.items = items;
    await attachOrderBundles(result);

    res.json({ message: 'تم تحديث الطلب بنجاح', order: result });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

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
