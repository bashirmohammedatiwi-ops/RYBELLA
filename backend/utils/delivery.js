const DEFAULT_FREE_SHIPPING_THRESHOLD = 50000

async function getFreeShippingThreshold(db) {
  try {
    const [rows] = await db.query(
      "SELECT setting_value FROM web_settings WHERE setting_key = 'free_shipping_threshold' LIMIT 1"
    )
    const t = parseFloat(rows[0]?.setting_value)
    if (Number.isFinite(t) && t > 0) return t
  } catch {
    /* use default */
  }
  return DEFAULT_FREE_SHIPPING_THRESHOLD
}

function computeDeliveryFee(subtotal, zoneFee, threshold = DEFAULT_FREE_SHIPPING_THRESHOLD) {
  const sub = Number(subtotal) || 0
  const fee = Number(zoneFee) || 0
  const min = Number(threshold) || DEFAULT_FREE_SHIPPING_THRESHOLD
  if (sub >= min) return 0
  return fee
}

function qualifiesForFreeShipping(subtotal, threshold = DEFAULT_FREE_SHIPPING_THRESHOLD) {
  return (Number(subtotal) || 0) >= (Number(threshold) || DEFAULT_FREE_SHIPPING_THRESHOLD)
}

module.exports = {
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  getFreeShippingThreshold,
  computeDeliveryFee,
  qualifiesForFreeShipping,
}
