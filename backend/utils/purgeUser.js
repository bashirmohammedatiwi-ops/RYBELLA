const db = require('../config/database');

/**
 * يحرّر الهاتف والبريد ثم يحذف المستخدم وجميع بياناته المرتبطة (CASCADE).
 * تحرير الحقول الفريدة أولاً يضمن إمكانية إعادة التسجيل بنفس الرقم حتى لو فشل الحذف جزئياً.
 */
async function purgeUserById(userId) {
  return db.runBulkWrite(async () => {
    const tombstone = `deleted-${userId}-${Date.now()}`;
    await db.query(
      'UPDATE users SET phone = NULL, email = ? WHERE id = ?',
      [`${tombstone}@deleted.rybella.iq`, userId]
    );

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
    const deleted = result.affectedRows ?? 0;
    if (deleted === 0) {
      const err = new Error('USER_DELETE_FAILED');
      err.code = 'USER_DELETE_FAILED';
      throw err;
    }
    return deleted;
  });
}

module.exports = { purgeUserById };
