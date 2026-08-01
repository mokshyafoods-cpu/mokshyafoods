'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { orderAPI, productAPI, reviewAPI } from '@/services/api';
import { toast } from 'sonner';
import { ArrowLeft, Star, Tag, Percent } from 'lucide-react';
import { buildProductJsonLd } from '@/lib/seo';
import { getProductSlug } from '@/lib/productRoutes';
import WishlistButton from '@/components/WishlistButton';
import AddToCartButton from '@/components/AddToCartButton';

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

const normalizeReviewPayload = (payload: any) => {
  const reviewsPayload = payload?.data ?? payload ?? [];
  return Array.isArray(reviewsPayload) ? reviewsPayload : [];
};

const normalizeReviewPagination = (payload: any) => payload?.pagination ?? payload?.meta ?? {};
const normalizeReviewSummary = (payload: any) => payload?.summary ?? payload?.stats ?? null;

const getReviewAuthorName = (review: any) => review?.user?.name || review?.user?.fullName || review?.user?.displayName || review?.userName || review?.name || 'Customer';
const getReviewAuthorAvatar = (review: any) => review?.user?.avatar || review?.user?.profileImage || review?.user?.photo || review?.avatar || review?.profileImage || '/placeholder.jpg';
const getReviewText = (review: any) => review?.comment || review?.text || review?.review || 'No comment provided.';

