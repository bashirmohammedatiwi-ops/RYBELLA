/**
 * Run seed data - creates admin user with bcrypt password
 * Usage: node scripts/seed.js (from backend folder)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function runSeed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rybella_iraq',
  });

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  await conn.execute(
    `INSERT IGNORE INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)`,
    ['مدير النظام', 'admin@rybella.iq', adminPassword, '07701234567', 'admin']
  );

  await conn.end();
  console.log('Seed completed. Admin: admin@rybella.iq / Admin@123');
}

runSeed().catch((err) => {
  console.error('Seed failed:', err.message);
  if (err.code === 'ER_BAD_DB_ERROR') {
    console.error('\nقاعدة البيانات غير موجودة. قم بتشغيل schema.sql أولاً:');
    console.error('mysql -u root -p < database/schema.sql');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('\nMySQL غير مشغّل. تأكد من تشغيل خدمة MySQL.');
  }
  process.exit(1);
});
