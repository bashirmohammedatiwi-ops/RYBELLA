/**
 * Setup database - creates database, tables, and admin user
 * Usage: node scripts/setup-db.js (from backend folder)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function setup() {
  console.log('Connecting to MySQL...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Creating database and tables...');
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await conn.query(schema);

  console.log('Adding admin user...');
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  await conn.execute(
    `INSERT IGNORE INTO rybella_iraq.users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)`,
    ['مدير النظام', 'admin@rybella.iq', adminPassword, '07701234567', 'admin']
  );

  console.log('Adding seed data...');
  const seedPath = path.join(__dirname, '../../database/seed.sql');
  const seed = fs.readFileSync(seedPath, 'utf8');
  const statements = seed
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--') && !s.toLowerCase().includes('insert into users'));
  for (const stmt of statements) {
    if (stmt.length > 10) {
      try {
        await conn.query(stmt);
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') console.warn('Warning:', e.message);
      }
    }
  }

  await conn.end();
  console.log('\nتم الإعداد بنجاح!');
  console.log('Admin: admin@rybella.iq / Admin@123');
}

setup().catch((err) => {
  console.error('Error:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.error('\nMySQL غير مشغّل. تأكد من تشغيل XAMPP وخدمة MySQL.');
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('\nخطأ في الاتصال. تحقق من DB_USER و DB_PASSWORD في ملف .env');
  }
  process.exit(1);
});
