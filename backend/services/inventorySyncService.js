const db = require('../config/database')
const { normalizeBarcode, barcodeCandidates } = require('../utils/barcode')

function clampInt(value, fallback = 0) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return fallback
  return n
}

function clampPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n)
}

function computeDiscountPercent(originalPrice, finalPrice) {
  const orig = clampPrice(originalPrice)
  const fin = clampPrice(finalPrice)
  if (orig <= 0 || fin >= orig) return 0
  return Math.round((1 - fin / orig) * 100)
}

function sanitizeSyncItem(raw) {
  const barcode = normalizeBarcode(raw.barcode)
  if (!barcode) return null

  const originalPrice = clampPrice(raw.originalPrice ?? raw.original_price ?? raw.price)
  let price = clampPrice(raw.price ?? raw.finalPrice ?? raw.final_price ?? originalPrice)
  if (price <= 0 && originalPrice > 0) price = originalPrice

  let discountPercent = clampInt(raw.discountPercent ?? raw.discount_percent, -1)
  if (discountPercent < 0) {
    discountPercent = computeDiscountPercent(originalPrice, price)
  }
  discountPercent = Math.max(0, Math.min(100, discountPercent))

  if (discountPercent > 0 && originalPrice > price && price > 0) {
    // keep as-is
  } else if (originalPrice > price && price > 0) {
    discountPercent = computeDiscountPercent(originalPrice, price)
  } else {
    discountPercent = 0
    price = originalPrice || price
  }

  return {
    barcode,
    productCode: raw.productCode ?? raw.product_code ?? null,
    productNum: raw.productNum ?? raw.product_num ?? null,
    name: raw.name ?? null,
    price,
    originalPrice: originalPrice || price,
    discountPercent,
    stock: Math.max(0, clampInt(raw.stock ?? raw.quantity, 0)),
    offerName: raw.offerName ?? raw.offer_name ?? null,
  }
}

async function upsertSnapshot(item) {
  const now = new Date().toISOString()
  await db.query(
    `INSERT INTO inventory_sync_snapshots
      (barcode, product_code, product_num, name, price, original_price, discount_percent, stock, offer_name, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(barcode) DO UPDATE SET
      product_code = excluded.product_code,
      product_num = excluded.product_num,
      name = excluded.name,
      price = excluded.price,
      original_price = excluded.original_price,
      discount_percent = excluded.discount_percent,
      stock = excluded.stock,
      offer_name = excluded.offer_name,
      synced_at = excluded.synced_at`,
    [
      item.barcode,
      item.productCode,
      item.productNum,
      item.name,
      item.price,
      item.originalPrice,
      item.discountPercent,
      item.stock,
      item.offerName,
      now,
    ]
  )
}

async function applyItemToCatalog(item) {
  const now = new Date().toISOString()
  let updated = 0

  const [variants] = await db.query(
    'SELECT id FROM product_variants WHERE barcode = ?',
    [item.barcode]
  )
  for (const row of variants) {
    await db.query(
      `UPDATE product_variants SET
        price = ?, original_price = ?, discount_percent = ?, stock = ?, last_synced_at = ?
       WHERE id = ?`,
      [item.price, item.originalPrice, item.discountPercent, item.stock, now, row.id]
    )
    updated += 1
  }

  if (updated === 0) {
    const [products] = await db.query(
      'SELECT id FROM products WHERE barcode = ?',
      [item.barcode]
    )
    for (const prod of products) {
      const [simpleVariants] = await db.query(
        `SELECT id FROM product_variants WHERE product_id = ?
         AND (shade_name = 'وحدة واحدة' OR shade_name = 'عنصر إضافي')
         ORDER BY id LIMIT 1`,
        [prod.id]
      )
      if (simpleVariants.length) {
        await db.query(
          `UPDATE product_variants SET
            price = ?, original_price = ?, discount_percent = ?, stock = ?, last_synced_at = ?
           WHERE id = ?`,
          [item.price, item.originalPrice, item.discountPercent, item.stock, now, simpleVariants[0].id]
        )
        updated += 1
      }
    }
  }

  return updated
}

async function syncItem(rawItem) {
  const item = sanitizeSyncItem(rawItem)
  if (!item) return { ok: false, reason: 'invalid_barcode' }
  await upsertSnapshot(item)
  const linked = await applyItemToCatalog(item)
  return { ok: true, barcode: item.barcode, linked, item }
}

async function syncBulk(rawItems = []) {
  const results = { synced: 0, linked: 0, failed: 0, skipped: 0, items: [] }
  const seen = new Set()

  for (const raw of rawItems) {
    const item = sanitizeSyncItem(raw)
    if (!item) {
      results.skipped += 1
      continue
    }
    if (seen.has(item.barcode)) {
      results.skipped += 1
      continue
    }
    seen.add(item.barcode)
    try {
      const r = await syncItem(item)
      if (r.ok) {
        results.synced += 1
        results.linked += r.linked || 0
        results.items.push({ barcode: item.barcode, linked: r.linked })
      } else {
        results.failed += 1
      }
    } catch (e) {
      results.failed += 1
    }
  }
  return results
}

