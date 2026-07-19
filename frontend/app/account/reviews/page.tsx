'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { orderAPI, reviewAPI } from '@/services/api';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

export default function ReviewsPage() {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    rating: 5,
    title: '',
    comment: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadReviewData = async () => {
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

    loadReviewData();
  }, [isAuthenticated]);

  const orderedProducts = useMemo(() => {
    const productMap = new Map<string, { id: string; name: string }>();

    orders.forEach((order) => {
      order.items?.forEach((item: any) => {
        const product = item.product;
        if (!product) return;

        const id = product._id || product.id;
        if (!id || productMap.has(id)) return;

        productMap.set(id, {
          id,
          name: product.name || 'Unknown Product',
        });
      });
    });

    return Array.from(productMap.values());
  }, [orders]);

  useEffect(() => {
    if (!formData.productId && orderedProducts.length > 0) {
      setFormData((current) => ({ ...current, productId: orderedProducts[0].id }));
    }
  }, [orderedProducts, formData.productId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.productId) {
      toast.error('Please select a product to review.');
      return;
    }

    setSubmitting(true);

    try {
      await reviewAPI.create({
        productId: formData.productId,
        rating: formData.rating,
        title: formData.title,
        comment: formData.comment,
      });

      toast.success('Review submitted successfully. It may appear here once approved.');
      setFormData((current) => ({ ...current, title: '', comment: '' }));
      const response = await reviewAPI.getUserReviews();
      const body = response?.data ?? response;
      const payload = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
      setReviews(Array.isArray(payload) ? payload : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-8 px-4 py-8 lg:px-0">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">My Reviews</h1>
            <p className="mt-2 text-sm text-slate-600">Manage your feedback and submit reviews for products you’ve purchased.</p>
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
                <p className="text-lg font-semibold">No reviews yet</p>
                <p className="mt-2">After you purchase a product, you can leave feedback here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="rounded-[1.75rem] border border-slate-200 p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{review.product?.name || 'Product review'}</p>
                        <h2 className="text-xl font-semibold text-slate-950">{review.title}</h2>
                      </div>
                      <div className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">{review.rating} ★</div>
                    </div>
                    <p className="mt-4 text-slate-700">{review.comment}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      <span className="rounded-full border border-slate-200 px-3 py-1">{review.status || 'pending'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-950">Write a Review</h2>
            <p className="mt-2 text-sm text-slate-600">Choose a product you’ve ordered and share your experience.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Product</label>
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

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Rating</label>
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Review Title</label>
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Comments</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full min-h-[130px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  placeholder="Tell others what you liked and what could improve"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || orderedProducts.length === 0}
                className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
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
