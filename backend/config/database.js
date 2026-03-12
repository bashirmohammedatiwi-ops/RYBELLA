/**
 * SQLite Database (sql.js) - Compatible with mysql2 query interface
 * Pure JavaScript - no native build required
 */
require('dotenv').config();
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const dbPath = process.env.DB_PATH || path.join(dbDir, 'rybella.db');

let db = null;
let SQL = null;

const saveDb = () => {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
};

const initDb = async () => {
  if (db) return;
  SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  // Run schema if empty
  const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
  if (!tableCheck.length || !tableCheck[0].values.length) {
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    const bcrypt = require('bcrypt');
    const adminPass = bcrypt.hashSync('Admin@123', 10);
    db.run('INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)', ['مدير النظام', 'admin@rybella.iq', adminPass, '07701234567', 'admin']);
    const seedPath = path.join(__dirname, '../../database/seed.sql');
    if (fs.existsSync(seedPath)) {
      const seed = fs.readFileSync(seedPath, 'utf8');
      seed.split(';').forEach(s => {
        const t = s.trim();
        if (t && !t.startsWith('--') && !t.toLowerCase().includes('insert into users')) {
          try { db.run(t); } catch (e) {}
        }
      });
    }
    saveDb();
    console.log('Database initialized. Admin: admin@rybella.iq / Admin@123');
  } else {
    // إعادة تعيين كلمة مرور المدير عند كل تشغيل (للتطوير المحلي)
    const bcrypt = require('bcrypt');
    const adminPass = bcrypt.hashSync('Admin@123', 10);
    try {
      const check = db.exec("SELECT id FROM users WHERE email = 'admin@rybella.iq'");
      if (check.length && check[0].values.length > 0) {
        db.run('UPDATE users SET password = ?, role = ?, name = ? WHERE email = ?', [adminPass, 'admin', 'مدير النظام', 'admin@rybella.iq']);
        saveDb();
        console.log('Admin password reset. Login: admin@rybella.iq / Admin@123');
      } else {
        db.run('INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)', ['مدير النظام', 'admin@rybella.iq', adminPass, '07701234567', 'admin']);
        saveDb();
        console.log('Admin created. Login: admin@rybella.iq / Admin@123');
      }
    } catch (e) {
      console.error('Admin init:', e.message);
    }
  }
  // Migration: ensure banners table exists
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      image TEXT NOT NULL,
      link_type TEXT DEFAULT 'none',
      link_value TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    saveDb();
  } catch (e) {}
  // Migration: products.barcode (للمنتجات بدون عناصر إضافية)
  try {
    const colCheck = db.exec("PRAGMA table_info(products)");
    const cols = colCheck[0]?.values || [];
    const hasBarcode = cols.some((r) => r[1] === 'barcode');
    if (!hasBarcode) {
      db.run('ALTER TABLE products ADD COLUMN barcode TEXT');
      saveDb();
    }
  } catch (e) {}
  // Migration: product enhancements (status, featured, new_until, SEO, tags)
  try {
    const prodInfo = db.exec("PRAGMA table_info(products)");
    const prodCols = (prodInfo[0]?.values || []).map((r) => r[1]);
    const addCol = (name, def) => {
      if (!prodCols.includes(name)) {
        db.run(`ALTER TABLE products ADD COLUMN ${name} ${def}`);
        saveDb();
      }
    };
    addCol('status', "TEXT DEFAULT 'published'");
    addCol('is_featured', 'INTEGER DEFAULT 0');
    addCol('is_best_seller', 'INTEGER DEFAULT 0');
    addCol('new_until', 'TEXT');
    addCol('meta_title', 'TEXT');
    addCol('meta_description', 'TEXT');
    addCol('tags', 'TEXT');
  } catch (e) {}
  // Migration: sort_order for brands, subcategories, products
  try {
    const addSortOrder = (table) => {
      try {
        const info = db.exec(`PRAGMA table_info(${table})`);
        const cols = (info[0]?.values || []).map((r) => r[1]);
        if (!cols.includes('sort_order')) {
          db.run(`ALTER TABLE ${table} ADD COLUMN sort_order INTEGER DEFAULT 0`);
          saveDb();
        }
      } catch (e) {}
    };
    addSortOrder('brands');
    addSortOrder('categories');
    addSortOrder('subcategories');
    addSortOrder('products');
  } catch (e) {}
  // Migration: subcategories + products.subcategory_id
  try {
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='subcategories'");
    if (!tables.length || !tables[0].values.length) {
      db.exec(`CREATE TABLE IF NOT EXISTS subcategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )`);
      db.exec('CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id)');
      saveDb();
    }
    const prodCols = db.exec("PRAGMA table_info(products)");
    const hasSubcategory = (prodCols[0]?.values || []).some((r) => r[1] === 'subcategory_id');
    if (!hasSubcategory) {
      db.run('ALTER TABLE products ADD COLUMN subcategory_id INTEGER REFERENCES subcategories(id)');
      saveDb();
    }
  } catch (e) {}
};

// Async query - returns [rows] for SELECT, [{ insertId }] for INSERT (mysql2 compatible)
const query = (sql, params = []) => {
  return new Promise(async (resolve, reject) => {
    try {
      await initDb();
      const p = Array.isArray(params) ? params : (params && typeof params === 'object' ? Object.values(params) : []);
      const upper = sql.trim().toUpperCase();
      if (upper.startsWith('SELECT') || upper.startsWith('PRAGMA')) {
        const stmt = db.prepare(sql);
        if (p.length > 0) stmt.bind(p);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        resolve([rows]);
      } else {
        db.run(sql, p);
        const idResult = db.exec("SELECT last_insert_rowid() as id");
        const insertId = idResult.length && idResult[0].values[0] ? idResult[0].values[0][0] : 0;
        saveDb();
        resolve([{ insertId, affectedRows: db.getRowsModified() }]);
      }
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { query };
