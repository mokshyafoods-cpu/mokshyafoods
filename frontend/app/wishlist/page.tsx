'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useCartStore } from '@/context/cartStore';
import { wishlistAPI } from '@/services/api';
import { toast } from 'sonner';
import { ShoppingCart, Heart, ArrowRight } from 'lucide-react';
import { readGuestWishlist, removeGuestWishlistItem } from '@/lib/wishlist';

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCartStore();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getProductImage = (product: any) => {
    return product.thumbnail || product.image || product.images?.[0]?.url || product?.image || '/placeholder.jpg';
  };

  useEffect(() => {
    const loadWishlist = async () => {
      setIsLoading(true);

      if (!isAuthenticated) {
        setWishlist(readGuestWishlist());
        setIsLoading(false);
        return;
      }

      try {
        const response = await wishlistAPI.getWishlist();
        setWishlist(response.data || []);
      } catch (error) {
        console.error('Failed to load wishlist:', error);
        setWishlist([]);
        toast.error('Unable to load your wishlist right now');
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlist();
  }, [isAuthenticated]);

  const handleRemove = async (productId: string) => {
    if (!isAuthenticated) {
      const nextItems = removeGuestWishlistItem(productId);
      setWishlist(nextItems);
      toast.success('Removed from wishlist');
      return;
    }

    try {
      await wishlistAPI.removeFromWishlist(productId);
      setWishlist((current) => current.filter((item) => item._id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Failed to remove wishlist item:', error);
      toast.error('Unable to remove item right now');
    }
  };

  const handleAddToCart = (item: any) => {
    addItem({
      productId: item._id || item.id,
      name: item.name,
      price: Number(item.discountPrice || item.price || item.amount || 0),
      quantity: 1,
      image: getProductImage(item),
      description: item.description,
      category: typeof item.category === 'string' ? item.category : item.category?.name || 'Uncategorized',
      sku: item.sku,
      weight: item.weight,
      stock: item.quantity,
      thumbnail: getProductImage(item),
      images: (item.images || []).map((img: any) => img?.url || img?.secure_url || img?.path).filter(Boolean),
      discountPrice: item.discountPrice,
      compareAtPrice: item.price,
      onSale: item.onSale,
      rating: item.rating,
      reviewCount: item.reviewCount,
      packaging: item.packaging,
      origin: item.origin,
    });
    toast.success('Added to cart');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Navigation />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-6 border-b border-slate-200 bg-gradient-to-r from-rose-50 via-white to-amber-50 p-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-secondary">Wishlist</p>
                <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Saved favorites</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  {isAuthenticated
                    ? 'Items you saved for later are waiting here.'
                    : 'Your saved products stay here even before you sign in.'}
                </p>
              </div>
              <Link href="/products" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
                Browse Products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="p-10 text-center">
                <p className="text-lg font-semibold text-slate-950">Loading your wishlist...</p>
              </div>
            ) : wishlist.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Heart className="h-8 w-8" />
                </div>
                <p className="mt-5 text-xl font-semibold text-slate-950">Your wishlist is empty</p>
                <p className="mt-3 text-slate-600">Add products you love and they will appear here for easy reordering.</p>
              </div>
            ) : (
              <div className="grid gap-6 p-8 md:grid-cols-2 xl:grid-cols-3">
                {wishlist.map((item, idx) => {
                  const productId = item._id || item.id;
                  return (
                    <div key={productId} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                      <div className="relative overflow-hidden">
                        <img
                          src={getProductImage(item)}
                          alt={item.name}
                          className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute left-4 top-4 rounded-full bg-primary text-white px-3 py-1 font-semibold">{idx + 1}</div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="text-lg font-semibold text-slate-950 line-clamp-2">{item.name}</h2>
                            {item.category && <p className="mt-2 text-sm text-slate-500">{item.category}</p>}
                          </div>
                        </div>
                        {item.description && <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-3">{item.description}</p>}
                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 opacity-0 translate-y-2 transition duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/90"
                          >
                            <ShoppingCart className="h-4 w-4" /> Add to cart
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(productId)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
