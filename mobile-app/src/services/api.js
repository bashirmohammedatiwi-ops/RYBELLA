import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/me/password', data),
  deleteAccount: (password) => api.delete('/auth/me', { data: { password } }),
};

export const productsAPI = {
  getAll: (params = {}) => api.get('/products', { params: { ...params, status: params.status ?? 'published' } }),
  getById: (id) => api.get(`/products/${id}`),
};

export const brandsAPI = {
  getAll: () => api.get('/brands'),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

export const subcategoriesAPI = {
  getAll: (params) => api.get('/subcategories', { params }),
};

export const bannersAPI = {
  getAll: () => api.get('/banners'),
};

export const offersAPI = {
  getAll: () => api.get('/offers'),
};

export const cartAPI = {
  get: () => api.get('/cart'),
  addItem: (variantId, quantity = 1) => api.post('/cart/add', { variant_id: variantId, quantity }),
  updateItem: (itemId, data) => api.put(`/cart/${itemId}`, data),
  removeItem: (itemId) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete('/cart'),
};

export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
};

export const wishlistAPI = {
  getAll: () => api.get('/wishlist'),
  getWishlist: () => api.get('/wishlist'),
  add: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

export const couponsAPI = {
  apply: (data) => api.post('/coupons/apply', data),
};

export const deliveryZonesAPI = {
  getAll: () => api.get('/delivery-zones'),
};

export const reviewsAPI = {
  getByProduct: (productId) => api.get(`/reviews/products/${productId}`),
  create: (data) => api.post('/reviews', data),
};

export default api;
