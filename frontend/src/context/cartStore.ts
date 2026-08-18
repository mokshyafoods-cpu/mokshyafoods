import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  description?: string;
  category?: string;
  sku?: string;
  weight?: string | number;
  stock?: number;
  thumbnail?: string;
  images?: string[];
  discountPrice?: number;
  compareAtPrice?: number;
  onSale?: boolean;
  rating?: number;
  reviewCount?: number;
  packaging?: string;
  origin?: string;
}

// Minimal data stored in localStorage to reduce quota usage
interface PersistedCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItem: (item: CartItem) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const getSafeLocalStorage = () => {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return null;
  }

  return window.localStorage;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find((i) => i.productId === item.productId);
        if (existingItem) {
          set({
            items: items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, item] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        });
      },
      updateItem: (item) => {
        const { items } = get();
        const existingItem = items.find((i) => i.productId === item.productId);
        if (existingItem) {
          set({
            items: items.map((i) =>
              i.productId === item.productId
                ? { ...item, quantity: i.quantity }
                : i
            ),
          });
        }
      },
      clearCart: () => set({ items: [] }),
      getTotalPrice: () =>
        get().items.reduce((total, item) => total + item.price * item.quantity, 0),
      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => ({
        getItem: (key: string) => {
          const storage = getSafeLocalStorage();
          if (!storage) return null;

          try {
            const stored = storage.getItem(key);
            if (!stored) return null;
            const data = JSON.parse(stored);
            return data;
          } catch (error) {
            console.error('Failed to parse cart storage:', error);
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          const storage = getSafeLocalStorage();
          if (!storage) return;

          try {
            const data = JSON.parse(value);
            if (data.state && data.state.items) {
              const slimmedItems = data.state.items.map((item: CartItem) => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
              }));
              const slimmedData = {
                ...data,
                state: {
                  ...data.state,
                  items: slimmedItems,
                },
              };
              storage.setItem(key, JSON.stringify(slimmedData));
            } else {
              storage.setItem(key, value);
            }
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.includes('QuotaExceededError')
            ) {
              console.warn('Cart storage quota exceeded, clearing cart');
              storage.removeItem(key);
              try {
                const minimalData = {
                  state: { items: [] },
                  version: 0,
                };
                storage.setItem(key, JSON.stringify(minimalData));
              } catch (retryError) {
                console.error('Failed to save minimal cart:', retryError);
              }
            } else {
              console.error('Failed to save cart storage:', error);
            }
          }
        },
        removeItem: (key: string) => {
          const storage = getSafeLocalStorage();
          if (!storage) return;
          storage.removeItem(key);
        },
      })),
    }
  )
);
