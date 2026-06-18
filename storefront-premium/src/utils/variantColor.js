const SHADE_COLOR_MAP = {
  أحمر: '#C62828', وردي: '#EC407A', برتقالي: '#EF6C00', أصفر: '#F9A825',
  أخضر: '#2E7D32', أزرق: '#1565C0', بنفسجي: '#7B1FA2', بني: '#5D4037',
  أسود: '#212121', أبيض: '#FAFAFA', بيج: '#D7CCC8', كحلي: '#283593',
  ذهبي: '#FFD700', فضي: '#9E9E9E', nude: '#E8D5C4', nude2: '#D4B896',
  مشمشي: '#FFAB91', مرجاني: '#FF8A65', خوخي: '#FFCCBC',
}

export function getVariantColor(v) {
  if (v?.color_code && /^#[0-9A-Fa-f]{3,8}$/.test(v.color_code)) return v.color_code
  const name = (v?.shade_name || '').toLowerCase()
  for (const [key, hex] of Object.entries(SHADE_COLOR_MAP)) {
    if (name.includes(key.toLowerCase())) return hex
  }
  return null
}

export function isMetallicShade(color, shadeName) {
  if (!color) return false
  const name = (shadeName || '').toLowerCase()
  return name.includes('ذهبي') || name.includes('فضي') || name.includes('gold') || name.includes('silver')
}

export function getProductColorSwatches(variants = [], limit = 4) {
  const seen = new Set()
  const colors = []
  for (const v of variants) {
    const color = getVariantColor(v)
    if (!color || seen.has(color)) continue
    seen.add(color)
    colors.push(color)
  }
  return {
    displayed: colors.slice(0, limit),
    total: colors.length,
    remaining: Math.max(0, colors.length - limit),
  }
}
