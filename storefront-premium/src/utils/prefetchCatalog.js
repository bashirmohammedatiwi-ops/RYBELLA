import { prefetchPublicCatalog } from '../services/api'

let started = false

/** يبدأ جلب الكتالوج قبل تحميل React — يُسرّع أول زيارة */
export function startCatalogPrefetch() {
  if (started || typeof window === 'undefined') return
  started = true

  const run = () => {
    prefetchPublicCatalog().catch(() => {})
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 400 })
  } else {
    window.setTimeout(run, 0)
  }
}
