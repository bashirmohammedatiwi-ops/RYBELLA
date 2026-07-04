#!/usr/bin/env node
/**
 * نقل البيانات من SQLite (rybella.db) إلى PostgreSQL
 * الاستخدام:
 *   SQLITE_PATH=/app/data/rybella.db DATABASE_URL=postgresql://... node scripts/migrate-sqlite-to-postgres.js
 */
require('dotenv').config();
const initSqlJs = require('sql.js');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, '../database/rybella.db');
const DATABASE_URL = process.env.DATABASE_URL;

const TABLE_ORDER = [
  'users', 'brands', 'categories', 'subcategories', 'products', 'product_variants',
  'product_images', 'delivery_zones', 'coupons', 'notifications', 'offers', 'banners',
  'web_settings', 'inventory_sync_snapshots', 'story_groups', 'story_highlights',
  'story_slides', 'story_highlight_slides', 'reviews', 'review_images',
  'cart', 'cart_items', 'cart_bundles', 'cart_bundle_items',
  'orders', 'order_items', 'order_bundles', 'order_bundle_items',
  'wishlist', 'user_notifications', 'push_tokens',
];

const BOOL_COLUMNS = new Set([
  'is_featured', 'is_best_seller', 'active',
]);

function normalizeValue(col, val) {
  if (val === null || val === undefined) return null;
  if (BOOL_COLUMNS.has(col)) {
    return val === 1 || val === true || val === '1';
  }
  return val;
}

async function main() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  if (!fs.existsSync(SQLITE_PATH)) {
    console.error('SQLite file not found:', SQLITE_PATH);
    process.exit(1);
  }

  console.log('Reading SQLite:', SQLITE_PATH);
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(SQLITE_PATH);
  const sqlite = new SQL.Database(buffer);

  const pg = new Pool({ connectionString: DATABASE_URL });
  const schemaPath = path.join(__dirname, '../database/schema.postgresql.sql');

  console.log('Applying PostgreSQL schema...');
  await pg.query(fs.readFileSync(schemaPath, 'utf8'));

  try {
    const countRes = await pg.query('SELECT COUNT(*)::int AS c FROM users');
    if ((countRes.rows[0]?.c || 0) > 0) {
      console.log('PostgreSQL already contains data — skipping migration');
      await pg.end();
      sqlite.close();
      process.exit(0);
    }
  } catch (_) {
    /* جدول users غير موجود بعد — تابع النقل */
  }

  await pg.query(`
    TRUNCATE TABLE
      push_tokens, user_notifications, wishlist,
      order_bundle_items, order_bundles, order_items, orders,
      cart_bundle_items, cart_bundles, cart_items, cart,
      review_images, reviews,
      story_highlight_slides, story_highlights, story_slides, story_groups,
      inventory_sync_snapshots, web_settings, banners, offers,
      notifications, coupons, delivery_zones, product_images,
      product_variants, products, subcategories, categories, brands, users
    RESTART IDENTITY CASCADE
  `).catch((e) => console.warn('truncate warning:', e.message));

  const existingTables = sqlite.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  const sqliteTables = new Set(
    (existingTables[0]?.values || []).map((r) => r[0])
  );

  for (const table of TABLE_ORDER) {
    if (!sqliteTables.has(table)) {
      console.log(`  skip ${table} (not in sqlite)`);
      continue;
    }

    const data = sqlite.exec(`SELECT * FROM ${table}`);
    if (!data.length || !data[0].values.length) {
      console.log(`  ${table}: 0 rows`);
      continue;
    }

    const cols = data[0].columns;
    const rows = data[0].values;
    let inserted = 0;

    for (const row of rows) {
      const obj = {};
      cols.forEach((c, i) => { obj[c] = normalizeValue(c, row[i]); });
      const keys = Object.keys(obj);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map((k) => obj[k]);
      const sql = `INSERT INTO ${table} (${keys.map((k) => `"${k}"`).join(', ')}) VALUES (${placeholders})`;
      try {
        await pg.query(sql, values);
        inserted += 1;
      } catch (err) {
        console.error(`  ${table} row error:`, err.message);
        throw err;
      }
    }

    const seq = `${table}_id_seq`;
    await pg.query(
      `SELECT setval('${seq}', COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`
    ).catch(() => {});

    console.log(`  ${table}: ${inserted} rows`);
  }

  await pg.end();
  sqlite.close();
  console.log('\nMigration complete.');
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
