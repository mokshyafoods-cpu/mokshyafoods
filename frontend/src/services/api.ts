import axios from 'axios';
import { toast } from 'sonner';

const LOCAL_API_BASE_URL = 'http://localhost:5000/api';
const REMOTE_API_BASE_URL = 'https://mokshyafoods.onrender.com/api';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 0;
const AUTH_REDIRECT_KEY = 'auth-redirect-triggered';

export const clearAuthRedirectLock = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AUTH_REDIRECT_KEY);
};

const isAuthPage = () => {
  if (typeof window === 'undefined') return true;
  return window.location.pathname.startsWith('/auth');
};

const isPublicGuestRoute = () => {
  if (typeof window === 'undefined') return false;

  const pathname = window.location.pathname;
  return (
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/wishlist') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/faq') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/refund') ||
    pathname === '/'
  );
};

const triggerAuthRedirect = () => {
  if (typeof window === 'undefined') return;

  const path = window.location.pathname + window.location.search;
  if (isAuthPage() || isPublicGuestRoute() || sessionStorage.getItem(AUTH_REDIRECT_KEY) === '1') return;

  sessionStorage.setItem(AUTH_REDIRECT_KEY, '1');
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  const nextUrl = encodeURIComponent(path || '/account/dashboard');
  window.location.assign(`/auth/login?redirect=${nextUrl}`);
};

const getDefaultApiBaseUrl = () => {
  const envValue = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (envValue) return envValue;

  if (process.env.NODE_ENV === 'production') {
    return REMOTE_API_BASE_URL;
  }

  return LOCAL_API_BASE_URL;
};

export const normalizeApiBaseUrl = (value?: string) => {
  const raw = (value || getDefaultApiBaseUrl()).trim();
  if (!raw) return getDefaultApiBaseUrl();

  const withoutTrailingSlash = raw.replace(/\/+$/, '');
  const withoutApiSuffix = withoutTrailingSlash.endsWith('/api')
    ? withoutTrailingSlash.slice(0, -4)
    : withoutTrailingSlash;

  return withoutApiSuffix || getDefaultApiBaseUrl();
};

const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL || getDefaultApiBaseUrl());
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: REQUEST_TIMEOUT_MS,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors and return full axios response so callers can access response.data
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const shouldRetry = Boolean(
      config &&
      !config._retry &&
      (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || !error.response) &&
      (config.__retryCount ?? 0) < MAX_RETRIES
    );

    if (shouldRetry) {
      config.__retryCount = (config.__retryCount ?? 0) + 1;
      config._retry = true;
      await new Promise((resolve) => setTimeout(resolve, 400));
      return apiClient.request(config);
    }

    if (!error.response) {
      const message = `Unable to connect to the API server. Please make sure the backend is running at ${API_BASE_URL}.`;
      if (typeof window !== 'undefined') {
        toast.error(message, {
          duration: 2500,
        });
      }
      error.message = message;
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      const requestUrl = String(error?.config?.url || '');
      const publicOrderLookup = /\/orders\//.test(requestUrl) && requestUrl.split('/orders/').length > 1;
      const isPublicPage = isPublicGuestRoute();

      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (!publicOrderLookup && !isPublicPage && !isAuthPage()) {
          triggerAuthRedirect();
        }
      }
    }

    return Promise.reject(error);
  }
);

export const api = apiClient;

export const blogAPI = {
  getAll: (params?: any) => apiClient.get('/blog', { params }),
  getBySlug: (slug: string) => apiClient.get(`/blog/${encodeURIComponent(slug)}`),
};

export const authAPI = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  verifyEmail: (data: any) => apiClient.post('/auth/verify-email', data),
  resendOtp: () => apiClient.post('/auth/resend-otp'),
  forgotPassword: (data: any) => apiClient.post('/auth/forgot-password', data),
  resetPassword: (token: string, data: any) => apiClient.post(`/auth/reset-password/${token}`, data),
  googleLogin: (data: any) => apiClient.post('/auth/google-login', data),
};

