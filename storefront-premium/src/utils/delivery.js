export const DEFAULT_FREE_SHIPPING_THRESHOLD = 50000

export function parseFreeShippingThreshold(value) {
  const t = parseFloat(value)
  return Number.isFinite(t) && t > 0 ? t : DEFAULT_FREE_SHIPPING_THRESHOLD
}

export function computeDeliveryFee(subtotal, zoneFee, threshold = DEFAULT_FREE_SHIPPING_THRESHOLD) {
  const sub = Number(subtotal) || 0
  const fee = Number(zoneFee) || 0
  const min = parseFreeShippingThreshold(threshold)
  if (sub >= min) return 0
  return fee
}

export function qualifiesForFreeShipping(subtotal, threshold = DEFAULT_FREE_SHIPPING_THRESHOLD) {
  return (Number(subtotal) || 0) >= parseFreeShippingThreshold(threshold)
}
