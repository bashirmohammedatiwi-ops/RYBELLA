import { prefetchPublicCatalog } from '../services/api'

let started = false

/** يبدأ جلب الكتالوج فوراً مع تحميل الصفحة */
export function startCatalogPrefetch() {
  if (started || typeof window === 'undefined') return
  started = true
  prefetchPublicCatalog().catch(() => {})
}
