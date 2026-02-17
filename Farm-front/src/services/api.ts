/**
 * FRONTEND-ONLY: API Service Client
 * 
 * This is a frontend API client using Axios.
 * It defines the structure for making API calls to your backend.
 * No backend code is included - this is purely the client-side integration layer.
 * 
 * When you connect a backend, set VITE_API_BASE_URL in .env
 */

import axios from 'axios';
import { store } from '@/store';

// Create axios instance with base configuration
// This connects to your backend API (backend not included in this project)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    // Prefer real JWT token from storage; fallback to demo user id if present
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const state = store.getState();
    const token = storedToken || state.auth.user?.id;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      store.dispatch({ type: 'auth/logout' });
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiService = {
  // Auth
  auth: {
    // Password-based authentication (no OTP)
    login: (credentials: { phone?: string; email?: string; password: string }) =>
      api.post('/auth/login', credentials),
    register: (data: any) => api.post('/auth/register', data),
  },

  // Products
  products: {
    getAll: (params?: any) => api.get('/products', { params }),
    getById: (id: string) => api.get(`/products/${id}`),
    create: (data: any) => api.post('/products', data),
    update: (id: string, data: any) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`),
    search: (query: string) => api.get(`/products/search?q=${query}`),
  },

  // Orders
  orders: {
    getAll: (params?: any) => api.get('/orders', { params }),
    getById: (id: string) => api.get(`/orders/${id}`),
    create: (data: any) => api.post('/orders', data),
    update: (id: string, data: any) => api.put(`/orders/${id}`, data),
    cancel: (id: string) => api.post(`/orders/${id}/cancel`),
  },

  // Chats
  chats: {
    getAll: () => api.get('/chats'),
    getById: (id: string) => api.get(`/chats/${id}`),
    getMessages: (chatId: string) => api.get(`/chats/${chatId}/messages`),
    sendMessage: (chatId: string, message: any) =>
      api.post(`/chats/${chatId}/messages`, message),
  },

  // Reviews
  reviews: {
    getAll: (params?: any) => api.get('/reviews', { params }),
    create: (data: any) => api.post('/reviews', data),
    update: (id: string, data: any) => api.put(`/reviews/${id}`, data),
    reply: (id: string, reply: string) =>
      api.post(`/reviews/${id}/reply`, { reply }),
  },

  // Users
  users: {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data: any) => api.put('/users/profile', data),
    uploadKYC: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/users/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },

  // Admin
  admin: {
    getStats: () => api.get('/admin/stats'),
    getUsers: (params?: any) => api.get('/admin/users', { params }),
    approveKYC: (userId: string) => api.post(`/admin/users/${userId}/approve-kyc`),
    rejectKYC: (userId: string) => api.post(`/admin/users/${userId}/reject-kyc`),
    moderateListing: (listingId: string, action: string) =>
      api.post(`/admin/listings/${listingId}/moderate`, { action }),
    moderateReview: (reviewId: string, action: string) =>
      api.post(`/admin/reviews/${reviewId}/moderate`, { action }),
  },

  // Payment (Razorpay)
  payments: {
    createOrder: (orderData: any) => api.post('/payments/create-order', orderData),
    verifyPayment: (paymentData: any) =>
      api.post('/payments/verify', paymentData),
  },
};

export default api;

