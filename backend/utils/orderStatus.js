/** حالات الطلب — القيم المخزنة في قاعدة البيانات */
const ORDER_STATUSES = ['pending', 'preparing_shipping', 'delivered', 'cancelled']

const ORDER_STATUS_LABELS = {
  pending: 'قيد الانتظار',
  preparing_shipping: 'قيد التجهيز والشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

/** حالات قديمة → الحالة الحالية للعرض */
const LEGACY_STATUS_MAP = {
  confirmed: 'preparing_shipping',
  processing: 'preparing_shipping',
  shipped: 'preparing_shipping',
}

function normalizeOrderStatus(status) {
  return LEGACY_STATUS_MAP[status] || status
}

function getOrderStatusLabel(status) {
  const key = normalizeOrderStatus(status)
  return ORDER_STATUS_LABELS[key] || status
}

function isValidOrderStatus(status) {
  return ORDER_STATUSES.includes(status)
}

module.exports = {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  normalizeOrderStatus,
  getOrderStatusLabel,
  isValidOrderStatus,
}
