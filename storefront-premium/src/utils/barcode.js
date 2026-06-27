export function normalizeBarcode(value) {
  return String(value || '').trim().replace(/[\s\-]/g, '')
}

/** يبدو كباركود أو SKU (أرقام أو رمز alphanum بدون مسافات) */
export function isBarcodeLikeQuery(value) {
  const raw = String(value || '').trim()
  if (!raw) return false
  const normalized = normalizeBarcode(raw)
  if (/^\d{4,}$/.test(normalized)) return true
  if (raw.includes(' ')) return false
  return /^[A-Za-z0-9\-_]{5,24}$/.test(raw)
}
