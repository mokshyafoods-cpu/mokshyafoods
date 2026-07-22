'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '@/services/api';
import { toast } from 'sonner';

interface RawMaterialRow {
  _id: string;
  name: string;
  supplier: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  purchaseDate: string;
  notes: string;
}

interface ProductionBatchRow {
  _id: string;
  batchNumber: string;
  productName: string;
  quantityProduced: number;
  unit: string;
  producedAt: string;
  notes: string;
}

export default function AdminOperationsPage() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterialRow[]>([]);
  const [productionBatches, setProductionBatches] = useState<ProductionBatchRow[]>([]);
  const [report, setReport] = useState<any>(null);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({ name: '', supplier: '', quantity: '0', unit: 'kg', unitCost: '0', notes: '' });
  const [batchForm, setBatchForm] = useState({ batchNumber: '', productName: '', quantityProduced: '0', unit: 'pcs', notes: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [materialsRes, batchesRes, reportRes] = await Promise.all([
        adminAPI.getRawMaterials(),
        adminAPI.getProductionBatches(),
        adminAPI.getMonthlyReport({ month }),
      ]);
      const materials = materialsRes.data?.data ?? [];
      const batches = batchesRes.data?.data ?? [];
      const reportData = reportRes.data?.data ?? null;
      setRawMaterials(Array.isArray(materials) ? materials : []);
      setProductionBatches(Array.isArray(batches) ? batches : []);
      setReport(reportData);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Unable to load operations data';
      setErrorMessage(message);
      toast.error(message);
      setRawMaterials([]);
      setProductionBatches([]);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month]);

  const rawMaterialSpend = useMemo(() => rawMaterials.reduce((sum, row) => sum + Number(row.totalCost || 0), 0), [rawMaterials]);

  const handleRawMaterialSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await adminAPI.createRawMaterial({
        name: form.name,
        supplier: form.supplier,
        quantity: Number(form.quantity || 0),
        unit: form.unit,
        unitCost: Number(form.unitCost || 0),
        notes: form.notes,
        purchaseDate: new Date().toISOString(),
      });
      toast.success('Raw material added');
      setForm({ name: '', supplier: '', quantity: '0', unit: 'kg', unitCost: '0', notes: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save raw material');
    }
  };

  const handleBatchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await adminAPI.createProductionBatch({
        batchNumber: batchForm.batchNumber || `BATCH-${Date.now()}`,
        productName: batchForm.productName,
        quantityProduced: Number(batchForm.quantityProduced || 0),
        unit: batchForm.unit,
        producedAt: new Date().toISOString(),
        notes: batchForm.notes,
      });
      toast.success('Production batch added');
      setBatchForm({ batchNumber: '', productName: '', quantityProduced: '0', unit: 'pcs', notes: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save production batch');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/70 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Operations & Reporting</p>
            <h1 className="mt-2 text-3xl font-semibold">Business Operations Hub</h1>
            <p className="mt-2 text-sm text-slate-400">Track raw materials, production batches, and month-wise sales performance in one place.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Select month</label>
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          </div>
        </div>
        {(isLoading || errorMessage) && (
          <div className={`mt-4 rounded-3xl border px-4 py-3 text-sm ${isLoading ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {isLoading ? 'Loading operations data...' : errorMessage}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-800/70 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Raw material spend</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">Rs. {rawMaterialSpend}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800/70 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Production batches</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{productionBatches.length}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800/70 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Monthly sales</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">Rs. {report?.totalSales ?? 0}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Add raw material purchase</h2>
          <form className="mt-4 space-y-3" onSubmit={handleRawMaterialSubmit}>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Material name" className="w-full rounded-2xl border border-slate-300 px-4 py-3" required />
            <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <div className="grid gap-3 sm:grid-cols-3">
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Quantity" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Unit" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
              <input type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} placeholder="Unit cost" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </div>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="min-h-[90px] w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <button type="submit" className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 hover:shadow-sm">Save raw material</button>
          </form>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Add production batch</h2>
          <form className="mt-4 space-y-3" onSubmit={handleBatchSubmit}>
            <input value={batchForm.batchNumber} onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })} placeholder="Batch number" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <input value={batchForm.productName} onChange={(e) => setBatchForm({ ...batchForm, productName: e.target.value })} placeholder="Product name" className="w-full rounded-2xl border border-slate-300 px-4 py-3" required />
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" value={batchForm.quantityProduced} onChange={(e) => setBatchForm({ ...batchForm, quantityProduced: e.target.value })} placeholder="Quantity produced" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
              <input value={batchForm.unit} onChange={(e) => setBatchForm({ ...batchForm, unit: e.target.value })} placeholder="Unit" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </div>
            <textarea value={batchForm.notes} onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })} placeholder="Notes" className="min-h-[90px] w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <button type="submit" className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 hover:shadow-sm">Save batch</button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Raw materials</h2>
          <div className="mt-4 space-y-3">
            {rawMaterials.length === 0 ? <p className="text-sm text-slate-500">No raw materials recorded for this month.</p> : rawMaterials.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.supplier}</p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <p>{item.quantity} {item.unit}</p>
                    <p>Rs. {item.totalCost}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Production batches</h2>
          <div className="mt-4 space-y-3">
            {productionBatches.length === 0 ? <p className="text-sm text-slate-500">No production batches recorded for this month.</p> : productionBatches.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.productName}</p>
                    <p className="text-sm text-slate-500">Batch: {item.batchNumber}</p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <p>{item.quantityProduced} {item.unit}</p>
                    <p>{item.notes}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Monthly business report</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Raw material spend</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">Rs. {report?.rawMaterialSpend ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total sales</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">Rs. {report?.totalSales ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Website sales</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">Rs. {report?.websiteSales ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">POS sales</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">Rs. {report?.posSales ?? 0}</p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-700">Production by product</p>
          <div className="mt-3 space-y-2">
            {report && Object.entries(report.productionByProduct || {}).length > 0 ? Object.entries(report.productionByProduct || {}).map(([name, quantity]) => (
              <div key={name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span>{name}</span>
                <span>{String(quantity)}</span>
              </div>
            )) : <p className="text-sm text-slate-500">No production data for this month yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
