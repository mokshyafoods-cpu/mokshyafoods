'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '@/services/api';
import { toast } from 'sonner';
import { Download, Pencil, Save, X } from 'lucide-react';
import { downloadExcel } from '@/lib/excel';

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
  const [editingBatch, setEditingBatch] = useState<ProductionBatchRow | null>(null);
  const [form, setForm] = useState({ batchNumber: '', productName: '', quantityProduced: '0', staffInCharge: '', notes: '', rawMaterialsUsed: [{ materialName: '', quantityUsed: '0', unit: 'kg' }] });
  const [editForm, setEditForm] = useState({ batchNumber: '', productName: '', quantityProduced: '0', staffInCharge: '', notes: '', productionDate: new Date().toISOString().slice(0, 10) });

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

  const handleEditBatch = (batch: ProductionBatchRow) => {
    setEditingBatch(batch);
    setEditForm({
      batchNumber: batch.batchNumber || '',
      productName: batch.productName || '',
      quantityProduced: String(batch.quantityProduced || 0),
      staffInCharge: batch.staffInCharge || '',
      notes: batch.notes || '',
      productionDate: batch.productionDate ? new Date(batch.productionDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
  };

  const saveEditedBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingBatch?._id) return;
    try {
      await adminAPI.updateProductionBatch(editingBatch._id, {
        batchNumber: editForm.batchNumber,
        productName: editForm.productName,
        quantityProduced: Number(editForm.quantityProduced || 0),
        staffInCharge: editForm.staffInCharge,
        notes: editForm.notes,
        productionDate: editForm.productionDate,
      });
      toast.success('Production batch updated');
      setEditingBatch(null);
      await loadData(page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to update batch');
    }
  };

  const exportProductionExcel = async () => {
    if (!rows.length) return;
    await downloadExcel('production-batches.xlsx', [
      {
        name: 'Batches',
        data: [
          ['Batch Number', 'Product', 'Quantity Produced', 'Production Date', 'Staff In Charge', 'Notes'],
          ...rows.map((item) => [
            item.batchNumber || '',
            item.productName || '',
            item.quantityProduced || 0,
            item.productionDate ? new Date(item.productionDate).toLocaleDateString() : '',
            item.staffInCharge || '',
            item.notes || '',
          ]),
        ],
      },
    ]);
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

      <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
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

        <div className="flex items-center justify-end">
          <button type="button" onClick={exportProductionExcel} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            <Download className="h-4 w-4" /> Export Excel
          </button>
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
              <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" onClick={() => setSelectedBatch(item)} className="w-full text-left sm:max-w-[85%]">
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
                  <button type="button" onClick={() => handleEditBatch(item)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                </div>
              </div>            ))}
          </div>          <div className="mt-4 flex items-center justify-between">
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

      {editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Edit batch</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Update production batch</h2>
              </div>
              <button type="button" onClick={() => setEditingBatch(null)} className="rounded-full border border-slate-200 p-3 text-slate-600 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveEditedBatch} className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Batch number</span>
                <input value={editForm.batchNumber} onChange={(e) => setEditForm((prev) => ({ ...prev, batchNumber: e.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Product name</span>
                <input value={editForm.productName} onChange={(e) => setEditForm((prev) => ({ ...prev, productName: e.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Quantity produced</span>
                <input type="number" value={editForm.quantityProduced} onChange={(e) => setEditForm((prev) => ({ ...prev, quantityProduced: e.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Staff in charge</span>
                <input value={editForm.staffInCharge} onChange={(e) => setEditForm((prev) => ({ ...prev, staffInCharge: e.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Production date</span>
                <input type="date" value={editForm.productionDate} onChange={(e) => setEditForm((prev) => ({ ...prev, productionDate: e.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Notes</span>
                <textarea value={editForm.notes} onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm min-h-[120px]" />
              </label>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingBatch(null)} className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">Cancel</button>
                <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"><Save className="h-4 w-4" /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
