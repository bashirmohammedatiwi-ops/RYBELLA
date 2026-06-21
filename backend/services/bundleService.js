const db = require('../config/database')

function parseProductIds(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw || []
    return Array.isArray(parsed) ? parsed.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n)) : []
  } catch {
    return []
  }
}

function calcBundleTotals(lines, discountPercent, quantity = 1) {
  const subtotal = lines.reduce((s, line) => s + (Number(line.price) || 0) * (Number(line.quantity) || 1), 0)
  const discount = subtotal * ((Number(discountPercent) || 0) / 100)
  const unitTotal = subtotal - discount
  return {
    subtotal,
    unitTotal,
    total: unitTotal * quantity,
    discount,
  }
}

async function getOfferWithProducts(offerId) {
  const [rows] = await db.query('SELECT * FROM offers WHERE id = ? AND active = 1', [offerId])
  if (!rows.length) return null
  const offer = rows[0]
  const productIds = parseProductIds(offer.product_ids)
  return { offer, products: productIds.map((id) => ({ id })) }
}

async function validateBundleLines(offerId, lines) {
  const data = await getOfferWithProducts(offerId)
  if (!data) return { ok: false, message: 'العرض غير موجود' }

  const { offer, products } = data
  const productIds = new Set(products.map((p) => p.id))
  const normalized = []

  for (const line of lines || []) {
    const variantId = parseInt(line.variant_id, 10)
    const quantity = parseInt(line.quantity, 10) || 1
    if (!variantId || quantity < 1) continue

    const [variantRows] = await db.query(
      `SELECT pv.id, pv.product_id, pv.shade_name, pv.price, pv.stock, pv.image,
        p.name as product_name, p.main_image as product_image
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE pv.id = ?`,
      [variantId]
    )
    if (!variantRows.length) return { ok: false, message: 'منتج غير موجود في الباكج' }
    const v = variantRows[0]
    if (!productIds.has(v.product_id)) return { ok: false, message: 'المنتج لا ينتمي لهذا الباكج' }
    if (v.stock < quantity) return { ok: false, message: `الكمية غير متوفرة: ${v.product_name}` }

    normalized.push({
      variant_id: v.id,
      product_id: v.product_id,
      product_name: v.product_name,
      shade_name: v.shade_name,
      price: Number(v.price),
      quantity,
      image: v.image || v.product_image,
    })
  }

  if (normalized.length !== productIds.size) {
    return { ok: false, message: 'يجب إضافة جميع منتجات الباكج' }
  }

  const seenProducts = new Set(normalized.map((l) => l.product_id))
  if (seenProducts.size !== productIds.size) {
    return { ok: false, message: 'يجب إضافة جميع منتجات الباكج' }
  }

  const pricing = calcBundleTotals(normalized, offer.discount_percent, 1)
  return { ok: true, offer, lines: normalized, pricing }
}

async function formatCartBundleRow(bundleRow) {
  const [lineRows] = await db.query(
    `SELECT cbi.variant_id, pv.shade_name, pv.price, pv.image as variant_image,
      p.id as product_id, p.name as product_name, p.main_image as product_image
     FROM cart_bundle_items cbi
     JOIN product_variants pv ON pv.id = cbi.variant_id
     JOIN products p ON p.id = pv.product_id
     WHERE cbi.cart_bundle_id = ?`,
    [bundleRow.id]
  )

  const [offerRows] = await db.query('SELECT title, image, discount_percent, discount_label FROM offers WHERE id = ?', [bundleRow.offer_id])
  const offer = offerRows[0] || {}
  const lines = lineRows.map((r) => ({
    variant_id: r.variant_id,
    product_id: r.product_id,
    product_name: r.product_name,
    shade_name: r.shade_name,
    price: Number(r.price),
    quantity: 1,
    image: r.variant_image || r.product_image,
  }))
  const pricing = calcBundleTotals(lines, offer.discount_percent || 0, bundleRow.quantity)

  return {
    type: 'bundle',
    id: bundleRow.id,
    offer_id: bundleRow.offer_id,
    offer_title: offer.title || 'باكج حصري',
    offer_image: offer.image,
    discount_percent: Number(offer.discount_percent) || 0,
    discount_label: offer.discount_label,
    quantity: bundleRow.quantity,
    lines,
    subtotal: pricing.subtotal,
    unit_price: pricing.unitTotal,
    total_price: pricing.total,
  }
}

module.exports = {
  parseProductIds,
  calcBundleTotals,
  getOfferWithProducts,
  validateBundleLines,
  formatCartBundleRow,
}
