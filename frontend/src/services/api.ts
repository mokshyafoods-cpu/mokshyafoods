import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors and return full axios response so callers can access response.data
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      const message = `Unable to connect to the API server. Please make sure the backend is running at ${API_BASE_URL}.`;
      toast.error(message, {
        duration: 2500,
      });
      error.message = message;
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
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
