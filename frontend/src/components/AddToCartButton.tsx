'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/context/cartStore';

interface AddToCartButtonProps {
  product: any;
  price?: number;
  image?: string;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  compact?: boolean;
  disabled?: boolean;
  onAdded?: () => void;
}

export default function AddToCartButton({
  product,
  price,
  image,
  className = '',
  iconClassName = '',
  labelClassName = '',
  compact = false,
  disabled = false,
  onAdded,
}: AddToCartButtonProps) {
  const { addItem } = useCartStore();
  const [isPending, setIsPending] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;

    const timer = window.setTimeout(() => setJustAdded(false), 1200);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  const handleAddToCart = () => {
    if (!product || disabled || isPending) return;

    if (Number(product.quantity ?? 0) === 0) {
      toast.error('This product is currently out of stock.');
      return;
    }

    setIsPending(true);
    const normalizedPrice = Number(price ?? product?.computedPrice ?? product?.discountPrice ?? product?.price ?? 0);
    const normalizedImage = image || product?.thumbnail || product?.image || product?.images?.[0]?.url || '/placeholder.jpg';

    // Only store minimal data to avoid localStorage quota exceeded errors
    addItem({
      productId: product._id || product.id,
      name: product.name,
      price: normalizedPrice,
      quantity: 1,
      image: normalizedImage,
    });

    toast.success('Added to cart', {
      description: product.name,
      duration: 1600,
    });

    setJustAdded(true);
    onAdded?.();

    window.setTimeout(() => setIsPending(false), 180);
  };

  const isBusy = isPending || justAdded;
  const label = justAdded ? 'Added ✓' : 'Add to cart';

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || isBusy}
        aria-label={`Add ${product?.name || 'product'} to cart`}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      >
        {isPending ? <Loader2 className={`h-4 w-4 animate-spin ${iconClassName}`} /> : justAdded ? <Check className={`h-4 w-4 ${iconClassName}`} /> : <ShoppingCart className={`h-4 w-4 ${iconClassName}`} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={disabled || isBusy}
      aria-label={`Add ${product?.name || 'product'} to cart`}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-secondary/40 bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
    >
      {isPending ? <Loader2 className={`h-4 w-4 animate-spin ${iconClassName}`} /> : justAdded ? <Check className={`h-4 w-4 ${iconClassName}`} /> : <ShoppingCart className={`h-4 w-4 ${iconClassName}`} />}
      <span className={labelClassName}>{label}</span>
    </button>
  );
}
