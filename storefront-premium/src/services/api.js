import axios from 'axios'
import { buildCacheKey, cachedRequest, readCache } from '../utils/apiCache'

const getBase = () => {
  const url = import.meta.env.VITE_API_URL
  if (!url) return ''
  return url.replace(/\/api\/?$/, '') || url
}
const API_URL = import.meta.env.DEV ? '' : getBase()
export const IMG_BASE = import.meta.env.DEV ? '' : getBase()

const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(err)
  }
)

const PAGE_SIZE = 24
const CATALOG_TTL = 5 * 60 * 1000
const SETTINGS_TTL = 10 * 60 * 1000

function cachedGet(path, params = {}, ttl = CATALOG_TTL) {
  const key = buildCacheKey(path, params)
  return cachedRequest(key, ttl, () => api.get(path, { params }))
}

export function prefetchPublicCatalog() {
  return Promise.all([
    cachedGet('/categories', {}, CATALOG_TTL),
    cachedGet('/banners', {}, CATALOG_TTL),
    cachedGet('/web-settings', {}, SETTINGS_TTL),
    cachedGet('/products', {
      status: 'published',
      lite: 1,
      meta: 1,
      limit: PAGE_SIZE,
      offset: 0,
    }, CATALOG_TTL),
  ])
}

export function getCachedExplorePage(params = {}) {
  const query = { status: 'published', lite: 1, meta: 1, limit: PAGE_SIZE, offset: 0, ...params }
  const raw = readCache(buildCacheKey('/products', query), CATALOG_TTL)
  if (!raw) return null
  return normalizePageResponse(raw, query)
}

function normalizePageResponse(data, params = {}) {
  const limit = Number(params.limit) || PAGE_SIZE
  const offset = Number(params.offset) || 0
  if (data && Array.isArray(data.products)) {
    const count = data.products.length
    const total = parseInt(data.total, 10) || 0
    const hasMore = data.hasMore === true
      || (total > 0 ? offset + count < total : count >= limit)
    return { products: data.products, total, hasMore, limit: data.limit ?? limit, offset: data.offset ?? offset }
  }
  if (Array.isArray(data)) {
    const hasMore = data.length >= limit
    return { products: data, total: hasMore ? offset + data.length + 1 : data.length, hasMore, limit, offset }
  }
  return { products: [], total: 0, hasMore: false, limit, offset }
}

export const productsAPI = {
  getAll: (params) => {
    const query = { ...params, status: params?.status ?? 'published' }
    if (query.lite === 1 || query.lite === '1' || query.lite === true) {
      return cachedGet('/products', query, CATALOG_TTL)
    }
    return api.get('/products', { params: query })
  },
  getPage: async (params = {}) => {
    const query = { status: 'published', lite: 1, meta: 1, ...params }
    try {
      const r = await cachedGet('/products', query, CATALOG_TTL)
      return normalizePageResponse(r?.data, query)
    } catch {
      /* fallback */
    }
    try {
      const r = await api.get('/products', { params: { status: 'published', lite: 1, ...params } })
      return normalizePageResponse(r?.data, params)
    } catch {
      return { products: [], total: 0, hasMore: false, limit: params.limit, offset: params.offset || 0 }
    }
  },
  getById: (id) => api.get(`/products/${id}`),
  getFilters: () => api.get('/products/filters'),
}
export const categoriesAPI = { getAll: () => cachedGet('/categories', {}, CATALOG_TTL) }
export const subcategoriesAPI = { getAll: (params) => api.get('/subcategories', { params }) }
export const brandsAPI = { getAll: () => cachedGet('/brands', {}, CATALOG_TTL) }
export const bannersAPI = { getAll: () => cachedGet('/banners', {}, CATALOG_TTL) }
export const storiesAPI = { getAll: () => cachedGet('/stories', {}, CATALOG_TTL) }
export const offersAPI = {
  getAll: () => cachedGet('/offers', {}, CATALOG_TTL),
  getById: (id) => api.get(`/offers/${id}`),
}
export const webSettingsAPI = {
  get: () => cachedGet('/web-settings', {}, SETTINGS_TTL).catch(() => ({ data: null })),
}
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  addBundle: (data) => api.post('/cart/add-bundle', data),
  update: (itemId, data) => api.put(`/cart/${itemId}`, data),
  updateBundle: (bundleId, data) => api.put(`/cart/bundles/${bundleId}`, data),
  remove: (itemId) => api.delete(`/cart/${itemId}`),
  removeBundle: (bundleId) => api.delete(`/cart/bundles/${bundleId}`),
  clear: () => api.delete('/cart'),
}
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.put(`/orders/${id}`, data),
}
export const wishlistAPI = {
  getAll: () => api.get('/wishlist'),
  add: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
}
export const reviewsAPI = {
  getByProduct: (productId) => api.get(`/reviews/products/${productId}`),
  create: (data, images) => {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => fd.append(k, v))
    ;(images || []).forEach((f) => fd.append('images', f))
    return api.post('/reviews', fd)
  },
}
export const deliveryZonesAPI = { getAll: () => api.get('/delivery-zones') }
export const couponsAPI = { apply: (data) => api.post('/coupons/apply', data) }
export const notificationsAPI = {
  getMine: () => api.get('/notifications/mine'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  getVapidPublicKey: () => api.get('/notifications/push/vapid-public-key'),
  subscribePush: (data) => api.post('/notifications/push/subscribe', data),
  unsubscribePush: (data) => api.post('/notifications/push/unsubscribe', data),
}
