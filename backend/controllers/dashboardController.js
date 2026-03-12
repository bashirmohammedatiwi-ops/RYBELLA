const db = require('../config/database');

exports.getStats = async (req, res) => {
  try {
    const [totalSales] = await db.query(`
      SELECT COALESCE(SUM(final_price), 0) as total
      FROM orders
      WHERE status != 'cancelled'
    `);
    const [totalOrders] = await db.query(`
      SELECT COUNT(*) as total FROM orders WHERE status != 'cancelled'
    `);
    const [totalCustomers] = await db.query(`
      SELECT COUNT(*) as total FROM users WHERE role = 'customer'
    `);
    const [lowStock] = await db.query(`
      SELECT pv.*, p.name as product_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.stock <= 5 AND pv.stock > 0
      ORDER BY pv.stock ASC
    `);
    const [topSelling] = await db.query(`
      SELECT pv.id, pv.shade_name, p.name as product_name, SUM(oi.quantity) as total_sold
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY pv.id
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    res.json({
      total_sales: parseFloat(totalSales[0]?.total ?? 0),
      total_orders: totalOrders[0]?.total ?? 0,
      total_customers: totalCustomers[0]?.total ?? 0,
      low_stock_count: (lowStock || []).length,
      low_stock_products: lowStock || [],
      top_selling_products: topSelling || []
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pv.*, p.name as product_name
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
      SELECT pv.id as variant_id, pv.shade_name, p.name as product_name, SUM(oi.quantity) as total_quantity
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY pv.id
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
      `SELECT date(created_at) as date, COUNT(*) as orders_count, COALESCE(SUM(final_price), 0) as sales
       FROM orders
       WHERE status != 'cancelled' AND created_at >= date('now', '-' || ? || ' days')
       GROUP BY date(created_at)
       ORDER BY date ASC`,
      [String(days)]
    );
    res.json(rows || []);
  } catch (error) {
    console.error('Get sales chart error:', error);
    res.json([]);
  }
};
