const db = require('../config/database');

function phonePlaceholderEmail(phone) {
  return `${phone}@phone.rybella.iq`;
}

/**
 * أرشفة عميل: إخفاء من القائمة + تحرير رقم الهاتف فوراً للتسجيل من جديد.
 * الطلبات السابقة تبقى مرتبطة بالحساب.
 */
async function softDeleteCustomer(userId) {
  const tombstone = `deleted-${userId}-${Date.now()}@deleted.rybella.iq`;
  const [result] = await db.query(
    `UPDATE users
     SET deleted_at = CURRENT_TIMESTAMP,
         phone = NULL,
         email = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [tombstone, userId]
  );
  const updated = result.affectedRows ?? 0;
  if (updated === 0) {
    const [rows] = await db.query('SELECT id, deleted_at FROM users WHERE id = ?', [userId]);
    if (!rows.length) {
      const err = new Error('USER_NOT_FOUND');
      err.code = 'USER_NOT_FOUND';
      throw err;
    }
    if (rows[0].deleted_at) {
      await db.query('UPDATE users SET phone = NULL WHERE id = ?', [userId]);
      return 0;
    }
    const err = new Error('USER_DELETE_FAILED');
    err.code = 'USER_DELETE_FAILED';
    throw err;
  }
  return updated;
}

/** شرط SQL: حساب نشط (غير محذوف وغير معطّل) */
const ACTIVE_USER = 'deleted_at IS NULL AND COALESCE(is_disabled, FALSE) = FALSE';

function isActiveUserWhere(alias = '') {
  const prefix = alias ? `${alias}.` : '';
  return `${prefix}deleted_at IS NULL AND COALESCE(${prefix}is_disabled, FALSE) = FALSE`;
}

async function setCustomerDisabled(userId, disabled) {
  const [users] = await db.query(
    'SELECT id, role, deleted_at FROM users WHERE id = ?',
    [userId]
  );
  if (!users.length || users[0].deleted_at) {
    const err = new Error('USER_NOT_FOUND');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  if (users[0].role !== 'customer') {
    const err = new Error('NOT_CUSTOMER');
    err.code = 'NOT_CUSTOMER';
    throw err;
  }
  await db.query('UPDATE users SET is_disabled = ? WHERE id = ?', [!!disabled, userId]);
  return !disabled;
}

module.exports = {
  softDeleteCustomer,
  setCustomerDisabled,
  ACTIVE_USER,
  isActiveUserWhere,
  phonePlaceholderEmail,
};
