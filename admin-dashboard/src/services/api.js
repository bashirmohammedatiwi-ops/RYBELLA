import axios from 'axios';

// في التطوير: استخدم proxy من Vite (localhost:3001/api → 5000) لتجنب CORS
// في الإنتاج: استخدم VITE_API_URL أو الرابط الكامل
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');
// لعرض الصور: في التطوير استخدم '' (يمر عبر proxy)
export const IMG_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // محلياً: لا إعادة توجيه عند 401 (تسجيل الدخول معطل)
    if (error.response?.status === 401 && !import.meta.env.DEV) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/me/password', data),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  reorder: (items) => api.put('/products/reorder', { items }),
  getById: (id) => api.get(`/products/${id}`),
  create: (formData) => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/products/${id}`),
  duplicate: (id) => api.post(`/products/${id}/duplicate`),
};

export const variantsAPI = {
  create: (productId, data, formData) => {
    const fd = formData || new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        fd.append(key, data[key]);
      }
    });
    return api.post(`/products/${productId}/variants`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data, formData) => {
    const fd = formData || new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        fd.append(key, data[key]);
      }
    });
    return api.put(`/variants/${id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/variants/${id}`),
};

export const brandsAPI = {
  getAll: () => api.get('/brands'),
  reorder: (items) => api.put('/brands/reorder', { items }),
  create: (formData) => api.post('/brands', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/brands/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/brands/${id}`),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  reorder: (items) => api.put('/categories/reorder', { items }),
  create: (formData) => api.post('/categories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/categories/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const subcategoriesAPI = {
  getAll: (params) => api.get('/subcategories', { params }),
  reorder: (items) => api.put('/subcategories/reorder', { items }),
  getById: (id) => api.get(`/subcategories/${id}`),
  create: (formData) => api.post('/subcategories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/subcategories/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/subcategories/${id}`),
};

export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
};

export const couponsAPI = {
  getAll: () => api.get('/coupons'),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
};

export const reviewsAPI = {
  getAll: () => api.get('/reviews'),
  delete: (id) => api.delete(`/reviews/${id}`),
};

export const deliveryZonesAPI = {
  getAll: () => api.get('/delivery-zones'),
  create: (data) => api.post('/delivery-zones', data),
  update: (id, data) => api.put(`/delivery-zones/${id}`, data),
  delete: (id) => api.delete(`/delivery-zones/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getLowStock: () => api.get('/dashboard/low-stock'),
  getTopProducts: () => api.get('/dashboard/top-products'),
  getSalesChart: (days) => api.get('/dashboard/sales-chart', { params: { days } }),
};

export const bannersAPI = {
  getAll: () => api.get('/banners/admin'),
  create: (formData) => api.post('/banners', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/banners/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/banners/${id}`),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  create: (data) => api.post('/notifications', data),
};

export default api;
