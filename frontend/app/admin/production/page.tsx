'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '@/services/api';
import { toast } from 'sonner';

interface ProductionBatchRow {
  _id: string;
  batchNumber: string;
  productName: string;
  rawMaterialsUsed: Array<{ materialName: string; quantityUsed: number; unit: string }>;
  quantityProduced: number;
  productionDate: string;
  staffInCharge: string;
  notes: string;
}

export default function AdminProductionPage() {
  const [rows, setRows] = useState<ProductionBatchRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatchRow | null>(null);
  const [form, setForm] = useState({ batchNumber: '', productName: '', quantityProduced: '0', staffInCharge: '', notes: '', rawMaterialsUsed: [{ materialName: '', quantityUsed: '0', unit: 'kg' }] });

  const loadData = async (nextPage = page) => {
    try {
      const response = await adminAPI.getProductionBatches({ page: nextPage, limit, search });
      const payload = response.data?.data ?? { rows: [], total: 0, page: 1, limit };
      setRows(Array.isArray(payload.rows) ? payload.rows : []);
      setTotal(Number(payload.total || 0));
      setPage(Number(payload.page || nextPage));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to load production batches');
    }
  };

  useEffect(() => {
    loadData(1);
  }, [search]);

  const totalProduced = useMemo(() => rows.reduce((sum, item) => sum + Number(item.quantityProduced || 0), 0), [rows]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await adminAPI.createProductionBatch({
        batchNumber: form.batchNumber || `BATCH-${Date.now()}`,
        productName: form.productName,
        quantityProduced: Number(form.quantityProduced || 0),
        staffInCharge: form.staffInCharge,
        notes: form.notes,
        rawMaterialsUsed: form.rawMaterialsUsed.filter((item) => item.materialName.trim()),
        productionDate: new Date().toISOString(),
      });
      toast.success('Production batch saved');
      setForm({ batchNumber: '', productName: '', quantityProduced: '0', staffInCharge: '', notes: '', rawMaterialsUsed: [{ materialName: '', quantityUsed: '0', unit: 'kg' }] });
      loadData(1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save batch');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/70 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Production</p>
        <h1 className="mt-2 text-3xl font-semibold">Batch production</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total produced</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totalProduced}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total batches</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{total}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Search</p>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Product name" className="mt-3 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Add batch</h2>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <input value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} placeholder="Batch number" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="Product name" className="w-full rounded-2xl border border-slate-300 px-4 py-3" required />
            <input type="number" value={form.quantityProduced} onChange={(e) => setForm({ ...form, quantityProduced: e.target.value })} placeholder="Quantity produced" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <input value={form.staffInCharge} onChange={(e) => setForm({ ...form, staffInCharge: e.target.value })} placeholder="Staff in charge" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="min-h-[90px] w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <button type="submit" className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white">Save batch</button>
          </form>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Batches</h2>
          <div className="mt-4 space-y-3">
            {rows.length === 0 ? <p className="text-sm text-slate-500">No batches found.</p> : rows.map((item) => (
              <button key={item._id} type="button" onClick={() => setSelectedBatch(item)} className="w-full rounded-2xl border border-slate-200 p-4 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.productName}</p>
                    <p className="text-sm text-slate-500">{item.batchNumber}</p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <p>{item.quantityProduced}</p>
                    <p>{new Date(item.productionDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button disabled={page <= 1} onClick={() => loadData(page - 1)} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">Previous</button>
            <span className="text-sm text-slate-500">Page {page}</span>
            <button disabled={rows.length < limit} onClick={() => loadData(page + 1)} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {selectedBatch && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Batch details</h2>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">{selectedBatch.batchNumber}</p>
            <p className="mt-2 text-sm text-slate-600">Product: {selectedBatch.productName}</p>
            <p className="mt-2 text-sm text-slate-600">Staff: {selectedBatch.staffInCharge || '—'}</p>
            <p className="mt-2 text-sm text-slate-600">Notes: {selectedBatch.notes || '—'}</p>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-slate-700">Raw materials used</p>
              {selectedBatch.rawMaterialsUsed.length === 0 ? <p className="text-sm text-slate-500">No raw materials recorded.</p> : selectedBatch.rawMaterialsUsed.map((item, index) => (
                <div key={`${item.materialName}-${index}`} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
                  <span>{item.materialName}</span>
                  <span>{item.quantityUsed} {item.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
