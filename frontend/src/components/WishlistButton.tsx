'use client';

import { useEffect, useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { wishlistAPI } from '@/services/api';
import { addGuestWishlistItem, getGuestWishlistIds, isGuestWishlistItem, removeGuestWishlistItem } from '@/lib/wishlist';

interface WishlistButtonProps {
  product: any;
  className?: string;
  iconClassName?: string;
  disabled?: boolean;
}

export default function WishlistButton({ product, className = '', iconClassName = '', disabled = false }: WishlistButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const productId = String(product?._id || product?.id || product?.productId || '');
  const productName = product?.name || 'this product';

  useEffect(() => {
    if (!productId) {
      setIsWishlisted(false);
      return;
    }

    let active = true;

    const syncWishlistState = async () => {
      if (!active) return;

      if (!isAuthenticated) {
        setIsWishlisted(isGuestWishlistItem(productId));
        return;
      }

      try {
        const response = await wishlistAPI.getWishlist();
        const payload = response?.data ?? response;
        const items = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

        const ids = items
          .map((item: any) => String(item?.product?._id || item?.productId || item?.product?.id || item?._id || item?.id || ''))
          .filter(Boolean);

        if (active) {
          setIsWishlisted(ids.includes(productId));
        }
      } catch (error) {
        console.error('Failed to sync wishlist state:', error);
        if (active) {
          setIsWishlisted(false);
        }
      }
    };

    syncWishlistState();

    return () => {
      active = false;
    };
  }, [isAuthenticated, productId]);

  const handleToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!productId || disabled || isPending) {
      return;
    }

    setIsPending(true);

    try {
      if (!isAuthenticated) {
        if (isWishlisted) {
          removeGuestWishlistItem(productId);
          setIsWishlisted(false);
          toast.success(`Removed ${productName} from your wishlist`);
        } else {
          addGuestWishlistItem(product);
          setIsWishlisted(true);
          toast.success(`Added ${productName} to your wishlist`);
        }
        return;
      }

      if (isWishlisted) {
        await wishlistAPI.removeFromWishlist(productId);
        setIsWishlisted(false);
        toast.success(`Removed ${productName} from your wishlist`);
      } else {
        await wishlistAPI.addToWishlist(productId);
        setIsWishlisted(true);
        toast.success(`Added ${productName} to your wishlist`);
      }
    } catch (error) {
      console.error('Wishlist toggle failed:', error);
      toast.error(`Unable to update your wishlist for ${productName}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled || isPending}
      aria-label={isWishlisted ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      className={`group inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70 focus-visible:ring-offset-2 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 ${className} ${isWishlisted ? 'border-rose-200 bg-rose-50 text-rose-600 shadow-[0_10px_20px_rgba(244,63,94,0.12)]' : ''}`.trim()}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-5 w-5 transition-all duration-200 ${isWishlisted ? 'fill-rose-500 text-rose-500 scale-110' : 'group-hover:text-rose-500'}`} />
      )}
    </button>
  );
}