export default function ProductDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [productId, setProductId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('/placeholder.jpg');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSorting, setReviewSorting] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [visibleReviewCount, setVisibleReviewCount] = useState(6);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [verifiedPurchase, setVerifiedPurchase] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewHasMore, setReviewHasMore] = useState(false);
  const [reviewLoadingMore, setReviewLoadingMore] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<any>(null);
  const [reviewTotal, setReviewTotal] = useState(0);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const currentUserId = user?._id || user?.id || '';
  const myReview = useMemo(() => {
    if (!currentUserId) return null;
    return reviews.find((review: any) => {
      const reviewUserId = review?.userId || review?.user?._id || review?.user?.id || '';
      return reviewUserId === currentUserId;
    }) || null;
  }, [currentUserId, reviews]);

  const reviewStats = useMemo(() => {
    const total = reviewSummary?.total ?? reviewTotal ?? reviews.length;
    const average = reviewSummary?.average ?? (total > 0
      ? reviews.reduce((sum, review: any) => sum + Number(review.rating || 0), 0) / total
      : 0);

    const distribution = reviewSummary?.distribution ?? [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((review: any) => Number(review.rating || 0) === star).length;
      return {
        star,
        count,
        percent: total > 0 ? (count / total) * 100 : 0,
      };
    });

    return { average, total, distribution };
  }, [reviewSummary, reviewTotal, reviews]);

  const sortedReviews = useMemo(() => {
    const nextReviews = [...reviews];
    if (reviewSorting === 'highest') {
      nextReviews.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (reviewSorting === 'lowest') {
      nextReviews.sort((a, b) => Number(a.rating || 0) - Number(b.rating || 0));
    } else {
      nextReviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    return nextReviews;
  }, [reviewSorting, reviews]);

  const visibleReviews = useMemo(() => sortedReviews.slice(0, visibleReviewCount), [sortedReviews, visibleReviewCount]);

  const loadReviews = async (productIdToUse: string, page = 1, append = false) => {
    if (!isAuthenticated) {
      setReviews([]);
      setReviewHasMore(false);
      setReviewSummary(null);
      setReviewTotal(0);
      return;
    }

    try {
      const reviewsResult = await reviewAPI.getByProduct(productIdToUse, { page, limit: 6 });
      const payload = reviewsResult?.data ?? reviewsResult;
      const nextReviews = normalizeReviewPayload(payload);
      const pagination = normalizeReviewPagination(payload);
      const summary = normalizeReviewSummary(payload);

      setReviews((current) => append ? [...current, ...nextReviews] : nextReviews);
      setReviewPage(page);
      setReviewHasMore(Boolean(pagination?.hasMore));
      setReviewSummary(summary);
      setReviewTotal(Number(pagination?.total || summary?.total || nextReviews.length || 0));
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast.error('Unable to load reviews.');
    }
  };

  useEffect(() => {
    if (!id) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        const productResult = await productAPI.getById(id);
        const payload = productResult.data;
        const nextProduct = payload?.data ?? payload ?? null;
        const nextProductId = String(nextProduct?._id || nextProduct?.id || id || '');

        setProduct(nextProduct);
        setProductId(nextProductId);
        setReviews([]);
        setVisibleReviewCount(6);
        setReviewPage(1);
        setReviewHasMore(false);
        setReviewSummary(null);
        setReviewTotal(0);
        await loadReviews(nextProductId || id, 1, false);
      } catch (error) {
        console.error('Failed to load product:', error);
        toast.error('Unable to load product details.');
      } finally {
        setLoading(false);
      }
    };

    setVisibleReviewCount(6);
    setShowReviewForm(false);
    setEditingReviewId(null);
    setReviewComment('');
    setReviewRating(5);
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;

    const galleryImages = getGalleryImages(product);
    const nextMainImage = galleryImages[0] || '/placeholder.jpg';
    setSelectedImage(nextMainImage);
  }, [product]);

  useEffect(() => {
    if (!isAuthenticated || !id || !user) {
      setVerifiedPurchase(false);
      return;
    }

    let active = true;

    const checkVerifiedPurchase = async () => {
      try {
        const response = await orderAPI.getAll({ limit: 100 });
        const payload = response?.data ?? response;
        const orders = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.data?.data)
            ? payload.data.data
            : Array.isArray(payload)
              ? payload
              : [];

        const hasPurchasedProduct = orders.some((order: any) => {
          const items = Array.isArray(order?.items) ? order.items : [];
          return items.some((item: any) => String(item?.product?._id || item?.productId || item?.product?.id || '') === String(id));
        });

        if (active) setVerifiedPurchase(hasPurchasedProduct);
      } catch (error) {
        console.warn('Failed to verify purchase history:', error);
        if (active) setVerifiedPurchase(false);
      }
    };

    checkVerifiedPurchase();

    return () => {
      active = false;
    };
  }, [id, isAuthenticated, user?._id, user?.id]);

  const refreshReviews = async () => {
    if (!productId) return;
    setVisibleReviewCount(6);
    await loadReviews(productId, 1, false);
  };

  const handleLoadMoreReviews = async () => {
    if (!productId || reviewLoadingMore || !reviewHasMore) return;

    setReviewLoadingMore(true);
    try {
      await loadReviews(productId, reviewPage + 1, true);
      setVisibleReviewCount((count) => count + 6);
    } finally {
      setReviewLoadingMore(false);
    }
  };

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login first to submit a review.');
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Please share a short comment to submit your review.');
      return;
    }

    try {
      setReviewSubmitting(true);

      if (editingReviewId && myReview) {
        await reviewAPI.update(editingReviewId, {
          rating: reviewRating,
          comment: reviewComment.trim(),
        });
        toast.success('Your review has been updated.');
      } else {
        await reviewAPI.create({
          productId: productId || id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        });
        toast.success('Your review has been submitted.');
      }

      await refreshReviews();
      setReviewComment('');
      setReviewRating(5);
      setShowReviewForm(false);
      setEditingReviewId(null);
      setVisibleReviewCount(6);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleEditReview = () => {
    if (!myReview) return;
    setEditingReviewId(myReview._id || myReview.id);
    setReviewRating(Number(myReview.rating || 5));
    setReviewComment(getReviewText(myReview));
    setShowReviewForm(true);
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;
    if (typeof window !== 'undefined' && !window.confirm('Delete your review?')) return;

    try {
      await reviewAPI.delete(myReview._id || myReview.id);
      await refreshReviews();
      setShowReviewForm(false);
      setEditingReviewId(null);
      setReviewComment('');
      setReviewRating(5);
      toast.success('Your review has been deleted.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete review.');
    }
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
  const discountPercentage = saleActive && compareAtPrice > 0 
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) 
    : 0;
  const galleryImages = getGalleryImages(product);
  const productImage = galleryImages[0] || product.thumbnail || product.image || '/placeholder.jpg';
  const slug = getProductSlug(product, id);
  const productJsonLd = buildProductJsonLd(product, `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.mokshyafoods.com.np'}/products/${slug}`);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
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
            <div className="flex items-center gap-3">
              <WishlistButton product={product} className="h-11 w-11" iconClassName="h-5 w-5" />
              <AddToCartButton product={product} price={price} image={productImage} className="rounded-full px-4 py-2.5 text-xs sm:px-6 sm:py-3 sm:text-sm" />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="order-1 space-y-6 lg:order-none">
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
                <h2 className="mb-4 text-2xl font-semibold text-slate-950">Product Description</h2>
                {saleActive && (
                  <div className="mb-4 inline-flex rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">
                    Sale active
                  </div>
                )}
                <p className="text-base leading-8 whitespace-pre-line text-slate-700">
                  {product.description || 'No description available for this product.'}
                </p>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                  <p>Made with care and prepared for daily enjoyment, this product brings the natural flavor of Nepali produce into a convenient, pantry-friendly format.</p>
                  <p className="mt-2">Whether you are sharing it with family or enjoying a quick snack at home, it offers a simple, wholesome choice for busy routines.</p>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Price</p>
                    <div className="mt-2">
                      {saleActive ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <p className="text-3xl font-bold text-secondary">RS {price.toFixed(0)}</p>
                            {discountPercentage > 0 && (
                              <div className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">
                                <Percent className="h-3 w-3" /> {discountPercentage}% OFF
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 line-through">RS {compareAtPrice.toFixed(0)}</p>
                        </div>
                      ) : (
                        <p className="text-3xl font-bold text-secondary">RS {price.toFixed(0)}</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Stock</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{product.quantity ?? 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-secondary">
                      <Star className="h-4 w-4 fill-current" /> Customer Reviews
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-950">What customers are saying</h2>
                    <p className="mt-2 text-sm text-slate-600">Trusted feedback from shoppers who have tried this product.</p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
                    <div className="text-3xl font-semibold text-slate-950">{reviewStats.average.toFixed(1)}</div>
                    <div className="mt-1 flex items-center justify-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className={`h-4 w-4 ${index < Math.round(reviewStats.average) ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{reviewStats.total} review{reviewStats.total === 1 ? '' : 's'}</div>
                  </div>
                </div>

                {!isAuthenticated ? (
                  <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-lg font-semibold text-slate-900">Please sign in to view customer reviews</p>
                    <p className="mt-2 text-sm text-slate-600">Reviews are visible to signed-in customers only.</p>
                    <div className="mt-3">
                      <Link href={`/auth/login?redirect=/products/${id}`} className="inline-flex font-semibold text-primary hover:text-secondary">Sign in to view reviews</Link>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Overall rating</p>
                          <p className="mt-1 text-sm text-slate-600">Based on {reviewStats.total} customer reviews</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-semibold text-slate-950">{reviewStats.average.toFixed(1)}</p>
                          <p className="text-sm text-slate-500">out of 5</p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {reviewStats.distribution.map((item) => (
                          <div key={item.star} className="flex items-center gap-3">
                            <span className="w-10 text-sm font-semibold text-slate-600">{item.star}★</span>
                            <div className="h-2.5 flex-1 rounded-full bg-slate-200">
                              <div className="h-2.5 rounded-full bg-amber-500" style={{ width: `${item.percent}%` }} />
                            </div>
                            <span className="w-10 text-right text-sm text-slate-500">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-slate-600">Sort reviews</div>
                        <select
                          value={reviewSorting}
                          onChange={(event) => {
                            setReviewSorting(event.target.value as 'recent' | 'highest' | 'lowest');
                            setVisibleReviewCount(6);
                          }}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        >
                          <option value="recent">Most Recent</option>
                          <option value="highest">Highest Rating</option>
                          <option value="lowest">Lowest Rating</option>
                        </select>
                      </div>

                      {isAuthenticated ? (
                        myReview ? (
                          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-semibold text-emerald-900">Your review</p>
                                <p className="text-sm text-emerald-700">You already shared feedback for this product.</p>
                              </div>
                            </div>
                            <div className="mt-3 rounded-[1.25rem] border border-white/80 bg-white/80 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <img src={getReviewAuthorAvatar(myReview)} alt={getReviewAuthorName(myReview)} className="h-11 w-11 rounded-full object-cover" />
                                  <div>
                                    <p className="font-semibold text-slate-900">{getReviewAuthorName(myReview)}</p>
                                    <p className="text-sm text-slate-500">{new Date(myReview.createdAt || Date.now()).toLocaleDateString('en-IN')}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-sm font-semibold text-amber-700">
                                  <Star className="h-4 w-4 fill-current" /> {Number(myReview.rating || 0)}
                                </div>
                              </div>
                              <p className="mt-3 text-sm leading-7 text-slate-700">{getReviewText(myReview)}</p>
                              {verifiedPurchase && (
                                <span className="mt-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                                  Verified Purchase
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setShowReviewForm(true);
                              setEditingReviewId(null);
                              setReviewComment('');
                              setReviewRating(5);
                            }}
                            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
                          >
                            Write a Review
                          </button>
                        )
                      ) : (
                        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                          <p className="font-semibold text-slate-900">Please login first</p>
                          <p className="mt-1">You need to sign in before you can submit a review for this product.</p>
                          <Link href={`/auth/login?redirect=/products/${id}`} className="mt-3 inline-flex font-semibold text-primary hover:text-secondary">
                            Sign in now
                          </Link>
                        </div>
                      )}

                      {showReviewForm && (
                        <form onSubmit={handleReviewSubmit} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">{editingReviewId ? 'Edit your review' : 'Share your experience'}</p>
                            <button type="button" onClick={() => { setShowReviewForm(false); setEditingReviewId(null); setReviewComment(''); setReviewRating(5); }} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
                              Cancel
                            </button>
                          </div>
                          <div className="mt-4 flex items-center gap-2">
                            {Array.from({ length: 5 }).map((_, index) => {
                              const starValue = index + 1;
                              return (
                                <button
                                  key={starValue}
                                  type="button"
                                  onClick={() => setReviewRating(starValue)}
                                  className="text-2xl text-amber-500"
                                >
                                  <Star className={starValue <= reviewRating ? 'fill-current' : ''} />
                                </button>
                              );
                            })}
                          </div>
                          <textarea
                            value={reviewComment}
                            onChange={(event) => setReviewComment(event.target.value)}
                            rows={5}
                            className="mt-4 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            placeholder="Tell others what you liked, what worked well, or what could be improved."
                          />
                          <div className="mt-4 flex justify-end">
                            <button type="submit" disabled={reviewSubmitting} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
                              {reviewSubmitting ? 'Saving...' : editingReviewId ? 'Update Review' : 'Submit Review'}
                            </button>
                          </div>
                        </form>
                      )}

                      {sortedReviews.length === 0 ? (
                        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                          <p className="text-lg font-semibold text-slate-900">Be the first to review this product.</p>
                          <p className="mt-2 text-sm text-slate-600">Share your experience and help other customers make a confident choice.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {visibleReviews.map((review: any) => (
                            <div key={review._id || review.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <img src={getReviewAuthorAvatar(review)} alt={getReviewAuthorName(review)} className="h-11 w-11 rounded-full object-cover" />
                                  <div>
                                    <p className="font-semibold text-slate-900">{getReviewAuthorName(review)}</p>
                                    <p className="text-sm text-slate-500">{new Date(review.createdAt || Date.now()).toLocaleDateString('en-IN')}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-sm font-semibold text-amber-700">
                                  <Star className="h-4 w-4 fill-current" /> {Number(review.rating || 0)}
                                </div>
                              </div>
                              <p className="mt-3 text-sm leading-7 text-slate-700">{getReviewText(review)}</p>
                              {verifiedPurchase && (review.userId === currentUserId || review.user?._id === currentUserId || review.user?.id === currentUserId) && (
                                <span className="mt-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                                  Verified Purchase
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {reviewHasMore && (
                        <button type="button" onClick={handleLoadMoreReviews} disabled={reviewLoadingMore} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                          {reviewLoadingMore ? 'Loading reviews...' : `Load More Reviews (${Math.max(0, reviewTotal - visibleReviewCount)} left)`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <aside className="order-2 space-y-6 lg:order-none">
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

              {user?.role === 'admin' && (
                <div className="rounded-[2rem] border border-blue-200 bg-blue-50 p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-blue-950 mb-4">Admin: Pricing & Discount Info</h3>
                  <div className="space-y-3 text-sm text-blue-900">
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-blue-200">
                      <span className="font-semibold">Original Price:</span>
                      <span className="font-bold text-lg">RS {compareAtPrice.toFixed(0)}</span>
                    </div>
                    {saleActive && (
                      <>
                        <div className="flex items-center justify-between gap-3 pb-3 border-b border-blue-200">
                          <span className="font-semibold">Sale Price:</span>
                          <span className="font-bold text-lg text-green-600">RS {price.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 pb-3 border-b border-blue-200">
                          <span className="font-semibold">Discount Amount:</span>
                          <span className="font-bold text-lg text-red-600">RS {(compareAtPrice - price).toFixed(0)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">Discount Percentage:</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 font-bold text-red-700">
                            <Percent className="h-4 w-4" /> {discountPercentage}% OFF
                          </span>
                        </div>
                        {product.saleStart && (
                          <div className="text-xs text-blue-700 pt-2 border-t border-blue-200">
                            <p>Sale starts: {new Date(product.saleStart).toLocaleString()}</p>
                          </div>
                        )}
                        {product.saleEnd && (
                          <div className="text-xs text-blue-700">
                            <p>Sale ends: {new Date(product.saleEnd).toLocaleString()}</p>
                          </div>
                        )}
                      </>
                    )}
                    {!saleActive && (
                      <div className="text-sm text-blue-700 italic">
                        No active sale for this product
                      </div>
                    )}
                  </div>
                </div>
              )}

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


            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
