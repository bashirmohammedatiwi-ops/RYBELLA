const db = require('../config/database')
const { normalizeBarcode, barcodeCandidates } = require('../utils/barcode')

let cachedExternalToken = null
let cachedExternalTokenExpiresAt = 0
let lastExternalFetchError = null

function expandBarcodeMatchKeys(barcode) {
  const keys = new Set()
  for (const c of barcodeCandidates(barcode)) keys.add(c)
  const stripped = String(barcode || '').replace(/^0+/, '')
  if (stripped) keys.add(stripped)
  if (/^\d+$/.test(stripped) && stripped.length < 13) {
    keys.add(stripped.padStart(13, '0'))
  }
  return [...keys]
}

function unwrapExternalPayload(data) {
  if (!data || typeof data !== 'object') return null
  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    if (data.data.barcode != null || data.data.price != null) return data.data
  }
  if (data.snapshot && typeof data.snapshot === 'object') return data.snapshot
  if (data.barcode != null || data.price != null) return data
  return null
}

function getExternalBaseUrl() {
  return (process.env.EXTERNAL_INVENTORY_API_URL || '').replace(/\/$/, '')
}

async function loginExternalApi(forceRefresh = false) {
  const staticToken = (process.env.EXTERNAL_INVENTORY_API_TOKEN || '').trim()
  if (staticToken && !forceRefresh) return staticToken

  if (!forceRefresh && cachedExternalToken && Date.now() < cachedExternalTokenExpiresAt - 60_000) {
    return cachedExternalToken
  }

  const email = (process.env.EXTERNAL_INVENTORY_API_EMAIL || '').trim()
  const password = process.env.EXTERNAL_INVENTORY_API_PASSWORD || ''
  const base = getExternalBaseUrl()
  if (!base || !email || !password) {
    return staticToken || null
  }

  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(15000),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || `HTTP ${res.status}`
    lastExternalFetchError = `login_failed: ${msg}`
    console.error('External inventory login failed:', lastExternalFetchError)
    return staticToken || null
  }

  const inner = data?.data && typeof data.data === 'object' && !Array.isArray(data.data)
    ? data.data
    : data
  const token = inner?.accessToken || inner?.access_token || data?.accessToken
  if (!token) {
    lastExternalFetchError = 'login_failed: no accessToken in response'
    console.error('External inventory login failed:', lastExternalFetchError)
    return staticToken || null
  }

  cachedExternalToken = token
  cachedExternalTokenExpiresAt = Date.now() + (Number(inner.expiresIn || data.expiresIn) || 900) * 1000
  lastExternalFetchError = null
  return token
}

