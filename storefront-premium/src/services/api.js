import axios from 'axios'

const getBase = () => {
  const url = import.meta.env.VITE_API_URL || 'http://187.124.23.65:4000'
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

export const productsAPI = {
  getAll: (params) => api.get('/products', { params: { ...params, status: params?.status ?? 'published' } }),
  getById: (id) => api.get(`/products/${id}`),
}
export const categoriesAPI = { getAll: () => api.get('/categories') }
export const subcategoriesAPI = { getAll: (params) => api.get('/subcategories', { params }) }
export const brandsAPI = { getAll: () => api.get('/brands') }
export const bannersAPI = { getAll: () => api.get('/banners') }
export const storiesAPI = { getAll: () => api.get('/stories') }
export const offersAPI = { getAll: () => api.get('/offers') }
export const webSettingsAPI = {
  get: () => api.get('/web-settings').catch(() => ({ data: null })),
}
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  update: (itemId, data) => api.put(`/cart/${itemId}`, data),
  remove: (itemId) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete('/cart'),
}
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
}
export const wishlistAPI = {
  getAll: () => api.get('/wishlist'),
  add: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
}
export const deliveryZonesAPI = { getAll: () => api.get('/delivery-zones') }
export const couponsAPI = { apply: (data) => api.post('/coupons/apply', data) }
