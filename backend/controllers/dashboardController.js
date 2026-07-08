const db = require('../config/database');

exports.getStats = async (req, res) => {
  try {
    const [totalSales] = await db.query(`
      SELECT COALESCE(SUM(final_price), 0) AS total
      FROM orders
      WHERE status != 'cancelled'
    `);
    const [totalOrders] = await db.query(`
      SELECT COUNT(*)::int AS total FROM orders WHERE status != 'cancelled'
    `);
    const [ordersThisMonth] = await db.query(`
      SELECT COUNT(*)::int AS total
      FROM orders
      WHERE status != 'cancelled'
        AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    `);
    const [totalCustomers] = await db.query(`
      SELECT COUNT(*)::int AS total
      FROM users
      WHERE role = 'customer' AND deleted_at IS NULL
    `);
    const [lowStock] = await db.query(`
      SELECT pv.*, p.name AS product_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.stock <= 5 AND pv.stock > 0
      ORDER BY pv.stock ASC
    `);
    const [topSelling] = await db.query(`
      SELECT pv.id, pv.shade_name, p.name AS product_name, SUM(oi.quantity)::int AS total_sold
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY pv.id, pv.shade_name, p.name
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    res.json({
      total_sales: parseFloat(totalSales[0]?.total ?? 0),
      total_orders: totalOrders[0]?.total ?? 0,
      orders_this_month: ordersThisMonth[0]?.total ?? 0,
      total_customers: totalCustomers[0]?.total ?? 0,
      low_stock_count: (lowStock || []).length,
      low_stock_products: lowStock || [],
      top_selling_products: topSelling || [],
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pv.*, p.name AS product_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.stock <= 5 AND pv.stock > 0
      ORDER BY pv.stock ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getTopProducts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pv.id AS variant_id, pv.shade_name, p.name AS product_name, SUM(oi.quantity)::int AS total_quantity
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY pv.id, pv.shade_name, p.name
      ORDER BY total_quantity DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getSalesChart = async (req, res) => {
  try {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 14));
    const [rows] = await db.query(
      `SELECT DATE(created_at) AS date,
              COUNT(*)::int AS orders_count,
              COALESCE(SUM(final_price), 0) AS sales
       FROM orders
       WHERE status != 'cancelled'
         AND created_at >= CURRENT_TIMESTAMP - ($1::int * INTERVAL '1 day')
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [days]
    );
    res.json(rows || []);
  } catch (error) {
    console.error('Get sales chart error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
