'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '@/services/api';
import { toast } from 'sonner';

interface RawMaterialRow {
  _id: string;
  name: string;
  unit: string;
  supplier: string;
  quantityPurchased: number;
  costPerUnit: number;
  travelCost?: number;
  totalCost: number;
  purchaseDate: string;
  notes: string;
}

export default function AdminRawMaterialsPage() {
  const [rows, setRows] = useState<RawMaterialRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [form, setForm] = useState({ name: '', unit: 'kg', supplier: '', quantityPurchased: '0', costPerUnit: '0', travelCost: '0', purchaseDate: new Date().toISOString().slice(0, 10), notes: '' });

  const loadData = async (nextPage = page) => {
    try {
      const response = await adminAPI.getRawMaterials({ page: nextPage, limit, search, startDate, endDate });
      const payload = response.data?.data ?? { rows: [], total: 0, page: 1, limit };
      setRows(Array.isArray(payload.rows) ? payload.rows : []);
      setTotal(Number(payload.total || 0));
      setPage(Number(payload.page || nextPage));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to load raw materials');
    }
  };

  useEffect(() => {
    loadData(1);
  }, [search, startDate, endDate]);

  const totalSpend = useMemo(() => rows.reduce((sum, item) => sum + Number(item.totalCost || 0), 0), [rows]);

  const computeTotalCost = () => {
    const quantity = Number(form.quantityPurchased || 0);
    const unitCost = Number(form.costPerUnit || 0);
    const travelCost = Number(form.travelCost || 0);
    return quantity * unitCost + travelCost;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await adminAPI.createRawMaterial({
        name: form.name,
        unit: form.unit,
        supplier: form.supplier,
        quantityPurchased: Number(form.quantityPurchased || 0),
        costPerUnit: Number(form.costPerUnit || 0),
        travelCost: Number(form.travelCost || 0),
        purchaseDate: form.purchaseDate || new Date().toISOString(),
        notes: form.notes,
      });
      toast.success('Purchase saved');
      setForm({ name: '', unit: 'kg', supplier: '', quantityPurchased: '0', costPerUnit: '0', travelCost: '0', purchaseDate: new Date().toISOString().slice(0, 10), notes: '' });
      loadData(1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save purchase');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/70 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Raw Materials</p>
        <h1 className="mt-2 text-3xl font-semibold">Material purchases</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">This month</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">RS {totalSpend}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total records</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{total}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Filter</p>
          <div className="mt-3 space-y-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Search material</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Material name" className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Start date</span>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">End date</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Add purchase</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Material name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Material name" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" required />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Unit</span>
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Unit" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Supplier</span>
                <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Qty purchased</span>
                <input type="number" value={form.quantityPurchased} onChange={(e) => setForm({ ...form, quantityPurchased: e.target.value })} placeholder="Qty purchased" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Cost per unit</span>
                <input type="number" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} placeholder="Cost per unit" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Travel cost (optional)</span>
                <input type="number" value={form.travelCost} onChange={(e) => setForm({ ...form, travelCost: e.target.value })} placeholder="Travel cost" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Purchase date</span>
                <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </label>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
              <p className="font-medium text-slate-700">Total cost</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">RS {computeTotalCost()}</p>
              <p className="text-xs text-slate-500">Quantity × cost per unit + travel cost.</p>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Notes</span>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="min-h-[90px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
            </label>
            <button type="submit" className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white">Save purchase</button>
          </form>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Purchases</h2>
          <div className="mt-4 space-y-3">
            {rows.length === 0 ? <p className="text-sm text-slate-500">No purchases found.</p> : rows.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.supplier || 'No supplier'} • {item.quantityPurchased} {item.unit}</p>
                    <p className="text-sm text-slate-500">Travel cost: RS {Number(item.travelCost || 0)}</p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <p>Total: RS {item.totalCost}</p>
                    <p>{new Date(item.purchaseDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button disabled={page <= 1} onClick={() => loadData(page - 1)} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">Previous</button>
            <span className="text-sm text-slate-500">Page {page}</span>
            <button disabled={rows.length < limit} onClick={() => loadData(page + 1)} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
