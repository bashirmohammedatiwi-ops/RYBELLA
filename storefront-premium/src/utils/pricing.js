export function getVariantPricing(variant) {
  if (!variant) return { price: null, originalPrice: null, discountPercent: 0, hasDiscount: false }
  const price = Number(variant.price)
  const original = Number(variant.original_price) || price
  const discountPercent = Number(variant.discount_percent) || 0
  const hasDiscount = discountPercent > 0 && original > price && price > 0
  return {
    price: Number.isFinite(price) ? price : null,
    originalPrice: hasDiscount ? original : null,
    discountPercent: hasDiscount ? discountPercent : 0,
    hasDiscount,
  }
}

export function getProductCardPricing(product) {
  const variants = product?.variants || []
  if (!variants.length) {
    const price = Number(product?.min_price)
    const original = Number(product?.min_original_price)
    const discountPercent = Number(product?.max_discount_percent) || 0
    const hasDiscount = product?.has_discount && original > price
    return {
      price: Number.isFinite(price) ? price : null,
      originalPrice: hasDiscount ? original : null,
      discountPercent: hasDiscount ? discountPercent : 0,
      hasDiscount: !!hasDiscount,
    }
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
