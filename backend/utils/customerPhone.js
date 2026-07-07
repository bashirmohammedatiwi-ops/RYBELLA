const db = require('../config/database');
const { normalizeIraqiPhone } = require('./phone');
const { phonePlaceholderEmail } = require('./customerAccount');

/**
 * حسابات عميل نشطة تحجز رقم هاتف أو بريد التسجيل.
 */
async function findActiveCustomerPhoneBlockers(normalizedPhone) {
  const placeholder = phonePlaceholderEmail(normalizedPhone);
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
            (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS order_count
     FROM users u
     WHERE u.role = 'customer'
       AND u.deleted_at IS NULL
       AND (
         u.phone = ?
         OR u.email = ?
       )`,
    [normalizedPhone, placeholder]
  );
  return rows;
}

module.exports = {
  phonePlaceholderEmail,
  findActiveCustomerPhoneBlockers,
};
