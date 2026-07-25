'use client';

import { useEffect, useState } from 'react';
import { reviewAPI } from '@/services/api';
import { toast } from 'sonner';

export default function ReviewsApprovalPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getPending();
      const payload = response?.data ?? response;
      const nextReviews = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setReviews(nextReviews);
    } catch (error) {
      console.error('Failed to load pending reviews', error);
      toast.error('Unable to load pending reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await reviewAPI.approve(id);
        toast.success('Review approved');
      } else {
        await reviewAPI.reject(id);
        toast.success('Review rejected');
      }
      setReviews((current) => current.filter((review) => review._id !== id));
    } catch (error) {
      console.error('Failed to update review', error);
      toast.error('Unable to update review.');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#08111f_48%,_#0f172a_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-slate-800/70 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
          <div className="mb-8 flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">Moderation</p>
            <h1 className="text-3xl font-semibold text-white">Review approvals</h1>
            <p className="text-sm text-slate-400">Approve or reject customer reviews before they appear publicly.</p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-8 text-center text-sm text-slate-400">Loading pending reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-8 text-center text-sm text-slate-400">No pending reviews right now.</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{review.title || 'Product review'}</p>
                      <p className="mt-2 text-sm text-slate-400">{review.comment || 'No comment provided.'}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">Rating: {review.rating || 5} / 5</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleAction(review._id, 'approve')} className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500">Approve</button>
                      <button type="button" onClick={() => handleAction(review._id, 'reject')} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500">Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
