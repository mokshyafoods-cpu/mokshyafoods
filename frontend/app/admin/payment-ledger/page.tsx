'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookOpenCheck, RefreshCcw } from 'lucide-react';
import { paymentLedgerAPI } from '@/services/api';

const PAGE_SIZE = 10;

export default function PaymentLedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await paymentLedgerAPI.getAll({ page, limit: PAGE_SIZE });
      const ledgerItems = Array.isArray(response?.data?.data) ? response.data.data : [];
      const total = Number(response?.data?.pagination?.total || ledgerItems.length || 0);
      setEntries(ledgerItems);
      setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load payment ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries();
  }, [page]);

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Payment Ledger</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">Saved ledger entries</h1>
            <p className="mt-3 text-sm text-slate-500">Review all saved payment ledger entries with order number, customer, products, amount, payment method, date, and notes.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <BookOpenCheck className="h-4 w-4" /> {entries.length} saved entries
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        <div className="min-w-[1200px]">
          <div className="grid gap-0 border-b border-slate-200 bg-slate-100 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 md:grid-cols-[1.2fr_1.1fr_1.3fr_0.8fr_0.8fr_0.7fr_1.2fr]">
            <span>Order #</span>
            <span>Customer</span>
            <span>Products</span>
            <span>Amount</span>
            <span>Method</span>
            <span>Date</span>
            <span>Notes</span>
          </div>
          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading ledger...</div>
          ) : entries.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No ledger entries yet.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {entries.map((entry: any) => (
                <div key={entry._id} className="grid gap-4 px-6 py-5 md:grid-cols-[1.2fr_1.1fr_1.3fr_0.8fr_0.8fr_0.7fr_1.2fr]">
                  <div className="font-semibold text-slate-900">{entry.orderNumber || entry.orderId || 'Manual'}</div>
                  <div className="text-slate-800">{entry.customerName || 'Walk-in'}</div>
                  <div className="text-sm text-slate-700">{entry.products || '—'}</div>
                  <div className="font-semibold text-slate-900">Rs. {Number(entry.amount || 0).toLocaleString()}</div>
                  <div className="text-slate-700">{entry.paymentMethod || 'cash'}</div>
                  <div className="text-slate-700">{entry.paymentDate || new Date(entry.createdAt).toLocaleDateString()}</div>
                  <div className="text-sm text-slate-600">{entry.notes || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-500">
        <div>{entries.length === 0 ? 'No entries' : `Showing ${Math.min((page - 1) * PAGE_SIZE + 1, entries.length)}-${Math.min(page * PAGE_SIZE, entries.length)} of ${entries.length} results`}</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 disabled:opacity-50">Previous</button>
          <span className="text-sm font-semibold text-slate-700">Page {page} / {totalPages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 disabled:opacity-50">Next</button>
          <button type="button" onClick={() => { void loadEntries(); }} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700"><RefreshCcw className="h-4 w-4" /> Refresh</button>
        </div>
      </div>
    </div>
  );
}
