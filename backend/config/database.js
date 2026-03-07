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
        stmt.bind(p);
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
