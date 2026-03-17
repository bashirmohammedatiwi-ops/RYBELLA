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
  // Migration: banners.background_image (صورة خلفية + صورة PNG فوقها)
  try {
    const bannerInfo = db.exec("PRAGMA table_info(banners)");
    const bannerCols = (bannerInfo[0]?.values || []).map((r) => r[1]);
    if (!bannerCols.includes('background_image')) {
      db.run('ALTER TABLE banners ADD COLUMN background_image TEXT');
      saveDb();
    }
  } catch (e) {}
  // Migration: banners - إضافة subcategory إلى link_type (إصلاح خطأ الحفظ)
  try {
    const ck = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='banners'");
    const sql = ck[0]?.values?.[0]?.[0] || '';
    if (sql && sql.includes("CHECK(link_type IN") && !sql.includes("'subcategory'")) {
      db.exec(`CREATE TABLE banners_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        image TEXT NOT NULL,
        background_image TEXT,
        link_type TEXT DEFAULT 'none',
        link_value TEXT,
        sort_order INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        image_pos_x REAL,
        image_pos_y REAL,
        image_size REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      db.run(`INSERT INTO banners_new SELECT id, title, image, background_image, link_type, link_value, sort_order, active, image_pos_x, image_pos_y, image_size, created_at FROM banners`);
      db.run('DROP TABLE banners');
      db.run('ALTER TABLE banners_new RENAME TO banners');
      saveDb();
    }
  } catch (e) {}
  // Migration: banners - موضع صورة PNG (قابل للسحب)
  try {
    const bannerInfo = db.exec("PRAGMA table_info(banners)");
    const bannerCols = (bannerInfo[0]?.values || []).map((r) => r[1]);
    const posCols = ['image_pos_x', 'image_pos_y', 'image_size'];
    posCols.forEach((col) => {
      if (!bannerCols.includes(col)) {
        db.run(`ALTER TABLE banners ADD COLUMN ${col} REAL`);
        saveDb();
      }
    });
  } catch (e) {}
  // Migration: banners - إضافة subcategory إلى link_type (إصلاح خطأ الحفظ عند ربط بفئة ثانوية)
  try {
    const ck = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='banners'");
    const sql = (ck[0]?.values?.[0]?.[0] || '').toLowerCase();
    if (sql.includes('check(link_type') && !sql.includes("'subcategory'")) {
      db.exec(`CREATE TABLE banners_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        image TEXT NOT NULL,
        background_image TEXT,
        link_type TEXT DEFAULT 'none',
        link_value TEXT,
        sort_order INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        image_pos_x REAL,
        image_pos_y REAL,
        image_size REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      const info = db.exec("PRAGMA table_info(banners)");
      const cols = (info[0]?.values || []).map((r) => r[1]);
      const sel = [
        'id', 'title', 'image',
        cols.includes('background_image') ? 'background_image' : 'NULL',
        'link_type', 'link_value', 'sort_order', 'active',
        cols.includes('image_pos_x') ? 'image_pos_x' : 'NULL',
        cols.includes('image_pos_y') ? 'image_pos_y' : 'NULL',
        cols.includes('image_size') ? 'image_size' : 'NULL',
        'created_at'
      ].join(', ');
      db.run(`INSERT INTO banners_new SELECT ${sel} FROM banners`);
      db.run('DROP TABLE banners');
      db.run('ALTER TABLE banners_new RENAME TO banners');
      saveDb();
    }
  } catch (e) {}
  // Migration: offers table
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image TEXT NOT NULL,
      discount_label TEXT,
      product_ids TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    saveDb();
  } catch (e) {}
  // Migration: offers.discount_percent
  try {
    const offerInfo = db.exec("PRAGMA table_info(offers)");
    const offerCols = (offerInfo[0]?.values || []).map((r) => r[1]);
    if (!offerCols.includes('discount_percent')) {
      db.run('ALTER TABLE offers ADD COLUMN discount_percent REAL DEFAULT 0');
      saveDb();
    }
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
  // Migration: categories icon + overlay_text (أيقونة ونص فوق الصورة)
  try {
    const catInfo = db.exec("PRAGMA table_info(categories)");
    const catCols = (catInfo[0]?.values || []).map((r) => r[1]);
    if (!catCols.includes('icon')) {
      db.run('ALTER TABLE categories ADD COLUMN icon TEXT');
      saveDb();
    }
    if (!catCols.includes('overlay_text')) {
      db.run('ALTER TABLE categories ADD COLUMN overlay_text TEXT');
      saveDb();
    }
  } catch (e) {}
  // Migration: story_groups + story_slides (اليوميات - صورة الناشر + صور متعددة)
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS story_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      avatar TEXT,
      publisher_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS story_slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_group_id INTEGER NOT NULL,
      image TEXT NOT NULL,
      link_type TEXT DEFAULT 'none',
      link_value TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (story_group_id) REFERENCES story_groups(id) ON DELETE CASCADE
    )`);
    const hasOldStories = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='stories'");
    if (hasOldStories.length && hasOldStories[0].values.length) {
      const oldRows = db.exec("SELECT id, image, link_type, link_value, created_at FROM stories");
      if (oldRows.length && oldRows[0].values.length) {
        const cols = oldRows[0].columns || ['id','image','link_type','link_value','created_at'];
        const rows = oldRows[0].values;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const r = {};
          for (let j = 0; j < cols.length; j++) r[cols[j]] = row[j];
          db.run('INSERT INTO story_groups (id, created_at) VALUES (?, ?)', [r.id, r.created_at || null]);
          db.run('INSERT INTO story_slides (story_group_id, image, link_type, link_value, sort_order) VALUES (?, ?, ?, ?, 0)', [r.id, r.image, r.link_type || 'none', r.link_value || null]);
        }
      }
      db.run('DROP TABLE stories');
    }
    saveDb();
  } catch (e) {}
  // Migration: story_slides - إضافة media_type و thumbnail (صورة أو فيديو)
  try {
    const slideInfo = db.exec("PRAGMA table_info(story_slides)");
    const slideCols = (slideInfo[0]?.values || []).map((r) => r[1]);
    if (!slideCols.includes('media_type')) {
      db.run('ALTER TABLE story_slides ADD COLUMN media_type TEXT DEFAULT \'image\'');
      saveDb();
    }
    if (!slideCols.includes('thumbnail')) {
      db.run('ALTER TABLE story_slides ADD COLUMN thumbnail TEXT');
      saveDb();
    }
  } catch (e) {}
  // Migration: story_groups - إضافة avatar و publisher_name (صورة الناشر)
  try {
    const sgInfo = db.exec("PRAGMA table_info(story_groups)");
    const sgCols = (sgInfo[0]?.values || []).map((r) => r[1]);
    if (!sgCols.includes('avatar')) {
      db.run('ALTER TABLE story_groups ADD COLUMN avatar TEXT');
      saveDb();
    }
    if (!sgCols.includes('publisher_name')) {
      db.run('ALTER TABLE story_groups ADD COLUMN publisher_name TEXT');
      saveDb();
    }
    if (!sgCols.includes('duration_seconds')) {
      db.run('ALTER TABLE story_groups ADD COLUMN duration_seconds INTEGER DEFAULT 5');
      saveDb();
    }
  } catch (e) {}
  // Migration: web_settings (إعدادات الموقع الإلكتروني)
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS web_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    saveDb();
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
