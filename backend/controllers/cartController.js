const db = require('../config/database');
const { validateBundleLines, formatCartBundleRow } = require('../services/bundleService');

const getOrCreateCart = async (userId) => {
  let [carts] = await db.query('SELECT id FROM cart WHERE user_id = ?', [userId]);
  if (carts.length === 0) {
    const [result] = await db.query('INSERT INTO cart (user_id) VALUES (?)', [userId]);
    return result.insertId;
  }
  return carts[0].id;
};

exports.getCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    const [items] = await db.query(`
      SELECT ci.*, pv.shade_name, pv.color_code, pv.price, pv.stock, pv.image as variant_image,
        p.id as product_id, p.name as product_name, p.main_image as product_image
      FROM cart_items ci
      JOIN product_variants pv ON ci.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE ci.cart_id = ?
    `, [cartId]);

    const [bundleRows] = await db.query('SELECT * FROM cart_bundles WHERE cart_id = ?', [cartId]);
    const bundles = []
    for (const row of bundleRows) {
      bundles.push(await formatCartBundleRow(row))
    }

    res.json({ items, bundles });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { variant_id, quantity } = req.body;
    if (!variant_id || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'معرف المنتج والكمية مطلوبة' });
    }

    const cartId = await getOrCreateCart(req.user.id);
    const [existing] = await db.query('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ?', [cartId, variant_id]);

    if (existing.length > 0) {
      await db.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, existing[0].id]);
    } else {
      await db.query('INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?, ?, ?)', [cartId, variant_id, quantity]);
    }
    res.status(201).json({ message: 'تمت الإضافة إلى السلة' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.addBundle = async (req, res) => {
  try {
    const { offer_id, lines, quantity = 1 } = req.body;
    const qty = parseInt(quantity, 10) || 1
    if (!offer_id || qty < 1) {
      return res.status(400).json({ message: 'معرف العرض والكمية مطلوبة' });
    }

    const validation = await validateBundleLines(offer_id, lines)
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message })
    }

    const cartId = await getOrCreateCart(req.user.id)
    const [existing] = await db.query('SELECT id, quantity FROM cart_bundles WHERE cart_id = ? AND offer_id = ?', [cartId, offer_id])

    let bundleId
    if (existing.length) {
      bundleId = existing[0].id
      await db.query('UPDATE cart_bundles SET quantity = quantity + ? WHERE id = ?', [qty, bundleId])
      await db.query('DELETE FROM cart_bundle_items WHERE cart_bundle_id = ?', [bundleId])
    } else {
      const [result] = await db.query(
        'INSERT INTO cart_bundles (cart_id, offer_id, quantity) VALUES (?, ?, ?)',
        [cartId, offer_id, qty]
      )
      bundleId = result.insertId
    }

    for (const line of validation.lines) {
      await db.query(
        'INSERT INTO cart_bundle_items (cart_bundle_id, variant_id) VALUES (?, ?)',
        [bundleId, line.variant_id]
      )
    }

    res.status(201).json({ message: 'تمت إضافة الباكج إلى السلة' })
  } catch (error) {
    console.error('Add bundle error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const itemId = req.params.itemId;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'الكمية مطلوبة' });
    }

    const cartId = await getOrCreateCart(req.user.id);
    const [result] = await db.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?',
      [quantity, itemId, cartId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'العنصر غير موجود' });
    }
    res.json({ message: 'تم تحديث الكمية' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.updateBundle = async (req, res) => {
  try {
    const { quantity } = req.body;
    const bundleId = req.params.bundleId;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'الكمية مطلوبة' });
    }

    const cartId = await getOrCreateCart(req.user.id);
    const [result] = await db.query(
      'UPDATE cart_bundles SET quantity = ? WHERE id = ? AND cart_id = ?',
      [quantity, bundleId, cartId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'الباكج غير موجود' });
    }
    res.json({ message: 'تم تحديث كمية الباكج' });
  } catch (error) {
    console.error('Update bundle error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    const [result] = await db.query('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [req.params.itemId, cartId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'العنصر غير موجود' });
    }
    res.json({ message: 'تم الحذف من السلة' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.removeBundle = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    const [result] = await db.query('DELETE FROM cart_bundles WHERE id = ? AND cart_id = ?', [req.params.bundleId, cartId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'الباكج غير موجود' });
    }
    res.json({ message: 'تم حذف الباكج من السلة' });
  } catch (error) {
    console.error('Remove bundle error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    await db.query('DELETE FROM cart_bundles WHERE cart_id = ?', [cartId]);
    res.json({ message: 'تم تفريغ السلة' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
