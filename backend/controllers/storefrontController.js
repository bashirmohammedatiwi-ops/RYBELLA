const db = require('../config/database');
const webSettingsController = require('./webSettingsController');
const { resolveLinkUrl } = require('./bannerController');
const { attachProductListData } = require('./productController');

const PRODUCT_SELECT = `
  SELECT p.*, b.name as brand_name, c.name as category_name, s.name as subcategory_name,
    (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.stock > 0) as available_variants,
    (SELECT MIN(price) FROM product_variants WHERE product_id = p.id) as min_price,
    (SELECT MAX(price) FROM product_variants WHERE product_id = p.id) as max_price
  FROM products p
  LEFT JOIN brands b ON p.brand_id = b.id
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN subcategories s ON p.subcategory_id = s.id
  WHERE COALESCE(p.status, 'published') = 'published'
`;

async function fetchLiteProducts(extraWhere, params, orderBy, limit) {
  const query = `${PRODUCT_SELECT} ${extraWhere} ORDER BY ${orderBy} LIMIT ?`;
  const [rows] = await db.query(query, [...params, limit]);
  return attachProductListData(rows, { lite: true });
}

async function getSettings() {
  return new Promise((resolve, reject) => {
    const res = {
      json: (data) => resolve(data),
      status: () => ({ json: (data) => resolve(data) }),
    };
    webSettingsController.get({}, res).catch(reject);
  });
}

async function getBanners() {
  const [rows] = await db.query(
    'SELECT * FROM banners WHERE active IS TRUE ORDER BY sort_order ASC, id ASC'
  );
  for (const b of rows) {
    if (b.link_type && b.link_value) {
      b.link_url = await resolveLinkUrl(b.link_type, b.link_value);
    } else {
      b.link_url = null;
    }
  }
  return rows;
}

exports.getHome = async (req, res) => {
  try {
    const [
      categories,
      banners,
      settings,
      offers,
      featured,
      bestSellers,
      newest,
    ] = await Promise.all([
      db.query('SELECT * FROM categories ORDER BY COALESCE(sort_order, 999), name').then(([r]) => r),
      getBanners(),
      getSettings(),
      db.query('SELECT * FROM offers WHERE active IS TRUE ORDER BY sort_order ASC, id ASC').then(([r]) => r),
      fetchLiteProducts('AND p.is_featured IS TRUE', [], 'p.sort_order ASC, p.name ASC', 10),
      fetchLiteProducts('AND p.is_best_seller IS TRUE', [], 'p.sort_order ASC, p.name ASC', 10),
      fetchLiteProducts('', [], 'p.created_at DESC', 12),
    ]);

    res.json({
      categories,
      banners,
      settings,
      offers,
      featured,
      best_sellers: bestSellers,
      newest,
    });
  } catch (error) {
    console.error('Storefront home error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
