import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:5000/api'; // Android emulator
// const API_URL = 'http://localhost:5000/api'; // iOS simulator
// const API_URL = 'http://YOUR_IP:5000/api'; // Physical device

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào header
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/users/login', { email, password }),
  register: (name, email, password) => api.post('/users/register', { name, email, password }),
  getMe: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
};

// Product APIs
export const productAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getSimilarProducts: (id, limit = 10) => api.get(`/products/${id}/similar`, { params: { limit } }),
  getProductStats: (id) => api.get(`/products/${id}/stats`),
};

// Favorite APIs
export const favoriteAPI = {
  getFavorites: (page = 1, limit = 20) => api.get('/favorites', { params: { page, limit } }),
  addFavorite: (productId) => api.post('/favorites', { productId }),
  removeFavorite: (productId) => api.delete(`/favorites/${productId}`),
  toggleFavorite: (productId) => api.post(`/favorites/toggle/${productId}`),
  checkFavorite: (productId) => api.get(`/favorites/check/${productId}`),
};

// View History APIs
export const viewHistoryAPI = {
  getViewHistory: (page = 1, limit = 20) => api.get('/view-history', { params: { page, limit } }),
  recordView: (productId) => api.post('/view-history', { productId }),
  removeFromHistory: (productId) => api.delete(`/view-history/${productId}`),
  clearHistory: () => api.delete('/view-history'),
  getRecentViewed: (limit = 10) => api.get('/view-history/recent', { params: { limit } }),
};

// Comment APIs
export const commentAPI = {
  getProductComments: (productId, page = 1, limit = 10) => 
    api.get(`/comments/product/${productId}`, { params: { page, limit } }),
  addComment: (productId, content, rating, images = []) => 
    api.post('/comments', { productId, content, rating, images }),
  updateComment: (id, data) => api.put(`/comments/${id}`, data),
  deleteComment: (id) => api.delete(`/comments/${id}`),
  likeComment: (id) => api.post(`/comments/${id}/like`),
  getMyComments: (page = 1, limit = 10) => api.get('/comments/my-comments', { params: { page, limit } }),
};

// Order APIs
export const orderAPI = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: (page = 1, limit = 10, status) => 
    api.get('/orders', { params: { page, limit, status } }),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
};

export default api;

