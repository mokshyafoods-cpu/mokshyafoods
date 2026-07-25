'use client';

import { useEffect, useMemo, useState } from 'react';
import { reviewAPI } from '@/services/api';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getAllAdmin();
      const payload = response?.data ?? response;
      const nextReviews = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setReviews(nextReviews);
    } catch (error) {
      console.error('Failed to load reviews', error);
      toast.error('Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reviews;

    return reviews.filter((review) => {
      const userName = review?.user?.name || review?.user?.fullName || review?.user?.displayName || 'Customer';
      const productName = review?.product?.name || 'Unknown product';
      const text = `${review?.title || ''} ${review?.comment || ''} ${userName} ${productName}`.toLowerCase();
      return text.includes(query);
    });
  }, [reviews, search]);

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Delete this review?')) return;

    try {
      await reviewAPI.delete(reviewId);
      setReviews((current) => current.filter((review) => review._id !== reviewId));
      toast.success('Review deleted');
    } catch (error) {
      console.error('Failed to delete review', error);
      toast.error('Unable to delete review.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/70 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Reviews</p>
        <h1 className="mt-2 text-3xl font-semibold">Customer reviews</h1>
        <p className="mt-2 text-sm text-slate-400">View all customer reviews with user and product details.</p>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">All reviews</h2>
            <p className="text-sm text-slate-500">{reviews.length} total review{reviews.length === 1 ? '' : 's'}</p>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by user, product, or review"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 md:max-w-sm"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">Loading reviews...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">No reviews found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-3 py-3 font-semibold">User</th>
                  <th className="px-3 py-3 font-semibold">Product</th>
                  <th className="px-3 py-3 font-semibold">Review</th>
                  <th className="px-3 py-3 font-semibold">Rating</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => {
                  const user = review?.user || {};
                  const product = review?.product || {};
                  const reviewText = review?.comment || review?.title || 'No comment provided.';

                  return (
                    <tr key={review._id} className="border-b border-slate-200 align-top text-slate-700">
                      <td className="px-3 py-4">
                        <div className="font-semibold text-slate-900">{user.name || user.fullName || user.displayName || 'Customer'}</div>
                        <div className="mt-1 text-xs text-slate-500">{user.email || 'No email'}</div>
                        {user.phone ? <div className="text-xs text-slate-500">{user.phone}</div> : null}
                      </td>
                      <td className="px-3 py-4">
                        <div className="font-semibold text-slate-900">{product.name || 'Unknown product'}</div>
                        <div className="mt-1 text-xs text-slate-500">{review?.productId || '—'}</div>
                      </td>
                      <td className="max-w-[320px] px-3 py-4">
                        <div className="font-semibold text-slate-900">{review?.title || 'Product review'}</div>
                        <p className="mt-1 text-sm text-slate-600">{reviewText}</p>
                      </td>
                      <td className="px-3 py-4">
                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-600">
                          <Star className="h-4 w-4 fill-current" />
                          {Number(review?.rating || 0)}/5
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">
                        {review?.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-3 py-4">
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review._id)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
