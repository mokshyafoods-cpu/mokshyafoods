'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookOpenCheck, Download, Pencil, RefreshCcw, Trash2, Save, X } from 'lucide-react';
import { paymentLedgerAPI, productAPI } from '@/services/api';
import { downloadExcel } from '@/lib/excel';

const PAGE_SIZE = 10;

export default function PaymentLedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [entryForm, setEntryForm] = useState({ orderNumber: '', customerName: '', customerContact: '', products: '', amount: 0, paymentMethod: 'cash4', paymentDate: '', notes: '' });

  const paymentMethodLabels: Record<string, string> = {
    cash4: 'Cash',
    cash: 'Cash',
    cod: 'Cash on Delivery',
    fonepay: 'FonePay',
    phonepay: 'FonePay',
    esewa: 'eSewa',
  };

  const formatPaymentMethod = (method: string) => {
    const normalized = String(method || '').trim().toLowerCase();
    return paymentMethodLabels[normalized] || method || 'Cash';
  };

  const loadProducts = async () => {
    try {
      const response = await productAPI.getAll({ limit: 500 });
      const payload = Array.isArray(response?.data?.data) ? response.data.data : (Array.isArray(response?.data) ? response.data : []);
      setAllProducts(payload);
    } catch (error) {
      setAllProducts([]);
    }
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await paymentLedgerAPI.getAll({ page, limit: PAGE_SIZE, fromDate, toDate });
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
      setEditingEntry(null);
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

  const normalizeLedgerProductName = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ').toUpperCase();

  const getProductQuantityMap = (entry: any) => {
    const productMap = new Map<string, number>();
    const items = Array.isArray(entry?.items) ? entry.items : [];

    items.forEach((item: any) => {
      const name = normalizeLedgerProductName(item?.name || item?.productData?.name || item?.productName || item?.product?.name || '');
      if (!name) return;
      const quantity = Number(item?.quantity || 0);
      productMap.set(name, (productMap.get(name) || 0) + quantity);
    });

    if (productMap.size === 0 && typeof entry?.products === 'string' && entry.products.trim()) {
      entry.products.split(',').forEach((chunk: string) => {
        const trimmed = chunk.trim();
        if (!trimmed) return;
        const match = trimmed.match(/^(.*?)(?:\s*x\s*|\s*X\s*)(\d+)$/i);
        if (match) {
          const name = normalizeLedgerProductName(match[1]);
          const quantity = Number(match[2] || 0);
          if (name && quantity > 0) {
            productMap.set(name, (productMap.get(name) || 0) + quantity);
          }
        }
      });
    }

    return productMap;
  };

  const exportLedgerExcel = async () => {
    const ledgerRows = entries.length ? entries : [];
    if (!ledgerRows.length) {
      toast.error('No ledger rows available to export');
      return;
    }

    const productNames = Array.from(
      new Set([
        ...allProducts
          .map((product) => normalizeLedgerProductName(product?.name || ''))
          .filter(Boolean),
        ...ledgerRows.flatMap((entry) => Array.from(getProductQuantityMap(entry).keys())),
      ])
    ).sort((a, b) => a.localeCompare(b));

    const headerRow = ['S.N', 'DATE', 'CUSTOMER NAME', 'ADDRESS', 'FONEPAY', 'CASH', 'COD', 'REMARKS', ...productNames, 'TOTAL PRODUCT'];
    const dataRows = ledgerRows.map((entry, index) => {
      const quantityMap = getProductQuantityMap(entry);
      const method = String(entry.paymentMethod || 'cash').toLowerCase();
      const fonepay = method === 'fonepay' || method === 'phonepay' ? Number(entry.amount || 0) : 0;
      const cash = method === 'cash' ? Number(entry.amount || 0) : 0;
      const cod = method === 'cod' ? Number(entry.amount || 0) : 0;
      const row: Array<string | number> = [
        index + 1,
        entry.paymentDate || (entry.createdAt ? new Date(entry.createdAt).toISOString().slice(0, 10) : ''),
        entry.customerName || 'Walk-in Customer',
        entry.address || '',
        fonepay || '',
        cash || '',
        cod || '',
        entry.notes || entry.soldBy || '',
      ];

      productNames.forEach((productName) => {
        const quantity = quantityMap.get(productName) || 0;
        row.push(quantity || '');
      });

      const totalQty = productNames.reduce((sum, productName) => sum + (quantityMap.get(productName) || 0), 0);
      row.push(totalQty);
      return row;
    });

    const paymentTotals = ledgerRows.reduce(
      (totals, entry) => {
          const method = String(entry.paymentMethod || 'cash').toLowerCase();
        const amount = Number(entry.amount || 0);
        if (method === 'fonepay' || method === 'phonepay') totals.phonepay += amount;
        if (method === 'cash') totals.cash += amount;
        if (method === 'cod') totals.cod += amount;
        return totals;
      },
      { phonepay: 0, cash: 0, cod: 0 }
    );

    const productTotals = productNames.map((productName) =>
      ledgerRows.reduce((sum, entry) => sum + (getProductQuantityMap(entry).get(productName) || 0), 0)
    );

    const totalRow = [
      'TOTAL',
      '',
      '',
      '',
      paymentTotals.phonepay,
      paymentTotals.cash,
      paymentTotals.cod,
      '',
      ...productTotals,
      productTotals.reduce((sum, value) => sum + value, 0),
    ];

    const styles: Record<string, any> = {};
    const greenFill = { fgColor: { rgb: 'D9EAD3' } };
    const headerStyle = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2F7D32' } }, border: { top: { style: 'thin', color: { rgb: '000000' } }, right: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'thin', color: { rgb: '000000' } }, left: { style: 'thin', color: { rgb: '000000' } } }, alignment: { horizontal: 'center', vertical: 'center' } };
    const dataStyle = { border: { top: { style: 'thin', color: { rgb: '000000' } }, right: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'thin', color: { rgb: '000000' } }, left: { style: 'thin', color: { rgb: '000000' } } }, alignment: { vertical: 'center', wrapText: true } };
    const totalStyle = { font: { bold: true, color: { rgb: '000000' } }, fill: greenFill, border: { top: { style: 'thin', color: { rgb: '000000' } }, right: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'thin', color: { rgb: '000000' } }, left: { style: 'thin', color: { rgb: '000000' } } }, alignment: { horizontal: 'center', vertical: 'center' } };

    headerRow.forEach((_, index) => {
      const cell = `${String.fromCharCode(65 + (index % 26))}${1}`;
      styles[cell] = headerStyle;
    });

    dataRows.forEach((_, rowIndex) => {
      headerRow.forEach((_, colIndex) => {
        const cell = `${String.fromCharCode(65 + (colIndex % 26))}${rowIndex + 2}`;
        styles[cell] = dataStyle;
      });
    });

    const totalCellIndex = dataRows.length + 2;
    headerRow.forEach((_, colIndex) => {
      const cell = `${String.fromCharCode(65 + (colIndex % 26))}${totalCellIndex}`;
      styles[cell] = totalStyle;
    });

    const columnWidths = [
      { wch: 6 },
      { wch: 14 },
      { wch: 22 },
      { wch: 24 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      ...productNames.map(() => ({ wch: 14 })),
      { wch: 14 },
    ];

    await downloadExcel('payment-ledger.xlsx', [{
      name: 'Payment Ledger',
      data: [headerRow, ...dataRows, totalRow],
      cols: columnWidths,
      styles,
    }]);
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate]);

  useEffect(() => {
    void loadEntries();
  }, [page, fromDate, toDate]);

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

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            From date
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            To date
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <div className="flex items-end">
            <button type="button" onClick={() => { setFromDate(''); setToDate(''); }} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Clear filters</button>
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
                  <div className="font-semibold text-slate-900">{entry.orderNumber || entry.orderId || '—'}</div>
                  <div className="text-slate-800">{entry.customerName || '—'}</div>
                  <div className="text-sm text-slate-700">{entry.products || '—'}</div>
                  <div className="font-semibold text-slate-900">RS {Number(entry.amount || 0).toLocaleString()}</div>
                  <div className="text-slate-700">{entry.paymentMethod ? formatPaymentMethod(entry.paymentMethod) : '—'}</div>
                  <div className="text-slate-700">{entry.paymentDate || (entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '—')}</div>
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

      {editingEntry && (
        <form onSubmit={saveEditedEntry} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Edit ledger</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Update payment details</h2>
            </div>
            <button type="button" onClick={() => setEditingEntry(null)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Order Number
              <input value={entryForm.orderNumber} onChange={(e) => setEntryForm((prev) => ({ ...prev, orderNumber: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Customer Name
              <input value={entryForm.customerName} onChange={(e) => setEntryForm((prev) => ({ ...prev, customerName: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Customer Contact
              <input value={entryForm.customerContact} onChange={(e) => setEntryForm((prev) => ({ ...prev, customerContact: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-2">
              Products
              <input value={entryForm.products} onChange={(e) => setEntryForm((prev) => ({ ...prev, products: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Amount
              <input type="number" value={entryForm.amount} onChange={(e) => setEntryForm((prev) => ({ ...prev, amount: Number(e.target.value || 0) }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Payment Method
              <select value={entryForm.paymentMethod} onChange={(e) => setEntryForm((prev) => ({ ...prev, paymentMethod: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="cash4">Cash</option>
                <option value="cash">Cash</option>
                <option value="cod">Cash on Delivery</option>
                <option value="fonepay">FonePay</option>
                <option value="esewa">eSewa</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Payment Date
              <input type="date" value={entryForm.paymentDate} onChange={(e) => setEntryForm((prev) => ({ ...prev, paymentDate: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-3">
              Notes
              <input value={entryForm.notes} onChange={(e) => setEntryForm((prev) => ({ ...prev, notes: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90">
              <Save className="h-4 w-4" /> Save changes
            </button>
          </div>
        </form>
      )}

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
