export const ORDER_STATUS_LABELS = {
  pending: 'قيد الانتظار',
  preparing_shipping: 'قيد التجهيز والشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

const LEGACY_STATUS_MAP = {
  confirmed: 'preparing_shipping',
  processing: 'preparing_shipping',
  shipped: 'preparing_shipping',
}

export function normalizeOrderStatus(status) {
  return LEGACY_STATUS_MAP[status] || status
}

export function getOrderStatusLabel(status) {
  const key = normalizeOrderStatus(status)
  return ORDER_STATUS_LABELS[key] || status
}

export function getOrderStatusClass(status) {
  return `premium-status-${normalizeOrderStatus(status)}`
}
