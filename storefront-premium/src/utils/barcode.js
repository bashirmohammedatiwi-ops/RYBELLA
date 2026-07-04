export function normalizeBarcode(value) {
  return String(value || '').trim().replace(/[\s\-]/g, '')
}

/** يبدو كباركود أو SKU (أرقام أو رمز alphanum بدون مسافات) */
export function isBarcodeLikeQuery(value) {
  const raw = String(value || '').trim()
  if (!raw) return false
  const normalized = normalizeBarcode(raw)
  if (/^\d{4,}$/.test(normalized)) return true
  if (raw.includes(' ')) return false
  return /^[A-Za-z0-9\-_]{5,24}$/.test(raw)
}

/** يجد ظل المنتج المطابق للباركود أو SKU */
export function findVariantByBarcode(product, rawCode) {
  const normalized = normalizeBarcode(rawCode)
  const raw = String(rawCode || '').trim()
  if (!normalized || !product?.variants?.length) return null

  return product.variants.find((variant) => {
    const barcode = normalizeBarcode(variant.barcode)
    const sku = normalizeBarcode(variant.sku)
    return (
      (barcode && barcode === normalized)
      || (sku && sku === normalized)
      || (variant.barcode && variant.barcode === raw)
      || (variant.sku && variant.sku === raw)
    )
  }) || null
}

export function findVariantIdByBarcode(product, rawCode) {
  return findVariantByBarcode(product, rawCode)?.id ?? null
}
