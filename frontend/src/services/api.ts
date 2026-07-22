import axios from 'axios';
import { toast } from 'sonner';

const DEFAULT_API_BASE_URL = 'https://mokshyafoods.onrender.com/api';
const REQUEST_TIMEOUT_MS = 12_000;

const normalizeApiBaseUrl = (value?: string) => {
  const raw = (value || DEFAULT_API_BASE_URL).trim();
  if (!raw) return DEFAULT_API_BASE_URL;

  const withoutTrailingSlash = raw.replace(/\/$/, '');
  return withoutTrailingSlash.replace(/\/api$/, '');
};

const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
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
      (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || !error.response)
    );

    if (shouldRetry) {
      config._retry = true;
      await new Promise((resolve) => setTimeout(resolve, 500));
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export const api = apiClient;

export const blogAPI = {
  getAll: (params?: any) => apiClient.get('/blog', { params }),
};

export const authAPI = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  verifyEmail: (data: any) => apiClient.post('/auth/verify-email', data),
  resendOtp: () => apiClient.post('/auth/resend-otp'),
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
};

export const reviewAPI = {
  create: (data: any) => apiClient.post('/reviews', data),
  getByProduct: (productId: string) => apiClient.get(`/reviews?productId=${productId}`),
  getUserReviews: () => apiClient.get('/reviews/user'),
};

export const contactAPI = {
  send: (data: any) => apiClient.post('/contact', data),
  getAll: (params?: any) => apiClient.get('/contact', { params }),
  updateStatus: (id: string, data: any) => apiClient.put(`/contact/${id}`, data),
};

export default apiClient;
