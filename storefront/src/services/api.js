import axios from 'axios'

const API_URL = import.meta.env.DEV ? '' : ((import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, ''))
export const IMG_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')

const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
}
export const categoriesAPI = { getAll: () => api.get('/categories') }
export const subcategoriesAPI = { getAll: (params) => api.get('/subcategories', { params }) }
export const brandsAPI = { getAll: () => api.get('/brands') }
export const bannersAPI = { getAll: () => api.get('/banners') }
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
}
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
}
export const deliveryZonesAPI = { getAll: () => api.get('/delivery-zones') }
export const couponsAPI = { apply: (data) => api.post('/coupons/apply', data) }

export default api
