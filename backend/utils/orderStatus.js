/** حالات الطلب — القيم المخزنة في قاعدة البيانات */
const ORDER_STATUSES = ['pending', 'preparing_shipping', 'ready_to_ship', 'shipped', 'delivered', 'cancelled']

const ORDER_STATUS_LABELS = {
  pending: 'قيد الانتظار',
  preparing_shipping: 'قيد التجهيز',
  ready_to_ship: 'تم التجهيز',
  shipped: 'الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

/** حالات قديمة → الحالة الحالية (للموظفين والإدارة) */
const LEGACY_STATUS_MAP = {
  confirmed: 'preparing_shipping',
  processing: 'preparing_shipping',
}

/** للزبائن: دمج مراحل التجهيز والشحن في حالة واحدة */
const CUSTOMER_STATUS_MAP = {
  preparing_shipping: 'preparing_shipping',
  ready_to_ship: 'preparing_shipping',
  shipped: 'preparing_shipping',
  confirmed: 'preparing_shipping',
  processing: 'preparing_shipping',
}

const CUSTOMER_STATUS_LABELS = {
  pending: 'قيد الانتظار',
  preparing_shipping: 'قيد التجهيز والشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

function normalizeOrderStatus(status, { forCustomer = false } = {}) {
  if (forCustomer) {
    return CUSTOMER_STATUS_MAP[status] || status
  }
  return LEGACY_STATUS_MAP[status] || status
}

function getOrderStatusLabel(status, { forCustomer = false } = {}) {
  const key = normalizeOrderStatus(status, { forCustomer })
  if (forCustomer) {
    return CUSTOMER_STATUS_LABELS[key] || status
  }
  return ORDER_STATUS_LABELS[key] || status
}

function isValidOrderStatus(status) {
  return ORDER_STATUSES.includes(status)
}

module.exports = {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  CUSTOMER_STATUS_LABELS,
  normalizeOrderStatus,
  getOrderStatusLabel,
  isValidOrderStatus,
}
