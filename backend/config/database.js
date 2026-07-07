/**
 * PostgreSQL — طبقة قاعدة البيانات للإنتاج
 * واجهة متوافقة مع mysql2/sql.js: query(sql, [params]) → [rows] | [{ insertId, affectedRows }]
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;
let schemaReady = false;

function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is required (PostgreSQL). See deployment/.env.example');
    }
    const webConcurrency = Math.max(1, parseInt(process.env.WEB_CONCURRENCY || '1', 10));
    const poolCap = parseInt(process.env.PG_POOL_MAX || '50', 10);
    const maxConnections = Math.max(5, Math.floor(poolCap / webConcurrency));
    pool = new Pool({
      connectionString: url,
      max: maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });
    pool.on('error', (err) => {
      console.error('[pg] idle client error:', err.message);
    });
  }
  return pool;
}

function toPgSql(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function normalizeParams(params) {
  if (Array.isArray(params)) return params;
  if (params && typeof params === 'object') return Object.values(params);
  return [];
}

async function ensureSchema() {
  if (schemaReady) return;
  const schemaPath = path.join(__dirname, '../database/schema.postgresql.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await getPool().query(sql);
  await runMigrations();
  schemaReady = true;
  console.log('[pg] schema ready');
}

async function runMigrations() {
  const migrations = [
    'ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS sync_price NUMERIC(12, 2)',
    'ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS sync_original_price NUMERIC(12, 2)',
    'ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS sync_discount_percent NUMERIC(8, 2) DEFAULT 0',
    'ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS manual_discount_percent NUMERIC(8, 2)',
    'ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS manual_discount_until TIMESTAMPTZ',
    'ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS app TEXT DEFAULT \'customer\'',
    `DO $$ BEGIN
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'customer', 'staff'));
    EXCEPTION WHEN others THEN NULL;
    END $$`,
  ];
  for (const sql of migrations) {
    await getPool().query(sql);
  }
  await getPool().query(`
    UPDATE product_variants
    SET
      sync_price = COALESCE(sync_price, price),
      sync_original_price = COALESCE(sync_original_price, NULLIF(original_price, 0), price),
      sync_discount_percent = COALESCE(sync_discount_percent, discount_percent, 0)
    WHERE sync_price IS NULL OR sync_original_price IS NULL OR sync_discount_percent IS NULL
  `);
}

async function ensureDevAdmin() {
  if (process.env.NODE_ENV === 'production') return;
  const [rows] = await query('SELECT id FROM users WHERE email = ? LIMIT 1', ['admin@rybella.iq']);
  if (rows.length) return;
  const bcrypt = require('bcrypt');
  const adminPass = bcrypt.hashSync('Admin@123', 10);
  await query(
    'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
    ['مدير النظام', 'admin@rybella.iq', adminPass, '07701234567', 'admin']
  );
  console.log('[pg] dev admin created: admin@rybella.iq / Admin@123');
}

async function query(sql, params = []) {
  await ensureSchema();
  const values = normalizeParams(params);
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();
  const isSelect = upper.startsWith('SELECT') || upper.startsWith('WITH');
  const isPragma = upper.startsWith('PRAGMA');
  if (isPragma) return [[]];

  let pgSql = toPgSql(trimmed);
  const isInsert = upper.startsWith('INSERT') && !upper.includes('RETURNING');
  if (isInsert) {
    pgSql = `${pgSql.replace(/;\s*$/, '')} RETURNING id`;
  }

  const result = await getPool().query(pgSql, values);
  if (isSelect) return [result.rows];
  const insertId = result.rows[0]?.id != null ? Number(result.rows[0].id) : 0;
  return [{ insertId, affectedRows: result.rowCount ?? 0 }];
}

async function runBulkWrite(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn();
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function flushDb() {
  /* no-op — PostgreSQL يحفظ تلقائياً */
}

async function checkIntegrity() {
  await ensureSchema();
  await getPool().query('SELECT 1');
  return true;
}

async function init() {
  await ensureSchema();
  await ensureDevAdmin();
}

function getDbPath() {
  return process.env.DATABASE_URL || '';
}

module.exports = {
  query,
  flushDb,
  runBulkWrite,
  checkIntegrity,
  getDbPath,
  getPool,
  init,
};
