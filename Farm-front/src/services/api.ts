/**
 * FRONTEND-ONLY: API Service Client
 * 
 * This is a frontend API client using Axios.
 * It defines the structure for making API calls to your backend.
 * No backend code is included - this is purely the client-side integration layer.
 * 
 * When you connect a backend, set VITE_API_BASE_URL in .env
 * (with or without trailing `/api` — see getApiBaseUrl).
 */

import axios from 'axios';
import { store } from '@/store';
import type { CopilotContextPayload } from '@/types';
import { getApiBaseUrl } from '@/lib/resolveApiBaseUrl';

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const sessionToken = sessionStorage.getItem('authToken');
  if (sessionToken) return sessionToken;

  // One-time migration from old localStorage token to tab-scoped sessionStorage.
  const legacyToken = localStorage.getItem('authToken');
  if (legacyToken) {
    sessionStorage.setItem('authToken', legacyToken);
    localStorage.removeItem('authToken');
    return legacyToken;
  }

  return null;
};

export const setAuthToken = (token: string) => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('authToken', token);
  // Ensure tabs do not share a single auth identity anymore.
  localStorage.removeItem('authToken');
};

export const clearAuthToken = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('authToken');
  localStorage.removeItem('authToken');
};

/** Default client timeout — Render cold starts + DB can exceed 20s. */
const DEFAULT_API_TIMEOUT_MS = 60000;

/** Auth routes that send email over SMTP (server may use ~30s socket + cold start). */
const LONG_TIMEOUT_AUTH_PATHS = [
  '/auth/register/send-email-code',
  '/auth/forgot-password',
];