async function fetchExternalByBarcode(barcode) {
  const base = (process.env.EXTERNAL_INVENTORY_API_URL || '').replace(/\/$/, '')
  if (!base) return null

  for (const candidate of barcodeCandidates(barcode)) {
    const url = `${base}/sync/inventory/by-barcode/${encodeURIComponent(candidate)}`
    const headers = { Accept: 'application/json' }
    const token = process.env.EXTERNAL_INVENTORY_API_TOKEN
    if (token) headers.Authorization = `Bearer ${token}`

    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(12000) })
      if (!res.ok) continue
      const data = await res.json()
      const payload = data?.data ?? data?.snapshot ?? data
      if (payload?.barcode || payload?.price != null) return payload
    } catch (_) {
      /* try next candidate */
    }
  }
  return null
}

async function syncBarcodeFromExternal(barcode) {
  const normalized = normalizeBarcode(barcode)
  if (!normalized) return { ok: false, reason: 'invalid_barcode' }

  const external = await fetchExternalByBarcode(normalized)
  if (!external) {
    const [local] = await db.query(
      'SELECT * FROM inventory_sync_snapshots WHERE barcode = ?',
      [normalized]
    )
    if (local.length) {
      const item = sanitizeSyncItem(local[0])
      const linked = await applyItemToCatalog(item)
      return { ok: true, source: 'local_snapshot', linked, item }
    }
    return { ok: false, reason: 'not_found' }
  }

  return syncItem(external)
}

async function getAllCatalogBarcodes() {
  const [rows] = await db.query(`
    SELECT DISTINCT barcode FROM product_variants WHERE barcode IS NOT NULL AND TRIM(barcode) != ''
    UNION
    SELECT DISTINCT barcode FROM products WHERE barcode IS NOT NULL AND TRIM(barcode) != ''
  `)
  return rows.map((r) => normalizeBarcode(r.barcode)).filter(Boolean)
}

async function refreshAllFromExternal() {
  const barcodes = await getAllCatalogBarcodes()
  const stats = { total: barcodes.length, synced: 0, linked: 0, failed: 0 }
  for (const barcode of barcodes) {
    try {
      const r = await syncBarcodeFromExternal(barcode)
      if (r.ok) {
        stats.synced += 1
        stats.linked += r.linked || 0
      } else {
        stats.failed += 1
      }
    } catch (_) {
      stats.failed += 1
    }
  }
  return stats
}

async function refreshProduct(productId) {
  const [variants] = await db.query(
    'SELECT barcode FROM product_variants WHERE product_id = ? AND barcode IS NOT NULL AND TRIM(barcode) != \'\'',
    [productId]
  )
  const [products] = await db.query(
    'SELECT barcode FROM products WHERE id = ? AND barcode IS NOT NULL AND TRIM(barcode) != \'\'',
    [productId]
  )
  const barcodes = new Set([
    ...variants.map((v) => normalizeBarcode(v.barcode)),
    ...products.map((p) => normalizeBarcode(p.barcode)),
  ].filter(Boolean))

  let linked = 0
  for (const barcode of barcodes) {
    const r = await syncBarcodeFromExternal(barcode)
    if (r.ok) linked += r.linked || 0
  }
  return { barcodes: [...barcodes], linked }
}

async function getByBarcode(barcode) {
  const normalized = normalizeBarcode(barcode)
  if (!normalized) return null

  const [snapshots] = await db.query(
    'SELECT * FROM inventory_sync_snapshots WHERE barcode = ?',
    [normalized]
  )
  const snapshot = snapshots[0] || null

  const [variants] = await db.query(
    `SELECT pv.*, p.name as product_name FROM product_variants pv
     JOIN products p ON p.id = pv.product_id
     WHERE pv.barcode = ?`,
    [normalized]
  )

  const [products] = await db.query(
    'SELECT id, name, barcode FROM products WHERE barcode = ?',
    [normalized]
  )

  return { snapshot, variants, products }
}

function enrichProductPricing(product) {
  const variants = product.variants || []
  if (!variants.length) return product

  let minPrice = Infinity
  let minOriginal = null
  let maxDiscount = 0
  let hasDiscount = false

  for (const v of variants) {
    const price = parseFloat(v.price) || 0
    const original = parseFloat(v.original_price) || price
    const discount = parseFloat(v.discount_percent) || 0
    const variantHasDiscount = discount > 0 && original > price

    v.has_discount = variantHasDiscount ? 1 : 0

    if (price > 0 && price < minPrice) {
      minPrice = price
      minOriginal = variantHasDiscount ? original : null
    }
    if (variantHasDiscount && discount > maxDiscount) {
      maxDiscount = discount
      hasDiscount = true
    }
  }

  product.min_price = minPrice === Infinity ? product.min_price : minPrice
  product.min_original_price = minOriginal
  product.max_discount_percent = maxDiscount
  product.has_discount = hasDiscount ? 1 : 0
  return product
}

module.exports = {
  sanitizeSyncItem,
  syncItem,
  syncBulk,
  syncBarcodeFromExternal,
  refreshAllFromExternal,
  refreshProduct,
  getByBarcode,
  enrichProductPricing,
  computeDiscountPercent,
}
