export function normalizeIraqiPhone(value) {
  return String(value || '').replace(/\D/g, '')
}

export function isValidIraqiPhone(value) {
  return /^07\d{9}$/.test(normalizeIraqiPhone(value))
}

export const IRAQI_PHONE_HINT = 'يجب أن يبدأ بـ 07 ويتكون من 11 رقم'