// Create axios instance with base configuration
// This connects to your backend API (backend not included in this project)
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: DEFAULT_API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token; let browser set multipart boundary for FormData
api.interceptors.request.use(
  (config) => {
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      const h = config.headers as Record<string, unknown> & { delete?: (k: string) => void };
      delete h['Content-Type'];
      h.delete?.('Content-Type');
      if (config.timeout === undefined || config.timeout < 60000) {
        config.timeout = 120000;
      }
    }
    const urlPath = String(config.url || '').split('?')[0];
    if (
      LONG_TIMEOUT_AUTH_PATHS.some((p) => urlPath === p || urlPath.endsWith(p))
    ) {
      const want = 120000;
      if (config.timeout === undefined || config.timeout < want) {
        config.timeout = want;
      }
    }
    const token = getAuthToken();
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
      clearAuthToken();
      store.dispatch({ type: 'auth/logout' });
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      const msg = error.response?.data?.message;
      if (
        typeof msg === 'string' &&
        msg.toLowerCase().includes('suspended')
      ) {
        clearAuthToken();
        store.dispatch({ type: 'auth/logout' });
        window.location.href = '/login?suspended=1';
      }
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiService = {
  public: {
    getLandingStats: () =>
      api.get<{
        farmerCount: number;
        buyerCount: number;
        deliveredDeals: number;
        activeListings: number;
      }>('/public/landing-stats'),
  },

  // Auth
  auth: {
    // Password-based authentication (no OTP)
    login: (credentials: { phone?: string; email?: string; password: string }) =>
      api.post('/auth/login', credentials),
    googleLogin: (body: { credential: string }) => api.post('/auth/google', body),
    register: (data: any) => api.post('/auth/register', data),
    /** Farmer registration: FormData with all fields + kycFile + emailVerificationCode */
    registerWithKycForm: (formData: FormData) => api.post('/auth/register', formData),
    sendRegistrationEmailCode: (body: { email: string }) =>
      api.post('/auth/register/send-email-code', body),
    resetPassword: (body: { token: string; password: string }) =>
      api.post('/auth/reset-password', body),
    forgotPassword: (body: { email: string }) => api.post('/auth/forgot-password', body),
    resetPasswordWithOtp: (body: { email: string; otp: string; password: string }) =>
      api.post('/auth/reset-password-with-otp', body),
  },

  /** Mandi-ready listing coach (farmer JWT). Groq runs on server only. */
  ai: {
    listingCoach: (body: { notes: string; district?: string; state?: string }) =>
      api.post<{
        suggestions: {
          name: string;
          nameHindi: string;
          description: string;
          category: string;
          unit: string;
          suggestedPrice: number | null;
          suggestedAvailableQuantity: number | null;
          suggestedMinOrderQuantity: number | null;
          suggestedHarvestDate: string | null;
          honestyHints: string[];
          isOrganicGuess: boolean;
          isNegotiableGuess: boolean;
        };
        disclaimer: string;
      }>('/ai/listing-coach', body, { timeout: 45000 }),
    fairDealCoach: (body: {
      chatId: string;
      mode: 'rephrase' | 'questions' | 'explain_term';
      draftText?: string;
      term?: string;
    }) =>
      api.post<{
        mode: string;
        disclaimer: string;
        neutralDraft?: string;
        notes?: string | null;
        questions?: string[];
        term?: string;
        simpleEnglish?: string;
        simpleHindi?: string;
      }>('/ai/fair-deal-coach', body, { timeout: 45000 }),
    /** Site help widget (Groq). Optional JWT for rate limits. */
    helpChat: (body: {
      messages: { role: 'user' | 'assistant'; content: string }[];
      lang: 'en' | 'hi';
    }) =>
      api.post<{ reply: string; disclaimer: string }>('/ai/help-chat', body, {
        timeout: 45000,
      }),
    /** Unified Copilot (farmer/buyer JWT). Groq + intent detection on server. */
    copilot: (body: {
      messages: { role: 'user' | 'assistant'; content: string }[];
      lang: 'en' | 'hi';
      context?: CopilotContextPayload | null;
    }) =>
      api.post<{ intent: string; reply: string; disclaimer: string }>('/ai/copilot', body, {
        timeout: 45000,
      }),
    /** RSS farmer headlines + Groq snapshot + official portal shortcuts (farmer JWT). */
    farmerNews: (body: { lang: 'en' | 'hi'; refresh?: boolean }) =>
      api.post<{
        articles: Array<{
          id: string;
          title: string;
          link: string;
          source: string;
          publishedAt: string | null;
          summary: string;
        }>;
        rssFetchedAt: string | null;
        rssFromCache: boolean;
        feedErrors: string[];
        snapshot: string[] | null;
        snapshotGeneratedAt: string | null;
        snapshotFromCache: boolean;
        aiStatus: string;
        officialPortals: Array<{ id: string; title: string; url: string }>;
        disclaimer: string;
        notice?: string;
      }>('/ai/farmer-news', body, { timeout: 60000 }),
  },

  // Products
  products: {
    getAll: (params?: any) => api.get('/products', { params }),
    /** Paginates until exhausted. Requires JWT; backend must allow farmer + mine=true. */
    getAllMine: async () => {
      const limit = 100;
      let skip = 0;
      const products: any[] = [];
      for (;;) {
        const { data } = await api.get('/products', {
          params: { mine: true, limit, skip },
        });
        const batch = data?.products || [];
        products.push(...batch);
        if (batch.length < limit) break;
        skip += limit;
      }
      return { data: { products } };
    },
    getById: (id: string) => api.get(`/products/${id}`),
    create: (data: any) => api.post('/products', data),
    update: (id: string, data: any) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`),
    search: (query: string) => api.get(`/products/search?q=${query}`),
  },

  // Orders
  orders: {
    getAll: (params?: {
      limit?: number;
      skip?: number;
      includeTotal?: boolean;
      status?: string;
      paymentStatus?: string;
      dateFrom?: string;
      dateTo?: string;
    }) => api.get('/orders', { params }),
    /** Role-scoped CSV. Admin: same query params as getAll (filters + linked orders, server row cap). */
    exportCsv: (params?: {
      status?: string;
      paymentStatus?: string;
      dateFrom?: string;
      dateTo?: string;
    }) =>
      api.get('/orders/export.csv', {
        params,
        responseType: 'blob',
      }),
    getById: (id: string) => api.get(`/orders/${id}`),
    create: (data: any) => api.post('/orders', data),
    update: (id: string, data: any) => api.put(`/orders/${id}`, data),
    cancel: (id: string) => api.post(`/orders/${id}/cancel`),
  },

  // Chats
  chats: {
    getAll: (params?: { limit?: number; skip?: number; includeTotal?: boolean }) =>
      api.get('/chats', { params }),
    getById: (id: string) => api.get(`/chats/${id}`),
    getMessages: (chatId: string) => api.get(`/chats/${chatId}/messages`),
    create: (data: any) => api.post('/chats', data),
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
    submitKycDocument: (data: { docType: string; fileUrl: string; originalName?: string }) =>
      api.post('/users/kyc', data),
  },

  // Uploads
  uploads: {
    uploadImages: (files: File[]) => {
      const formData = new FormData();
      files.slice(0, 5).forEach((f) => formData.append('images', f));
      // Do not set Content-Type — browser/axios must add multipart boundary (interceptor strips defaults).
      return api.post('/uploads/images', formData);
    },
    uploadAvatar: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return api.post<{ url: string }>('/uploads/avatar', formData);
    },
    uploadKycFile: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post<{ url: string; originalName: string }>('/uploads/kyc', formData);
    },
  },

  // Farmer earnings (paid orders + withdrawals)
  earnings: {
    getDashboard: () => api.get('/earnings'),
    exportWithdrawalsCsv: () =>
      api.get('/earnings/withdrawals/export.csv', { responseType: 'blob' }),
    requestWithdrawal: (body: {
      amount: number;
      bankName?: string;
      accountNumber?: string;
      ifscCode?: string;
      accountHolderName?: string;
    }) => api.post('/earnings/withdrawals', body),
  },

  // Notifications
  notifications: {
    getUnreadCount: () => api.get<{ unreadCount: number }>('/notifications/unread-count'),
    getAll: (params?: { limit?: number; skip?: number; includeTotal?: boolean; type?: string }) =>
      api.get('/notifications', { params }),
    markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.post('/notifications/mark-all-read'),
    delete: (id: string) => api.delete(`/notifications/${id}`),
    clearAll: () => api.delete('/notifications'),
  },

  // Support
  support: {
    submitTicket: (body: { subject: string; message: string; guestEmail?: string }) =>
      api.post('/support/tickets', body),
    listMyTickets: () => api.get('/support/tickets/my'),
    getMyTicket: (id: string) => api.get(`/support/tickets/${id}`),
    replyToTicket: (id: string, body: { message: string }) =>
      api.post(`/support/tickets/${id}/reply`, body),
    subscribeNewsletter: (body: { email: string }) =>
      api.post('/support/newsletter/subscribe', body),
  },

  // Admin
  admin: {
    getStats: () => api.get('/admin/stats'),
    listAuditLogs: (params?: {
      skip?: number;
      limit?: number;
      action?: string;
      resourceType?: string;
      /** Case-insensitive substring on action; ignored if `action` is set */
      actionSearch?: string;
    }) => api.get('/admin/audit-logs', { params }),
    getOverviewAnalytics: () => api.get('/admin/analytics/overview'),
    getUsers: (params?: any) => api.get('/admin/users', { params }),
    patchUser: (
      userId: string,
      body: { accountStatus?: 'active' | 'suspended'; emailVerified?: boolean }
    ) => api.patch(`/admin/users/${userId}`, body),
    sendPasswordResetEmail: (userId: string) =>
      api.post(`/admin/users/${userId}/send-password-reset`),
    approveKYC: (userId: string) => api.post(`/admin/users/${userId}/approve-kyc`),
    rejectKYC: (userId: string, body?: { reason?: string }) =>
      api.post(`/admin/users/${userId}/reject-kyc`, body ?? {}),
    moderateListing: (listingId: string, action: string) =>
      api.post(`/admin/listings/${listingId}/moderate`, { action }),
    listReviews: (params?: { skip?: number; limit?: number; isApproved?: 'true' | 'false' }) =>
      api.get('/admin/reviews', { params }),
    moderateReview: (reviewId: string, action: string) =>
      api.post(`/admin/reviews/${reviewId}/moderate`, { action }),
    exportWithdrawalsCsv: (params?: { status?: string }) =>
      api.get('/admin/withdrawals/export.csv', { params, responseType: 'blob' }),
    listWithdrawals: (params?: { status?: string; skip?: number; limit?: number }) =>
      api.get('/admin/withdrawals', { params }),
    updateWithdrawal: (id: string, body: { status: string; rejectionReason?: string }) =>
      api.patch(`/admin/withdrawals/${id}`, body),

    broadcastNotifications: (body: {
      audience: 'all_farmers' | 'all_buyers' | 'user';
      recipientUserId?: string;
      title: string;
      message: string;
      link?: string;
    }) => api.post('/admin/notifications/broadcast', body),

    listSupportTickets: (params?: {
      skip?: number;
      limit?: number;
      status?: string;
      search?: string;
    }) => api.get('/admin/support-tickets', { params }),
    getSupportTicket: (id: string) => api.get(`/admin/support-tickets/${id}`),
    patchSupportTicket: (id: string, body: { status: string }) =>
      api.patch(`/admin/support-tickets/${id}`, body),
    replySupportTicket: (id: string, body: { message: string }) =>
      api.post(`/admin/support-tickets/${id}/reply`, body),

    listCalendarEntries: () => api.get('/admin/calendar/entries'),
    createCalendarEntry: (body: Record<string, unknown>) => api.post('/admin/calendar/entries', body),
    updateCalendarEntry: (id: string, body: Record<string, unknown>) =>
      api.patch(`/admin/calendar/entries/${id}`, body),
    deleteCalendarEntry: (id: string) => api.delete(`/admin/calendar/entries/${id}`),
  },

  /** Public seasonal guide + optional farmer personalization (Bearer optional on farmer-context). */
  calendar: {
    getGuide: (params?: { region?: string }) => api.get('/calendar', { params }),
    getFarmerContext: (params: { month: number }) =>
      api.get('/calendar/farmer-context', { params: { month: params.month } }),
  },

  // Payment (Razorpay)
  payments: {
    createOrder: (orderData: any) => api.post('/payments/create-order', orderData),
    verifyPayment: (paymentData: any) =>
      api.post('/payments/verify', paymentData),
  },
};

export default api;