export const productAPI = {
  getAll: (params?: any) => apiClient.get('/products', { params }),
  getById: (id: string, params?: any) => apiClient.get(`/products/${id}`, { params }),
  create: (data: any) => apiClient.post('/products', data),
  update: (id: string, data: any) => apiClient.put(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/products/${id}`),
};

export const categoryAPI = {
  getAll: () => apiClient.get('/categories'),
  getById: (id: string) => apiClient.get(`/categories/${id}`),
};

export const adminAPI = {
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getAnalytics: () => apiClient.get('/admin/analytics'),
  getLowStock: (threshold?: number) => apiClient.get('/admin/low-stock', { params: { threshold } }),
  updateStock: (productId: string, data: any) => apiClient.put(`/admin/stock/${productId}`, data),
  getRawMaterials: (params?: any) => apiClient.get('/admin/raw-materials', { params }),
  createRawMaterial: (data: any) => apiClient.post('/admin/raw-materials', data),
  updateRawMaterial: (id: string, data: any) => apiClient.put(`/admin/raw-materials/${id}`, data),
  deleteRawMaterial: (id: string) => apiClient.delete(`/admin/raw-materials/${id}`),
  getProductionBatches: (params?: any) => apiClient.get('/admin/production-batches', { params }),
  createProductionBatch: (data: any) => apiClient.post('/admin/production-batches', data),
  updateProductionBatch: (id: string, data: any) => apiClient.put(`/admin/production-batches/${id}`, data),
  deleteProductionBatch: (id: string) => apiClient.delete(`/admin/production-batches/${id}`),
  getMonthlyReport: (params?: any) => apiClient.get('/admin/monthly-report', { params }),
};

export const orderAPI = {
  create: (data: any) => apiClient.post('/orders', data),
  getAll: (params?: any) => apiClient.get('/orders', { params }),
  getById: (id: string) => apiClient.get(`/orders/${id}`),
  update: (id: string, data: any) => apiClient.put(`/orders/${id}`, data),
  delete: (id: string) => apiClient.delete(`/orders/${id}`),
  cancel: (id: string, reason: string) => apiClient.put(`/orders/${id}`, { status: 'cancelled', cancelReason: reason }),
};

export const userAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data: any) => apiClient.put('/users/profile', data),
  searchByPhone: (phone: string) => apiClient.get('/users/search', { params: { phone } }),
  getAll: (params?: any) => apiClient.get('/users', { params }),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
  updateRole: (id: string, data: any) => apiClient.put(`/users/${id}/role`, data),
};

export const wishlistAPI = {
  getWishlist: () => apiClient.get('/users/wishlist'),
  addToWishlist: (productId: string) => apiClient.post('/users/wishlist', { productId }),
  removeFromWishlist: (productId: string) => apiClient.delete(`/users/wishlist/${productId}`),
};

export const posAPI = {
  createOrder: (data: any) => apiClient.post('/pos/orders', data),
  getHeldSales: () => apiClient.get('/pos/held-sales'),
  createHeldSale: (data: any) => apiClient.post('/pos/held-sales', data),
  getHeldSale: (id: string) => apiClient.get(`/pos/held-sales/${id}`),
  deleteHeldSale: (id: string) => apiClient.delete(`/pos/held-sales/${id}`),
  startShift: (data: any) => apiClient.post('/pos/tills/start', data),
  closeShift: (id: string, data: any) => apiClient.put(`/pos/tills/${id}/close`, data),
  getTillHistory: () => apiClient.get('/pos/tills'),
};

export const paymentLedgerAPI = {
  getAll: (params?: any) => apiClient.get('/payment-ledger', { params }),
  getByOrderId: (orderId: string) => apiClient.get(`/payment-ledger/order/${orderId}`),
  createOrUpdate: (data: any) => apiClient.post('/payment-ledger', data),
  update: (id: string, data: any) => apiClient.put(`/payment-ledger/${id}`, data),
  delete: (id: string) => apiClient.delete(`/payment-ledger/${id}`),
};

export const reviewAPI = {
  create: (data: any) => apiClient.post('/reviews', data),
  getByProduct: (productId: string, params?: any) => apiClient.get('/reviews', { params: { productId, ...params } }),
  getUserReviews: () => apiClient.get('/reviews/user'),
  getAllAdmin: () => apiClient.get('/reviews/admin'),
  update: (id: string, data: any) => apiClient.put(`/reviews/${id}`, data),
  delete: (id: string) => apiClient.delete(`/reviews/${id}`),
  getPending: () => apiClient.get('/reviews/pending'),
  approve: (id: string) => apiClient.put(`/reviews/${id}/approve`),
  reject: (id: string) => apiClient.put(`/reviews/${id}/reject`),
};

export const contactAPI = {
  send: (data: any) => apiClient.post('/contact', data),
  getAll: (params?: any) => apiClient.get('/contact', { params }),
  updateStatus: (id: string, data: any) => apiClient.put(`/contact/${id}`, data),
};

export default apiClient;
