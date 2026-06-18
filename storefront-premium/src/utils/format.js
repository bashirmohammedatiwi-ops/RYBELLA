const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const percentFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatNumber(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return numberFmt.format(n)
}

export function formatPrice(value, { suffix = ' د.ع' } = {}) {
  const formatted = formatNumber(value)
  if (formatted === '—') return formatted
  return `${formatted}${suffix}`
}

export function formatPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${percentFmt.format(n)}%`
}

export function formatCount(value, max = 99) {
  const n = Number(value) || 0
  if (n <= 0) return null
  if (n > max) return `${max}+`
  return formatNumber(n)
}

export function formatDate(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
