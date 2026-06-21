function normalizeIraqiPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits
}

function isValidIraqiPhone(value) {
  return /^07\d{9}$/.test(normalizeIraqiPhone(value))
}

module.exports = { normalizeIraqiPhone, isValidIraqiPhone }
