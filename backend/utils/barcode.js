function normalizeBarcode(value) {
  if (value == null) return ''
  return String(value)
    .replace(/[\u200E\u200F\u202A-\u202E\u061C]/g, '')
    .replace(/[^\x20-\x7E0-9A-Za-z._\-/]/g, '')
    .trim()
}

function barcodeCandidates(value) {
  const normalized = normalizeBarcode(value)
  if (!normalized) return []
  const upper = normalized.toUpperCase()
  return upper === normalized ? [normalized] : [normalized, upper]
}

module.exports = { normalizeBarcode, barcodeCandidates }
