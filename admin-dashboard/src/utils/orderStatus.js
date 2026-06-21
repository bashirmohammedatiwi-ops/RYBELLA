export const ORDER_STATUSES = ['pending', 'preparing_shipping', 'delivered', 'cancelled']

export const ORDER_STATUS_LABELS = {
  pending: 'قيد الانتظار',
  preparing_shipping: 'قيد التجهيز والشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

export const ORDER_STATUS_COLORS = {
  pending: 'warning',
  preparing_shipping: 'primary',
  delivered: 'success',
  cancelled: 'error',
  confirmed: 'primary',
  processing: 'primary',
  shipped: 'primary',
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

export function getOrderStatusColor(status) {
  const key = normalizeOrderStatus(status)
  return ORDER_STATUS_COLORS[key] || 'default'
}
