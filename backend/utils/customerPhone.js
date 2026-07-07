const db = require('../config/database');
const { normalizeIraqiPhone } = require('./phone');
const { purgeUserById } = require('./purgeUser');

function phonePlaceholderEmail(phone) {
  return `${phone}@phone.rybella.iq`;
}

/**
 * حسابات عميل تحجز رقم هاتف أو بريد التسجيل الافتراضي.
 */
async function findCustomerPhoneBlockers(normalizedPhone) {
  const placeholder = phonePlaceholderEmail(normalizedPhone);
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
            (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS order_count
     FROM users u
     WHERE u.role = 'customer'
       AND (
         u.phone = ?
         OR u.email = ?
         OR (u.phone IS NULL AND u.email = ?)
       )`,
    [normalizedPhone, placeholder, placeholder]
  );
  return rows;
}

/**
 * يحذف حسابات العملاء المحجوزة لرقم معيّن.
 * @param {object} opts
 * @param {boolean} opts.force — إن true يحذف حتى مع وجود طلبات (من لوحة التحكم)
 */
async function releaseCustomerPhone(normalizedPhone, { force = false } = {}) {
  const blockers = await findCustomerPhoneBlockers(normalizedPhone);
  if (!blockers.length) {
    return { released: 0, blockers: [] };
  }

  const withOrders = blockers.filter((b) => b.order_count > 0);
  if (!force && withOrders.length > 0) {
    const err = new Error('CUSTOMER_HAS_ORDERS');
    err.code = 'CUSTOMER_HAS_ORDERS';
    err.blockers = blockers;
    throw err;
  }

  for (const row of blockers) {
    await purgeUserById(row.id);
  }
  return { released: blockers.length, blockers };
}

async function lookupByPhone(rawPhone) {
  const normalizedPhone = normalizeIraqiPhone(rawPhone);
  if (!normalizedPhone) return { normalizedPhone: '', users: [] };

  const placeholder = phonePlaceholderEmail(normalizedPhone);
  const [users] = await db.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
            (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS order_count
     FROM users u
     WHERE u.phone = ?
        OR u.email = ?
        OR u.email = ?`,
    [normalizedPhone, placeholder, `${normalizedPhone}@staff.rybella.iq`]
  );
  return { normalizedPhone, users };
}

/**
 * قبل التسجيل: إزالة حسابات عميل يتيمة (بدون طلبات) تحجز الرقم.
 */
async function clearOrphanCustomerBlockers(normalizedPhone) {
  const blockers = await findCustomerPhoneBlockers(normalizedPhone);
  const orphans = blockers.filter((b) => b.order_count === 0);
  for (const row of orphans) {
    await purgeUserById(row.id);
  }
  return orphans.length;
}

module.exports = {
  phonePlaceholderEmail,
  findCustomerPhoneBlockers,
  releaseCustomerPhone,
  lookupByPhone,
  clearOrphanCustomerBlockers,
};