async function getExternalAuthHeaders(forceRefresh = false) {
  const token = await loginExternalApi(forceRefresh)
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function findVariantRowsByBarcode(barcode) {
  const keys = expandBarcodeMatchKeys(barcode)
  if (!keys.length) return []
  const placeholders = keys.map(() => '?').join(',')
  const [variants] = await db.query(
    `SELECT id FROM product_variants
     WHERE TRIM(barcode) IN (${placeholders}) OR barcode IN (${placeholders})`,
    [...keys, ...keys]
  )
  return variants
}

async function findProductRowsByBarcode(barcode) {
  const keys = expandBarcodeMatchKeys(barcode)
  if (!keys.length) return []
  const placeholders = keys.map(() => '?').join(',')
  const [products] = await db.query(
    `SELECT id FROM products
     WHERE TRIM(barcode) IN (${placeholders}) OR barcode IN (${placeholders})`,
    [...keys, ...keys]
  )
  return products
}

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

const FINAL_PRICE_ROUND_STEP = 250

/** Round sale/final price to nearest 250 IQD (minimum 250 when price > 0). */
function roundFinalPrice(value) {
  const n = clampPrice(value)
  if (n <= 0) return 0
  const rounded = Math.round(n / FINAL_PRICE_ROUND_STEP) * FINAL_PRICE_ROUND_STEP
  return rounded > 0 ? rounded : FINAL_PRICE_ROUND_STEP
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

  let originalPrice = clampPrice(raw.originalPrice ?? raw.original_price ?? raw.price)
  let price = clampPrice(raw.price ?? raw.finalPrice ?? raw.final_price ?? originalPrice)
  if (price <= 0 && originalPrice > 0) price = originalPrice
  if (originalPrice <= 0 && price > 0) originalPrice = price

  const offerName = raw.offerName ?? raw.offer_name ?? null
  const sourceDiscountRaw = raw.discountPercent ?? raw.discount_percent
  const hasSourceDiscount = sourceDiscountRaw != null && sourceDiscountRaw !== ''
    && Number.isFinite(Number(sourceDiscountRaw))
  let sourceDiscount = hasSourceDiscount
    ? Math.max(0, Math.min(100, clampInt(sourceDiscountRaw, 0)))
    : -1

  const hasPromo = sourceDiscount > 0 || !!(offerName && String(offerName).trim())
    || (originalPrice > price && price > 0)

  if (!hasPromo) {
    const rounded = roundFinalPrice(originalPrice || price)
    return {
      barcode,
      productCode: raw.productCode ?? raw.product_code ?? null,
      productNum: raw.productNum ?? raw.product_num ?? null,
      name: raw.name ?? null,
      price: rounded,
      originalPrice: rounded,
      discountPercent: 0,
      stock: Math.max(0, clampInt(raw.stock ?? raw.quantity, 0)),
      offerName: null,
    }
  }

  // Keep original price from POS/Alhayaa (before rounding final price)
  originalPrice = clampPrice(raw.originalPrice ?? raw.original_price ?? originalPrice)
  if (originalPrice <= 0) originalPrice = price

  // Trust discount % from Alhayaa when provided (same as POS offer label)
  let discountPercent = sourceDiscount >= 0
    ? sourceDiscount
    : computeDiscountPercent(originalPrice, price)

  price = roundFinalPrice(price)

  // If rounding broke the promo, derive rounded final price from original + source %
  if (sourceDiscount > 0 && price >= originalPrice) {
    price = roundFinalPrice(originalPrice * (1 - sourceDiscount / 100))
  }

  if (price >= originalPrice) {
    const rounded = roundFinalPrice(originalPrice)
    return {
      barcode,
      productCode: raw.productCode ?? raw.product_code ?? null,
      productNum: raw.productNum ?? raw.product_num ?? null,
      name: raw.name ?? null,
      price: rounded,
      originalPrice: rounded,
      discountPercent: 0,
      stock: Math.max(0, clampInt(raw.stock ?? raw.quantity, 0)),
      offerName: null,
    }
  }

  // Only compute discount when source did not send it
  if (sourceDiscount < 0) {
    discountPercent = computeDiscountPercent(originalPrice, price)
  }

  return {
    barcode,
    productCode: raw.productCode ?? raw.product_code ?? null,
    productNum: raw.productNum ?? raw.product_num ?? null,
    name: raw.name ?? null,
    price,
    originalPrice,
    discountPercent,
    stock: Math.max(0, clampInt(raw.stock ?? raw.quantity, 0)),
    offerName: offerName || null,
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

  const variants = await findVariantRowsByBarcode(item.barcode)
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
    const products = await findProductRowsByBarcode(item.barcode)
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

async function fetchExternalByBarcode(barcode, retryOn401 = true) {
  const base = getExternalBaseUrl()
  if (!base) {
    lastExternalFetchError = 'missing EXTERNAL_INVENTORY_API_URL'
    return null
  }

  let headers = await getExternalAuthHeaders()
  if (!headers.Authorization) {
    lastExternalFetchError = 'missing auth: set EXTERNAL_INVENTORY_API_TOKEN or EMAIL/PASSWORD'
    console.warn('External inventory fetch skipped — no auth configured')
    return null
  }

  for (const candidate of barcodeCandidates(barcode)) {
    const url = `${base}/sync/inventory/by-barcode/${encodeURIComponent(candidate)}`
    try {
      let res = await fetch(url, { headers, signal: AbortSignal.timeout(12000) })
      if (res.status === 401 && retryOn401) {
        headers = await getExternalAuthHeaders(true)
        if (headers.Authorization) {
          res = await fetch(url, { headers, signal: AbortSignal.timeout(12000) })
        }
      }
      if (!res.ok) {
        lastExternalFetchError = `fetch ${candidate}: HTTP ${res.status}`
        if (res.status === 401) {
          lastExternalFetchError = 'unauthorized — check Alhayaa admin credentials/token'
        }
        continue
      }
      const data = await res.json()
      const payload = unwrapExternalPayload(data)
      if (payload?.barcode || payload?.price != null) {
        lastExternalFetchError = null
        return payload
      }
      lastExternalFetchError = `fetch ${candidate}: empty payload`
    } catch (e) {
      lastExternalFetchError = `fetch ${candidate}: ${e.message}`
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
  const stats = {
    total: barcodes.length,
    synced: 0,
    linked: 0,
    failed: 0,
    notLinked: 0,
    authConfigured: !!(await loginExternalApi()),
    lastError: lastExternalFetchError,
    failures: [],
  }

  if (!getExternalBaseUrl()) {
    stats.lastError = 'EXTERNAL_INVENTORY_API_URL not set'
    return stats
  }
  if (!stats.authConfigured) {
    stats.lastError = 'missing auth — add EXTERNAL_INVENTORY_API_EMAIL/PASSWORD or TOKEN'
    return stats
  }

  for (const barcode of barcodes) {
    try {
      const r = await syncBarcodeFromExternal(barcode)
      if (r.ok) {
        stats.synced += 1
        stats.linked += r.linked || 0
        if (!r.linked) stats.notLinked += 1
      } else {
        stats.failed += 1
        if (stats.failures.length < 10) {
          stats.failures.push({ barcode, reason: r.reason || 'unknown' })
        }
      }
    } catch (e) {
      stats.failed += 1
      if (stats.failures.length < 10) {
        stats.failures.push({ barcode, reason: e.message })
      }
    }
  }
  stats.lastError = lastExternalFetchError
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

async function getSyncStatus(testBarcode) {
  const base = getExternalBaseUrl()
  const hasToken = !!(process.env.EXTERNAL_INVENTORY_API_TOKEN || '').trim()
  const hasLogin = !!(
    (process.env.EXTERNAL_INVENTORY_API_EMAIL || '').trim() &&
    process.env.EXTERNAL_INVENTORY_API_PASSWORD
  )
  const authOk = !!(await loginExternalApi())
  const barcodes = await getAllCatalogBarcodes()

  const status = {
    configured: !!base,
    baseUrl: base || null,
    authMethod: hasToken ? 'token' : hasLogin ? 'email_password' : 'none',
    authOk,
    lastError: lastExternalFetchError,
    catalogBarcodes: barcodes.length,
  }

  if (testBarcode) {
    const external = await fetchExternalByBarcode(testBarcode)
    status.testBarcode = normalizeBarcode(testBarcode)
    status.testFetchOk = !!external
    status.testItem = external ? sanitizeSyncItem(external) : null
    status.lastError = lastExternalFetchError
  }

  return status
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
  roundFinalPrice,
  getSyncStatus,
}
