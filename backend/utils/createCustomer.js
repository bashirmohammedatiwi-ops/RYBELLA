const db = require('../config/database');
const bcrypt = require('bcrypt');
const { normalizeIraqiPhone, isValidIraqiPhone } = require('./phone');
const { phonePlaceholderEmail } = require('./customerAccount');

/**
 * إنشاء حساب عميل جديد (تسجيل ذاتي أو من موظف/مدير).
 */
async function createCustomerAccount({ name, email, password, phone }) {
  if (!name?.trim() || !password) {
    const err = new Error('NAME_PASSWORD_REQUIRED');
    err.code = 'NAME_PASSWORD_REQUIRED';
    throw err;
  }

  const normalizedPhone = phone ? normalizeIraqiPhone(phone) : null;
  const trimmedEmail = email?.trim() || null;

  if (normalizedPhone) {
    if (!isValidIraqiPhone(normalizedPhone)) {
      const err = new Error('INVALID_PHONE');
      err.code = 'INVALID_PHONE';
      throw err;
    }

    const [existingPhone] = await db.query(
      `SELECT id FROM users
       WHERE phone = ? AND role = 'customer' AND deleted_at IS NULL`,
      [normalizedPhone]
    );
    if (existingPhone.length > 0) {
      const err = new Error('PHONE_IN_USE');
      err.code = 'PHONE_IN_USE';
      throw err;
    }
  }

  if (!normalizedPhone && !trimmedEmail) {
    const err = new Error('PHONE_REQUIRED');
    err.code = 'PHONE_REQUIRED';
    throw err;
  }

  const userEmail = trimmedEmail || phonePlaceholderEmail(normalizedPhone);

  const [existingUser] = await db.query(
    `SELECT id FROM users WHERE email = ? AND role = 'customer' AND deleted_at IS NULL`,
    [userEmail]
  );
  if (existingUser.length > 0) {
    const err = new Error(normalizedPhone ? 'PHONE_IN_USE' : 'EMAIL_IN_USE');
    err.code = normalizedPhone ? 'PHONE_IN_USE' : 'EMAIL_IN_USE';
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), userEmail, hashedPassword, normalizedPhone, 'customer']
    );

    return {
      id: result.insertId,
      name: name.trim(),
      email: trimmedEmail || userEmail,
      phone: normalizedPhone,
      role: 'customer',
    };
  } catch (error) {
    if (error.code === '23505') {
      const err = new Error('PHONE_IN_USE');
      err.code = 'PHONE_IN_USE';
      throw err;
    }
    throw error;
  }
}

function mapCreateError(err) {
  const messages = {
    NAME_PASSWORD_REQUIRED: 'الاسم وكلمة المرور مطلوبة',
    INVALID_PHONE: 'رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 11 رقم',
    PHONE_REQUIRED: 'رقم الهاتف مطلوب',
    PHONE_IN_USE: 'رقم الهاتف مستخدم بالفعل لحساب عميل',
    EMAIL_IN_USE: 'البريد الإلكتروني مستخدم بالفعل',
  };
  return messages[err.code] || 'حدث خطأ في الخادم';
}

module.exports = { createCustomerAccount, mapCreateError };
