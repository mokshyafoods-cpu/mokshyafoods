'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Footer from '@/components/Footer';
import { useCartStore } from '@/context/cartStore';
import { wishlistAPI } from '@/services/api';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { addItem } = useCartStore();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getProductImage = (product: any) => {
    return product.thumbnail || product.images?.[0]?.url || '/placeholder.jpg';
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const loadWishlist = async () => {
      setIsLoading(true);
      try {
        const response = await wishlistAPI.getWishlist();
        const body = response?.data ?? response;
        const payload = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
        setWishlist(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error('Failed to load wishlist:', error);
        setWishlist([]);
        toast.error('Unable to load your wishlist right now');
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlist();
  }, [isAuthenticated, router]);

  const handleRemove = async (productId: string) => {
    try {
      await wishlistAPI.removeFromWishlist(productId);
      setWishlist((current) => current.filter((item) => item._id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Failed to remove wishlist item:', error);
      toast.error('Unable to remove item right now');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="flex-grow py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-secondary">Wishlist</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-950">Saved favorites</h1>
                <p className="mt-2 text-sm text-slate-600">Items you saved for later appear here.</p>
              </div>
              <Link href="/products" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
                Browse Products
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-semibold text-slate-950">Loading your wishlist...</p>
            </div>
          ) : wishlist.length === 0 ? (
            <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-xl font-semibold text-slate-950">Your wishlist is empty</p>
              <p className="mt-3 text-slate-600">Add products you love and they will appear here for easy reordering.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {wishlist.map((item) => (
                <div key={item._id} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative overflow-hidden">
                    <img src={getProductImage(item)} alt={item.name} className="h-56 w-full object-cover transition duration-300 group-hover:scale-105" />
                    <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full bg-black/70 px-3 py-2 opacity-0 transition duration-300 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          addItem({
                            productId: item._id,
                            name: item.name,
                            price: item.discountPrice ?? item.price,
                            quantity: 1,
                            image: getProductImage(item),
                          });
                          toast.success('Added to cart');
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/90"
                      >
                        <ShoppingCart className="h-4 w-4" /> Add
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(item._id)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-white"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 text-sm text-slate-500">
                      <span className="font-semibold text-slate-950 line-clamp-2">{item.name}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Rs {item.discountPrice ?? item.price}</span>
                    </div>
                    {item.description && <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-3">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
      <Footer />
    </div>
  );
}
