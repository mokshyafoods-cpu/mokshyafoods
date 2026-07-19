import { api } from './api';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
}

export interface CreateOrderPayload {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'cash' | 'cod' | 'esewa' | 'khalti' | 'fonepay';
  couponCode?: string;
  notes?: string;
}

export const orderService = {
  // Create order
  createOrder: async (payload: CreateOrderPayload) => {
    const { data } = await api.post('/orders', payload);
    return data;
  },

  // Get user orders
  getUserOrders: async (page = 1, limit = 10) => {
    const { data } = await api.get(`/orders?page=${page}&limit=${limit}`);
    return data;
  },

  // Get order details
  getOrder: async (orderId: string) => {
    const { data } = await api.get(`/orders/${orderId}`);
    return data;
  },

  // Cancel order
  cancelOrder: async (orderId: string, reason: string) => {
    const { data } = await api.put(`/orders/${orderId}`, {
      status: 'cancelled',
      cancelReason: reason,
    });
    return data;
  },

  // Get payment methods
  getPaymentMethods: async () => {
    return [
      { id: 'cash', name: 'Cash on Delivery', description: 'Pay when you receive' },
      { id: 'esewa', name: 'eSewa', description: 'Fast and secure payment' },
      { id: 'khalti', name: 'Khalti', description: 'Mobile wallet payment' },
      { id: 'fonepay', name: 'Fonepay', description: 'Mobile payment' },
    ];
  },

  // Initialize payment
  initializePayment: async (orderId: string, method: string) => {
    const { data } = await api.post(`/payments/initiate`, {
      orderId,
      method,
    });
    return data;
  },

  // Verify payment
  verifyPayment: async (transactionId: string) => {
    const { data } = await api.post(`/payments/verify`, {
      transactionId,
    });
    return data;
  },
};
