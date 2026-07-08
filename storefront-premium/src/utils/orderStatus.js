export const ORDER_STATUSES = ['pending', 'preparing_shipping', 'ready_to_ship', 'shipped', 'delivered', 'cancelled']

export const ORDER_STATUS_LABELS = {
  pending: 'قيد الانتظار',
  preparing_shipping: 'قيد التجهيز والشحن',
  ready_to_ship: 'قيد التجهيز والشحن',
  shipped: 'قيد التجهيز والشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

const LEGACY_STATUS_MAP = {
  confirmed: 'preparing_shipping',
  processing: 'preparing_shipping',
}

const CUSTOMER_COLLAPSE_MAP = {
  preparing_shipping: 'preparing_shipping',
  ready_to_ship: 'preparing_shipping',
  shipped: 'preparing_shipping',
  confirmed: 'preparing_shipping',
  processing: 'preparing_shipping',
}

export function normalizeOrderStatus(status) {
  return CUSTOMER_COLLAPSE_MAP[status] || LEGACY_STATUS_MAP[status] || status
}

export function getOrderStatusLabel(status) {
  const key = normalizeOrderStatus(status)
  return ORDER_STATUS_LABELS[key] || status
}

export function getOrderStatusClass(status) {
  return `premium-status-${normalizeOrderStatus(status)}`
}
