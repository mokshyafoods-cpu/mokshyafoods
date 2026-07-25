'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { orderAPI, reviewAPI } from '@/services/api';
import { toast } from 'sonner';
import { ExternalLink, Pencil, Star, Trash2, CircleCheckBig } from 'lucide-react';

const emptyForm = {
  productId: '',
  rating: 5,
  title: '',
  comment: '',
};

export default function ReviewsPage() {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingReviewId, setSavingReviewId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadReviewData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [reviewsResponse, ordersResponse] = await Promise.all([
        reviewAPI.getUserReviews(),
        orderAPI.getAll(),
      ]);

      const reviewsBody = reviewsResponse?.data ?? reviewsResponse;
      const ordersBody = ordersResponse?.data ?? ordersResponse;
      const reviewsPayload = Array.isArray(reviewsBody?.data) ? reviewsBody.data : Array.isArray(reviewsBody) ? reviewsBody : [];
      const ordersPayload = Array.isArray(ordersBody?.data) ? ordersBody.data : Array.isArray(ordersBody) ? ordersBody : [];

      setReviews(Array.isArray(reviewsPayload) ? reviewsPayload : []);
      setOrders(Array.isArray(ordersPayload) ? ordersPayload : []);
    } catch (err: any) {
      console.error('Failed to load reviews or orders:', err);
      setError('Unable to load your reviews right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setReviews([]);
      setOrders([]);
      return;
    }

    void loadReviewData();
  }, [isAuthenticated]);

  const orderedProducts = useMemo(() => {
    const productMap = new Map<string, { id: string; name: string }>();

    orders.forEach((order) => {
      order.items?.forEach((item: any) => {
        const product = item.product || item;
        const id = product?._id || product?.id;
        if (!id || productMap.has(id)) return;

        productMap.set(id, {
          id,
          name: product?.name || 'Unknown Product',
        });
      });
    });

    return Array.from(productMap.values());
  }, [orders]);

  const verifiedPurchaseProducts = useMemo(() => {
    const ids = new Set<string>();
    orders.forEach((order) => {
      order.items?.forEach((item: any) => {
        const product = item.product || item;
        const id = product?._id || product?.id;
        if (id) ids.add(String(id));
      });
    });
    return ids;
  }, [orders]);

  const reviewByProductId = useMemo(() => {
    const map: Record<string, any> = {};
    reviews.forEach((review) => {
      const id = review.productId || review.product?._id;
      if (id) map[String(id)] = review;
    });
    return map;
  }, [reviews]);

  useEffect(() => {
    if (!formData.productId && orderedProducts.length > 0) {
      setFormData((current) => ({ ...current, productId: orderedProducts[0].id }));
    }
  }, [orderedProducts, formData.productId]);

  const resetForm = () => {
    setEditingReviewId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.productId) {
      toast.error('Please select a product to review.');
      return;
    }

    setSubmitting(true);

    try {
      const response = editingReviewId
        ? await reviewAPI.update(editingReviewId, {
            productId: formData.productId,
            rating: formData.rating,
            title: formData.title,
            comment: formData.comment,
          })
        : await reviewAPI.create({
            productId: formData.productId,
            rating: formData.rating,
            title: formData.title,
            comment: formData.comment,
          });

      const successMessage = response?.data?.message || (editingReviewId ? 'Review updated successfully.' : 'Review submitted successfully.');
      toast.success(successMessage);
      resetForm();
      await loadReviewData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review: any) => {
    setEditingReviewId(review._id);
    setFormData({
      productId: review.productId || review.product?._id || '',
      rating: review.rating || 5,
      title: review.title || '',
      comment: review.comment || '',
    });
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    setDeletingReviewId(reviewId);
    try {
      await reviewAPI.delete(reviewId);
      toast.success('Review deleted.');
      await loadReviewData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete review.');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const existingReviewForSelectedProduct = formData.productId ? reviewByProductId[String(formData.productId)] : null;

  return (
    <section className="space-y-8 px-4 py-8 lg:px-0">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">My Reviews</h1>
              <p className="mt-2 text-sm text-slate-600">Manage your feedback and keep one review per product.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
              <Star className="h-4 w-4 text-amber-500" /> {reviews.length} total review{reviews.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              {loading ? (
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">Loading your reviews…</div>
              ) : error ? (
                <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">{error}</div>
              ) : reviews.length === 0 ? (
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
                  <p className="text-lg font-semibold">You haven&apos;t written any reviews yet.</p>
                  <p className="mt-2">Once you place an order, you can add feedback for your purchases here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const isVerifiedPurchase = Boolean(review.product?._id && verifiedPurchaseProducts.has(String(review.product._id)));
                    return (
                      <div key={review._id} className="rounded-[1.75rem] border border-slate-200 p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex gap-3">
                            <img
                              src={review.product?.thumbnail || '/placeholder.jpg'}
                              alt={review.product?.name || 'Product image'}
                              className="h-16 w-16 rounded-2xl object-cover"
                            />
                            <div>
                              <p className="text-sm text-slate-500">{review.product?.name || 'Product review'}</p>
                              <h2 className="text-lg font-semibold text-slate-950">{review.title}</h2>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700">{review.rating} ★</span>
                                {isVerifiedPurchase && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                                    <CircleCheckBig className="h-4 w-4" /> Verified purchase
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(review)}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(review._id)}
                              disabled={deletingReviewId === review._id}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" /> {deletingReviewId === review._id ? 'Deleting...' : 'Delete'}
                            </button>
                            {review.product?._id && (
                              <Link
                                href={`/products/${review.product._id}`}
                                className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                              >
                                <ExternalLink className="h-4 w-4" /> View Product
                              </Link>
                            )}
                          </div>
                        </div>

                        <p className="mt-4 text-slate-700">{review.comment}</p>
                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          <span className="rounded-full border border-slate-200 px-3 py-1">{review.status || 'approved'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-950">{editingReviewId ? 'Edit Review' : 'Write or Update a Review'}</h2>
              <p className="mt-2 text-sm text-slate-600">Choose a purchased product and share your experience. Each user can keep one review per product.</p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Product</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                    disabled={orderedProducts.length === 0}
                  >
                    {orderedProducts.length === 0 ? (
                      <option value="">No ordered products available</option>
                    ) : (
                      orderedProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {existingReviewForSelectedProduct && !editingReviewId && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    You already reviewed this product. Your new submission will update the existing review.
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Rating</label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} stars
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Review Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                    placeholder="Short summary of your experience"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Comments</label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    className="w-full min-h-[130px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                    placeholder="Tell others what you liked and what could improve"
                    required
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={submitting || orderedProducts.length === 0}
                    className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingReviewId ? 'Save Changes' : 'Submit Review'}
                  </button>
                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {orderedProducts.length === 0 && (
                <p className="mt-4 text-sm text-slate-600">
                  You can review products after placing an order. Visit your order history to choose a product.
                </p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
