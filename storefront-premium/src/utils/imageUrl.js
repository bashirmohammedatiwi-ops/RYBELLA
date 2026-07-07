const getApiBase = () => {
  const url = import.meta.env.VITE_API_URL
  if (!url) return ''
  return url.replace(/\/api\/?$/, '') || url
}

export const IMAGE_PRESETS = {
  icon: { width: 80, sizes: '64px', widths: [80, 120] },
  thumb: { width: 120, sizes: '100px', widths: [120, 200] },
  card: { width: 400, sizes: '(max-width: 480px) 46vw, 220px', widths: [200, 400, 800] },
  medium: { width: 800, sizes: '(max-width: 768px) 90vw, 420px', widths: [400, 800, 1200] },
  banner: { width: 1000, sizes: '100vw', widths: [600, 1000, 1200] },
  hero: { width: 1200, sizes: '100vw', widths: [800, 1200] },
}

function isOptimizablePath(src) {
  if (!src || typeof src !== 'string') return false
  if (src.startsWith('http://') || src.startsWith('https://')) return false
  if (src.startsWith('/assets') || src.startsWith('data:')) return false
  if (!src.startsWith('/uploads/')) return false
  if (/\.(svg|gif)$/i.test(src)) return false
  return true
}

export function getOptimizedImageUrl(src, { width = 400, quality = 82, format = 'webp' } = {}) {
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

export function getImageSrcSet(src, widths = [200, 400, 800], quality = 82, format = 'webp') {
  if (!isOptimizablePath(src)) return undefined
  return widths
    .map((w) => `${getOptimizedImageUrl(src, { width: w, quality, format })} ${w}w`)
    .join(', ')
}

export function getPresetConfig(preset = 'card') {
  if (typeof preset === 'number') {
    return { width: preset, sizes: `${preset}px`, widths: [Math.round(preset * 0.5), preset, preset * 2] }
  }
  return IMAGE_PRESETS[preset] || IMAGE_PRESETS.card
}

export function getOriginalImageUrl(src) {
  if (!src) return ''
  if (src.startsWith('http')) return src
  const base = import.meta.env.DEV ? '' : getApiBase()
  return `${base}${src}`
}
