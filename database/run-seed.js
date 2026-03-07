/**
 * Run seed data with proper bcrypt password hash for admin
 * Usage: node run-seed.js
 */
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function runSeed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rybella_iraq',
  });

  const adminPassword = await bcrypt.hash('Admin@123', 10);

  const queries = [
    `INSERT IGNORE INTO users (name, email, password, phone, role) VALUES
     ('مدير النظام', 'admin@rybella.iq', ?, '07701234567', 'admin')`,
  ];

  await conn.execute(queries[0], [adminPassword]);

  const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  const statements = seedSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--') && !s.includes('INSERT INTO users'));

  for (const stmt of statements) {
    if (stmt.length > 5) {
      try {
        await conn.query(stmt);
        console.log('Executed:', stmt.substring(0, 50) + '...');
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') console.error(err.message);
      }
    }
  }

  await conn.end();
  console.log('Seed completed. Admin: admin@rybella.iq / Admin@123');
}

runSeed().catch(console.error);
