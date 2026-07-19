const GUEST_WISHLIST_STORAGE_KEY = 'mokshya_guest_wishlist';

export type GuestWishlistItem = {
  id: string;
  name: string;
  image?: string;
  price?: number;
  description?: string;
  category?: string;
  weight?: string;
  quantity?: number;
};

export const readGuestWishlist = (): GuestWishlistItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    console.error('Failed to read guest wishlist:', error);
    return [];
  }
};

export const writeGuestWishlist = (items: GuestWishlistItem[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(items));
};

export const addGuestWishlistItem = (product: any) => {
  const existingItems = readGuestWishlist();
  const productId = String(product?._id || product?.id || product?.productId || product?.name || '');
  const normalizedItem: GuestWishlistItem = {
    id: productId,
    name: product?.name || 'Product',
    image: product?.thumbnail || product?.image || product?.images?.[0]?.url || '/placeholder.jpg',
    price: Number(product?.discountPrice || product?.price || product?.amount || 0),
    description: product?.description,
    category: product?.category?.name || product?.category,
    weight: product?.weight,
    quantity: product?.quantity,
  };

  const exists = existingItems.some((item) => item.id === productId);
  if (exists) {
    return existingItems;
  }

  const nextItems = [normalizedItem, ...existingItems];
  writeGuestWishlist(nextItems);
  return nextItems;
};

export const removeGuestWishlistItem = (productId: string) => {
  const nextItems = readGuestWishlist().filter((item) => item.id !== productId);
  writeGuestWishlist(nextItems);
  return nextItems;
};

export const getGuestWishlistIds = () => {
  return readGuestWishlist().map((item) => item.id);
};

export const isGuestWishlistItem = (productId: string) => {
  return readGuestWishlist().some((item) => item.id === productId);
};

export const clearGuestWishlist = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);
};
