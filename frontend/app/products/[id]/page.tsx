'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { productAPI, reviewAPI } from '@/services/api';
import { useCartStore } from '@/context/cartStore';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingCart, Star, Tag } from 'lucide-react';

const normalizeImageUrl = (image: any): string => {
  if (!image) return '';
  if (typeof image === 'string') return image;
  if (typeof image === 'object') {
    return image.url || image.secure_url || image.path || image.src || image.thumbnail || image.image || '';
  }
  return '';
};

const getGalleryImages = (productData: any) => {
  const candidates: any[] = [];

  if (Array.isArray(productData?.images)) {
    candidates.push(...productData.images);
  } else if (productData?.images) {
    candidates.push(productData.images);
  }

  if (productData?.image) candidates.push(productData.image);
  if (productData?.thumbnail) candidates.push(productData.thumbnail);

  const normalizedUrls = candidates
    .flatMap((entry) => {
      if (Array.isArray(entry)) {
        return entry.map(normalizeImageUrl).filter(Boolean);
      }
      return [normalizeImageUrl(entry)].filter(Boolean);
    })
    .filter(Boolean);

  return Array.from(new Set(normalizedUrls));
};

export default function ProductDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('/placeholder.jpg');
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { addItem } = useCartStore();

  useEffect(() => {
    if (!id) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        const [productResult, reviewsResult] = await Promise.all([
          productAPI.getById(id),
          reviewAPI.getByProduct(id),
        ]);
        const payload = productResult.data;
        const nextProduct = payload?.data ?? payload ?? null;
        const reviewsPayload = reviewsResult?.data ?? reviewsResult;
        const nextReviews = Array.isArray(reviewsPayload?.data)
          ? reviewsPayload.data
          : Array.isArray(reviewsPayload)
            ? reviewsPayload
            : [];
        setProduct(nextProduct);
        setReviews(Array.isArray(nextReviews) ? nextReviews : []);
      } catch (error) {
        console.error('Failed to load product:', error);
        toast.error('Unable to load product details.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;

    const galleryImages = getGalleryImages(product);
    const nextMainImage = galleryImages[0] || '/placeholder.jpg';
    setSelectedImage(nextMainImage);
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    const galleryImages = getGalleryImages(product);
    const productImage = galleryImages[0] || product.thumbnail || product.image || '/placeholder.jpg';
    if (product.quantity === 0) {
      toast.error('This product is currently out of stock.');
      return;
    }

    addItem({
      productId: product._id,
      name: product.name,
      price,
      quantity: 1,
      image: productImage,
      description: product.description,
      category: typeof product.category === 'string' ? product.category : product.category?.name || 'Uncategorized',
      sku: product.sku,
      weight: product.weight,
      stock: product.quantity,
      thumbnail: productImage,
      images: galleryImages,
      discountPrice: product.discountPrice,
      compareAtPrice: product.price,
      onSale: saleActive,
      rating: product.rating,
      reviewCount: product.reviewCount,
      packaging: product.packaging,
      origin: product.origin,
    });
    toast.success('Added to cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navigation />
        <main className="flex min-h-[60vh] items-center justify-center py-20">
          <div className="text-center text-lg text-slate-700">Loading product details...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navigation />
        <main className="flex min-h-[60vh] items-center justify-center py-20">
          <div className="text-center space-y-4">
            <p className="text-lg font-semibold text-slate-900">Product not found</p>
            <Link href="/products" className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90">
              Back to products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const now = Date.now();
  const onSale = !!product.onSale;
  const saleStart = product.saleStart ? new Date(product.saleStart).getTime() : null;
  const saleEnd = product.saleEnd ? new Date(product.saleEnd).getTime() : null;
  const saleActive = onSale && (!saleStart || saleStart <= now) && (!saleEnd || saleEnd >= now) && product.discountPrice;
  const price = Number(saleActive ? product.discountPrice : product.price || 0);
  const compareAtPrice = Number(product.price || 0);
  const galleryImages = getGalleryImages(product);
  const productImage = galleryImages[0] || product.thumbnail || product.image || '/placeholder.jpg';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Navigation />
      <main className="flex-grow py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-secondary">
                <ArrowLeft className="w-4 h-4" /> Back to products
              </Link>
              <h1 className="text-4xl font-bold text-slate-950">{product.name}</h1>
              <p className="text-sm text-muted-foreground">{typeof product.category === 'string' ? product.category : product.category?.name || 'Uncategorized'}</p>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              <ShoppingCart className="w-4 h-4" /> Add to cart
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="h-[320px] w-full object-cover sm:h-[460px] lg:h-[520px]"
                />
              </div>

              {galleryImages.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {galleryImages.map((imageUrl: string, index: number) => (
                    <button
                      key={`${imageUrl}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(imageUrl)}
                      className={`h-20 w-20 overflow-hidden rounded-2xl border-2 bg-white p-1 shadow-sm transition ${selectedImage === imageUrl ? 'border-secondary' : 'border-transparent'}`}
                    >
                      <img src={imageUrl} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-950 mb-4">Product Details</h2>
                {saleActive && (
                  <div className="mb-4 inline-flex rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">
                    Sale active
                  </div>
                )}
                <p className="text-base leading-8 text-slate-700 whitespace-pre-line">{product.description || 'No description available for this product.'}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Price</p>
                    <div className="mt-2">
                      {saleActive ? (
                        <div className="space-y-1">
                          <p className="text-3xl font-bold text-secondary">Rs {price.toFixed(0)}</p>
                          <p className="text-sm text-slate-500 line-through">Rs {compareAtPrice.toFixed(0)}</p>
                        </div>
                      ) : (
                        <p className="text-3xl font-bold text-secondary">Rs {price.toFixed(0)}</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Stock</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{product.quantity ?? 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-950 mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <span>Category</span>
                    <span className="font-semibold text-slate-900">{typeof product.category === 'string' ? product.category : product.category?.name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Weight</span>
                    <span className="font-semibold text-slate-900">
                      {product.weight ? `${product.weight} ${product.weightUnit || 'g'}` : '250 g'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>SKU</span>
                    <span className="font-semibold text-slate-900">{product.sku || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-secondary">
                  <Tag className="w-4 h-4" /> Features
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  {(product.tags || ['Premium quality', 'Naturally preserved', 'Handpicked']).map((tag: string, index: number) => (
                    <li key={index} className="rounded-2xl bg-slate-50 px-4 py-3">{tag}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-slate-950">Customer Reviews</h3>
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                    <Star className="h-4 w-4 fill-current" /> {reviews.length}
                  </div>
                </div>
                {reviews.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-600">No reviews yet for this product.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {reviews.slice(0, 3).map((review: any) => (
                      <div key={review._id || review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-950">{review.title || 'Review'}</p>
                          <span className="text-sm font-semibold text-amber-700">{review.rating || 5} ★</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{review.comment || 'No comment provided.'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
