'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { BookOpenCheck, PlusCircle, RefreshCcw } from 'lucide-react';

const PAGE_SIZE = 10;

const emptyForm = {
  orderId: '',
  orderNumber: '',
  customerName: '',
  customerPhone: '',
  productName: '',
  amount: '',
  paymentMethod: 'cash',
  paymentDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

export default function PaymentLedgerPage() {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const orderId = searchParams?.get('orderId') || '';
    const orderNumber = searchParams?.get('orderNumber') || '';
    const customerName = searchParams?.get('customerName') || '';
    const customerPhone = searchParams?.get('customerPhone') || '';
    const productName = searchParams?.get('productName') || '';
    const amount = searchParams?.get('amount') || '';
    const paymentMethod = searchParams?.get('paymentMethod') || 'cash';
    const paymentDate = searchParams?.get('paymentDate') || new Date().toISOString().slice(0, 10);
    const notes = searchParams?.get('notes') || '';

    if (orderId || orderNumber || customerName || customerPhone || productName || amount || paymentMethod || notes) {
      setForm({
        orderId,
        orderNumber,
        customerName,
        customerPhone,
        productName,
        amount,
        paymentMethod,
        paymentDate,
        notes,
      });
    }
    setEntries(JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('paymentLedgerEntries') || '[]' : '[]'));
    setLoading(false);
  }, [searchParams]);

  const pagedEntries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return entries.slice(start, start + PAGE_SIZE);
  }, [entries, page]);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextEntry = {
      _id: `ledger-${Date.now()}`,
      ...form,
      amount: Number(form.amount || 0),
      createdAt: new Date().toISOString(),
    };
    const nextEntries = [nextEntry, ...entries];
    localStorage.setItem('paymentLedgerEntries', JSON.stringify(nextEntries));
    setEntries(nextEntries);
    setForm(emptyForm);
    toast.success('Payment ledger entry saved');
  };

  const handleReset = () => {
    setForm(emptyForm);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Payment Ledger</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">Record payments</h1>
            <p className="mt-3 text-sm text-slate-500">Log manual payment entries for orders and keep a simple paper trail for in-person or offline settlements.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <BookOpenCheck className="h-4 w-4" /> {entries.length} saved entries
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Order ID</label>
                <input value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Order Number</label>
                <input value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Customer Name</label>
                <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Customer Phone</label>
                <input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Product</label>
                <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Amount</label>
                <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Payment Method</label>
                <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank-transfer">Bank transfer</option>
                  <option value="cod">COD</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Date</label>
                <input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[110px] w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" placeholder="Add any notes about the payment" />
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">
                <PlusCircle className="h-4 w-4" /> Save entry
              </button>
              <button type="button" onClick={handleReset} className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">Reset form</button>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-xl">
          <div className="min-w-[760px]">
            <div className="grid gap-0 border-b border-slate-200 bg-slate-100 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 sm:grid-cols-[1.4fr_0.9fr_0.8fr]">
              <span>Customer</span>
              <span>Amount</span>
              <span>Method</span>
            </div>
            {loading ? (
              <div className="p-10 text-center text-slate-500">Loading ledger...</div>
            ) : entries.length === 0 ? (
              <div className="p-10 text-center text-slate-500">No ledger entries yet.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {pagedEntries.map((entry) => (
                  <div key={entry._id} className="grid gap-4 px-6 py-5 sm:grid-cols-[1.4fr_0.9fr_0.8fr]">
                    <div>
                      <p className="font-semibold text-slate-900">{entry.customerName || 'Walk-in'}</p>
                      <p className="text-sm text-slate-500">{entry.orderNumber || entry.orderId || 'Manual entry'} • {entry.paymentDate}</p>
                    </div>
                    <div className="font-semibold text-slate-900">Rs. {entry.amount}</div>
                    <div className="text-slate-700">{entry.paymentMethod}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-500">
        <div>{entries.length === 0 ? 'No entries' : `Showing ${Math.min((page - 1) * PAGE_SIZE + 1, entries.length)}-${Math.min(page * PAGE_SIZE, entries.length)} of ${entries.length} results`}</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 disabled:opacity-50">Previous</button>
          <span className="text-sm font-semibold text-slate-700">Page {page} / {totalPages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 disabled:opacity-50">Next</button>
          <button type="button" onClick={() => { setEntries(JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('paymentLedgerEntries') || '[]' : '[]')); setPage(1); }} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700"><RefreshCcw className="h-4 w-4" /> Refresh</button>
        </div>
      </div>
    </div>
  );
}
