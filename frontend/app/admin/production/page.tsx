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
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Production</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Batch Production</h1>
            <p className="mt-2 text-sm text-slate-500">Create and manage production batches of your products.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">POS Dashboard</button>
            <button type="button" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
              <span className="text-lg leading-none">+</span> Add Batch
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Logout</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Total Produced</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{totalProduced}</p>
          <p className="mt-2 text-xs text-slate-500">Total quantity</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Total Batches</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{total}</p>
          <p className="mt-2 text-xs text-slate-500">Total batches</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">This Month</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{rows.filter((item) => new Date(item.productionDate).getMonth() === new Date().getMonth()).length}</p>
          <p className="mt-2 text-xs text-slate-500">Batches produced</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Search</p>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or batch..." className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
          <button type="button" onClick={exportProductionExcel} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            <Download className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Add New Batch</h2>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Batch number <span className="text-rose-500">*</span></span>
              <input value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} placeholder="e.g. BATCH-0001" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Product <span className="text-rose-500">*</span></span>
              <select value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" required>
                <option value="">Select product</option>
                <option value="Dried Mango">Dried Mango</option>
                <option value="Dried Pineapple">Dried Pineapple</option>
                <option value="Beetroot Powder">Beetroot Powder</option>
                <option value="Orange Powder">Orange Powder</option>
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Quantity produced <span className="text-rose-500">*</span></span>
                <input type="number" value={form.quantityProduced} onChange={(e) => setForm({ ...form, quantityProduced: e.target.value })} placeholder="0" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Unit</span>
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200">
                  <option value="kg">kg</option>
                  <option value="pcs">pcs</option>
                  <option value="pack">pack</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Production date <span className="text-rose-500">*</span></span>
                <input type="date" value={form.productionDate || new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, productionDate: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Start time</span>
                <input type="time" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Produced by</span>
              <input value={form.staffInCharge} onChange={(e) => setForm({ ...form, staffInCharge: e.target.value })} placeholder="Staff member name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Notes</span>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="min-h-[96px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
            </label>
            <button type="submit" className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">Save batch</button>
          </form>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">Batches</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{total} total</span>
          </div>

          {rows.length === 0 ? (
            <div className="mt-6 flex min-h-[260px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">📦</div>
              <h3 className="mt-5 text-2xl font-semibold text-slate-900">No batches found</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">Create your first production batch to get started.</p>
              <button type="button" className="mt-5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">Add Batch</button>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <th className="px-3 py-3">Batch #</th>
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3">Qty</th>
                    <th className="px-3 py-3">Unit</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Produced By</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item._id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/70">
                      <td className="px-3 py-3 font-medium text-slate-800">{item.batchNumber}</td>
                      <td className="px-3 py-3 text-slate-700">{item.productName}</td>
                      <td className="px-3 py-3 text-slate-700">{item.quantityProduced}</td>
                      <td className="px-3 py-3 text-slate-700">kg</td>
                      <td className="px-3 py-3 text-slate-700">{new Date(item.productionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-3 py-3 text-slate-700">{item.staffInCharge || '—'}</td>
                      <td className="px-3 py-3"><span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Completed</span></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setSelectedBatch(item)} className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100">View</button>
                          <button type="button" onClick={() => handleEditBatch(item)} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <button disabled={page <= 1} onClick={() => loadData(page - 1)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <span className="text-sm font-medium text-slate-600">Page {page}</span>
            <button disabled={rows.length < limit} onClick={() => loadData(page + 1)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
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
