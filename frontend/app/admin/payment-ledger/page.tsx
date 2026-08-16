'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookOpenCheck, Download, Pencil, RefreshCcw, Trash2, Save, X } from 'lucide-react';
import { paymentLedgerAPI } from '@/services/api';
import { downloadExcel } from '@/lib/excel';

const PAGE_SIZE = 10;

export default function PaymentLedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [entryForm, setEntryForm] = useState({ orderNumber: '', customerName: '', customerContact: '', products: '', amount: 0, paymentMethod: 'cash4', paymentDate: '', notes: '' });

  const paymentMethodLabels: Record<string, string> = {
    cash4: 'Cash',
    cash: 'Cash',
    cod: 'Cash on Delivery',
    phonepay: 'PhonePay',
    esewa: 'eSewa',
  };

  const formatPaymentMethod = (method: string) => {
    const normalized = String(method || '').trim().toLowerCase();
    return paymentMethodLabels[normalized] || method || 'Cash';
  };

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

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Delete this ledger entry?')) return;
    try {
      await paymentLedgerAPI.delete(id);
      toast.success('Ledger entry deleted');
      await loadEntries();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete ledger entry');
    }
  };

  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setEntryForm({
      orderNumber: entry.orderNumber || '',
      customerName: entry.customerName || '',
      customerContact: entry.customerContact || '',
      products: entry.products || '',
      amount: Number(entry.amount || 0),
      paymentMethod: entry.paymentMethod || 'cash4',
      paymentDate: entry.paymentDate || new Date().toISOString().slice(0, 10),
      notes: entry.notes || '',
    });
  };

  const saveEditedEntry = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingEntry?._id) return;
    try {
      await paymentLedgerAPI.update(editingEntry._id, entryForm);
      toast.success('Ledger entry updated');
      setEditingEntry(null);
      await loadEntries();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update ledger entry');
    }
  };

  const extractProductQuantity = (productList: string, productName: string) => {
    if (!productList || !productName) return 0;
    const normalizedProductName = productName.trim();
    const match = String(productList)
      .split(',')
      .map((item) => item.trim())
      .find((item) => {
        const itemName = item.replace(/\s*x\s*\d+$/i, '').trim();
        return itemName.toLowerCase() === normalizedProductName.toLowerCase();
      });

    if (!match) return 0;
    const quantityMatch = match.match(/x\s*(\d+)/i);
    return quantityMatch ? Number(quantityMatch[1] || 0) : 0;
  };

  const exportLedgerExcel = async () => {
    const ledgerRows = entries.length ? entries : [];
    if (!ledgerRows.length) return;

    const productNames = Array.from(
      new Set(
        ledgerRows.flatMap((entry) => {
          const value = String(entry.products || '');
          return value
            .split(',')
            .map((item) => item.replace(/\s*x\s*\d+$/i, '').trim())
            .filter(Boolean);
        })
      )
    ).sort((a, b) => a.localeCompare(b));

    const totalRow = [
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      ledgerRows.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
      ...productNames.map((productName) => ledgerRows.reduce((sum, entry) => sum + extractProductQuantity(String(entry.products || ''), productName), 0)),
      ledgerRows.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    ];

    await downloadExcel('payment-ledger.xlsx', [
      {
        name: 'Ledger Entries',
        data: [
          ['Order #', 'Customer', 'Phone', 'Amount', 'Method', 'Date', 'Notes', 'Grand Total', ...productNames],
          ...ledgerRows.map((entry) => {
            const row: Array<string | number> = [
              entry.orderNumber || '',
              entry.customerName || '',
              entry.customerContact || '',
              Number(entry.amount || 0),
              formatPaymentMethod(entry.paymentMethod || 'cash4'),
              entry.paymentDate || new Date(entry.createdAt).toLocaleDateString(),
              entry.notes || '',
              Number(entry.amount || 0),
            ];
            productNames.forEach((productName) => {
              row.push(extractProductQuantity(String(entry.products || ''), productName));
            });
            return row;
          }),
          totalRow,
        ],
      },
    ]);
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <BookOpenCheck className="h-4 w-4" /> {entries.length} saved entries
            </div>
            <button type="button" onClick={exportLedgerExcel} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              <Download className="h-4 w-4" /> Export Excel
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        <div className="min-w-[1200px]">
          <div className="grid gap-0 border-b border-slate-200 bg-slate-100 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 md:grid-cols-[1.1fr_1fr_1.1fr_0.8fr_0.7fr_0.7fr_1fr_0.7fr]">
            <span>Order #</span>
            <span>Customer</span>
            <span>Products</span>
            <span>Amount</span>
            <span>Method</span>
            <span>Date</span>
            <span>Notes</span>
            <span>Actions</span>
          </div>
          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading ledger...</div>
          ) : entries.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No ledger entries yet.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {entries.map((entry: any) => (
                <div key={entry._id} className="grid gap-4 px-6 py-5 md:grid-cols-[1.1fr_1fr_1.1fr_0.8fr_0.7fr_0.7fr_1fr_0.7fr]">
                  <div className="font-semibold text-slate-900">{entry.orderNumber || entry.orderId || 'Manual'}</div>
                  <div className="text-slate-800">{entry.customerName || 'Walk-in'}</div>
                  <div className="text-sm text-slate-700">{entry.products || '—'}</div>
                  <div className="font-semibold text-slate-900">RS {Number(entry.amount || 0).toLocaleString()}</div>
                  <div className="text-slate-700">{formatPaymentMethod(entry.paymentMethod || 'cash4')}</div>
                  <div className="text-slate-700">{entry.paymentDate || new Date(entry.createdAt).toLocaleDateString()}</div>
                  <div className="text-sm text-slate-600">{entry.notes || '—'}</div>
                  <div className="flex items-center justify-start gap-2">
                    <button type="button" onClick={() => handleEditEntry(entry)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button type="button" onClick={() => void handleDeleteEntry(entry._id)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
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
