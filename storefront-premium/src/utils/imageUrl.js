const getApiBase = () => {
  const url = import.meta.env.VITE_API_URL
  if (!url) return ''
  return url.replace(/\/api\/?$/, '') || url
}

export const IMAGE_PRESETS = {
  icon: { width: 80, sizes: '64px', widths: [80], single: true, quality: 76 },
  thumb: { width: 120, sizes: '100px', widths: [120], single: true, quality: 76 },
  card: { width: 240, sizes: '(max-width: 480px) 46vw, 180px', widths: [240], single: true, quality: 76 },
  medium: { width: 600, sizes: '(max-width: 768px) 90vw, 400px', widths: [400, 600], single: false, quality: 80 },
  banner: { width: 900, sizes: '100vw', widths: [600, 900], single: false, quality: 82 },
  hero: { width: 1000, sizes: '100vw', widths: [800, 1000], single: false, quality: 82 },
}

function isOptimizablePath(src) {
  if (!src || typeof src !== 'string') return false
  if (src.startsWith('http://') || src.startsWith('https://')) return false
  if (src.startsWith('/assets') || src.startsWith('data:')) return false
  if (!src.startsWith('/uploads/')) return false
  if (/\.(svg|gif)$/i.test(src)) return false
  return true
}

export function getOptimizedImageUrl(src, { width = 240, quality = 76, format = 'webp' } = {}) {
  if (!src) return ''
  if (!isOptimizablePath(src)) {
    if (src.startsWith('http')) return src
    const base = import.meta.env.DEV ? '' : getApiBase()
    return `${base}${src}`
  }
  const base = import.meta.env.DEV ? '' : getApiBase()
  const params = new URLSearchParams({
    src,
    w: String(width),
    q: String(quality),
    f: format,
  })
  return `${base}/api/img?${params}`
}

export function getImageSrcSet(src, widths = [240], quality = 76, format = 'webp') {
  if (!isOptimizablePath(src)) return undefined
  return widths
    .map((w) => `${getOptimizedImageUrl(src, { width: w, quality, format })} ${w}w`)
    .join(', ')
}

export function getPresetConfig(preset = 'card') {
  if (typeof preset === 'number') {
    return { width: preset, sizes: `${preset}px`, widths: [preset], single: true, quality: 76 }
  }
  return IMAGE_PRESETS[preset] || IMAGE_PRESETS.card
}

export function getOriginalImageUrl(src) {
  if (!src) return ''
  if (src.startsWith('http')) return src
  const base = import.meta.env.DEV ? '' : getApiBase()
  return `${base}${src}`
}
