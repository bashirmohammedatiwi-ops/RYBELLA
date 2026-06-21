/** Display-only rounding for web storefront (not stored in DB / not used in admin). */
export const DISPLAY_PRICE_ROUND_STEP = 250

export function roundDisplayPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  const rounded = Math.round(n / DISPLAY_PRICE_ROUND_STEP) * DISPLAY_PRICE_ROUND_STEP
  return rounded > 0 ? rounded : DISPLAY_PRICE_ROUND_STEP
}

function buildPricing(rawPrice, originalPrice, discountPercent) {
  const price = Number(rawPrice)
  const original = Number(originalPrice) || price
  const discount = Number(discountPercent) || 0
  const hasDiscount = discount > 0 && original > price && price > 0
  const displayPrice = roundDisplayPrice(price)

  return {
    price: displayPrice,
    originalPrice: hasDiscount ? original : null,
    discountPercent: hasDiscount ? discount : 0,
    hasDiscount,
  }
}

export function getVariantPricing(variant) {
  if (!variant) return { price: null, originalPrice: null, discountPercent: 0, hasDiscount: false }
  return buildPricing(variant.price, variant.original_price, variant.discount_percent)
}

export function getProductCardPricing(product) {
  const variants = product?.variants || []
  if (!variants.length) {
    return buildPricing(product?.min_price, product?.min_original_price, product?.max_discount_percent)
  }

  let best = variants[0]
  let bestPrice = Number(best.price) || Infinity
  for (const v of variants) {
    const p = Number(v.price) || Infinity
    if (p < bestPrice) {
      best = v
      bestPrice = p
    }
  }
  return getVariantPricing(best)
}

export function getSelectedVariantPricing(selectedVariant, product) {
  if (selectedVariant) return getVariantPricing(selectedVariant)
  return getProductCardPricing(product)
}
