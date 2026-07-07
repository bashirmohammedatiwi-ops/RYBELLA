const getApiBase = () => {
  const url = import.meta.env.VITE_API_URL
  if (!url) return ''
  return url.replace(/\/api\/?$/, '') || url
}

const ALLOWED_WIDTHS = [80, 120, 200, 240, 400, 600, 800, 900, 1000, 1200]

export const IMAGE_PRESETS = {
  icon: { width: 80, quality: 72 },
  thumb: { width: 120, quality: 72 },
  card: { width: 200, quality: 72 },
  medium: { width: 600, quality: 80 },
  banner: { width: 900, quality: 82 },
  hero: { width: 1000, quality: 82 },
}

export function snapWidth(width) {
  const w = Math.max(40, Math.min(1600, Math.round(Number(width) || 240)))
  let best = ALLOWED_WIDTHS[0]
  for (const allowed of ALLOWED_WIDTHS) {
    if (allowed <= w) best = allowed
    else break
  }
  return best
}

function isOptimizablePath(src) {
  if (!src || typeof src !== 'string') return false
  if (src.startsWith('http://') || src.startsWith('https://')) return false
  if (src.startsWith('/assets') || src.startsWith('data:')) return false
  if (!src.startsWith('/uploads/')) return false
  if (/\.(svg|gif)$/i.test(src)) return false
  return true
}

/** مسار ملف WebP ثابت من الـ cache — يُخدم مباشرة عبر Nginx بدون تحميل على Node */
export function getCachedImageUrl(src, { width = 240, quality = 76, format = 'webp' } = {}) {
  if (!isOptimizablePath(src)) return getOriginalImageUrl(src)
  const w = snapWidth(width)
  const safeName = src.replace(/^\/uploads\//, '').replace(/[/\\]/g, '__')
  const baseName = safeName.replace(/\.[^.]+$/, '')
  const base = import.meta.env.DEV ? '' : getApiBase()
  return `${base}/uploads/.cache/w${w}_q${quality}_${format}/${baseName}.webp`
}

/** يُستخدم فقط عند غياب ملف الـ cache — يولّد الملف ثم يُخدم ثابتاً لاحقاً */
export function getApiImageUrl(src, { width = 240, quality = 76, format = 'webp' } = {}) {
  if (!isOptimizablePath(src)) return getOriginalImageUrl(src)
  const base = import.meta.env.DEV ? '' : getApiBase()
  const params = new URLSearchParams({
    src,
    w: String(snapWidth(width)),
    q: String(quality),
    f: format,
  })
  return `${base}/api/img?${params}`
}

/** للتوافق */
export function getOptimizedImageUrl(src, options = {}) {
  return getCachedImageUrl(src, options)
}

export function getPresetConfig(preset = 'card') {
  if (typeof preset === 'number') {
    return { width: preset, quality: 76 }
  }
  return IMAGE_PRESETS[preset] || IMAGE_PRESETS.card
}

export function getOriginalImageUrl(src) {
  if (!src) return ''
  if (src.startsWith('http')) return src
  const base = import.meta.env.DEV ? '' : getApiBase()
  return `${base}${src}`
}

/** مسار الرفع الأصلي لبناء روابط الـ cache (ليس ملف .cache) */
export function getUploadSource(src, fallback) {
  if (fallback && isOptimizablePath(fallback)) return fallback
  if (src && isOptimizablePath(src) && !src.includes('/uploads/.cache/')) return src
  return null
}

/** رابط جاهز من السيرفر (cache أو أصل) — لا يُعاد تحويله */
export function isDirectImageUrl(src) {
  if (!src || typeof src !== 'string') return false
  return src.includes('/uploads/.cache/') || src.startsWith('http')
}
