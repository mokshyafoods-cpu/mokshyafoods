'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '@/services/api';
import { downloadExcel } from '@/lib/excel';
import { toast } from 'sonner';
import { Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react';

const types = [
  { value: 'machinery', label: 'Machinery & Equipment' },
  { value: 'utility', label: 'Utility Bill' },
  { value: 'maintenance', label: 'Maintenance & Repair' },
  { value: 'operational_purchase', label: 'Operational Purchase' },
  { value: 'other_expense', label: 'Other Expense' },
];
const categories: Record<string, string[]> = {
  machinery: ['Equipment', 'Furniture', 'Computer', 'Other equipment'],
  utility: ['Electricity', 'Water', 'Internet', 'Gas', 'Telephone', 'Waste management', 'Other utilities'],
  maintenance: ['Machine servicing', 'Electrical repair', 'Plumbing', 'Replacement parts', 'Other repairs'],
  operational_purchase: ['Tools', 'Safety Equipment', 'Cleaning Supplies', 'Kitchen/Processing Supplies', 'Office Supplies', 'Packaging Supplies', 'Furniture', 'Other'],
  other_expense: ['Transportation', 'Printing', 'Delivery', 'Miscellaneous'],
};
const initialForm = { type: 'machinery', name: '', category: 'Equipment', supplier: '', date: new Date().toISOString().slice(0, 10), billingPeriod: '', billNumber: '', dueDate: '', paidDate: '', quantity: '', unitPrice: '', amount: '', paymentMethod: 'cash', paymentStatus: 'paid', warranty: '', usefulLifeMonths: '', notes: '', attachmentUrl: '' };
const money = (value: unknown) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

export default function AdminOperationsPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [form, setForm] = useState<any>(initialForm);
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [rowsResponse, reportResponse] = await Promise.all([
        adminAPI.getBusinessEntries({ page, limit: 10, search, type: typeFilter, paymentStatus: statusFilter, startDate: fromDate, endDate: toDate }),
        adminAPI.getMonthlyReport({ startDate: fromDate, endDate: toDate }),
      ]);
      const payload = rowsResponse.data?.data || {};
      setEntries(payload.rows || []);
      setTotal(payload.total || 0);
      setSummary(reportResponse.data?.data || null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to load operations');
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [page, search, typeFilter, statusFilter, fromDate, toDate]);

  const totals = useMemo(() => ({ operating: summary?.operatingExpenses || 0, utility: summary?.utilityCost || 0, maintenance: summary?.maintenanceCost || 0, purchases: summary?.operationalPurchaseCost || 0, machinery: summary?.machineryInvestment || 0 }), [summary]);
  const setField = (key: string, value: string) => setForm((current: any) => ({ ...current, [key]: value, ...(key === 'type' ? { category: categories[value]?.[0] || '' } : {}) }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = { ...form, amount: Number(form.amount || (Number(form.quantity || 0) * Number(form.unitPrice || 0))), quantity: form.quantity ? Number(form.quantity) : undefined, unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined };
      if (editing) await adminAPI.updateBusinessEntry(editing._id, payload); else await adminAPI.createBusinessEntry(payload);
      toast.success(editing ? 'Operation updated' : 'Operation saved'); setOpen(false); setEditing(null); setForm(initialForm); void load();
    } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to save operation'); }
  };
  const edit = (entry: any) => { setEditing(entry); setForm({ ...initialForm, ...entry, date: entry.date ? new Date(entry.date).toISOString().slice(0, 10) : initialForm.date }); setOpen(true); };
  const remove = async (id: string) => { if (!window.confirm('Delete this operation?')) return; try { await adminAPI.deleteBusinessEntry(id); toast.success('Operation deleted'); void load(); } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to delete operation'); } };
  const exportRows = async () => downloadExcel('operations.xlsx', [{ name: 'Operations', data: [['Date', 'Type', 'Item', 'Category', 'Amount', 'Status', 'Payment Method'], ...entries.map((item) => [item.date, item.type, item.name, item.category, item.amount, item.paymentStatus, item.paymentMethod])] }]);

  return <div className="space-y-6">
    <section className="rounded-[2rem] border border-slate-800/70 bg-slate-950/80 p-6 text-white shadow-xl"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs uppercase tracking-[0.3em] text-slate-400">Operations</p><h1 className="mt-2 text-3xl font-semibold">Business operating costs</h1><p className="mt-2 text-sm text-slate-400">Track expenses and capital purchases without duplicating Raw Materials or Production.</p></div><button onClick={() => { setEditing(null); setForm(initialForm); setOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-400"><Plus className="h-4 w-4" /> Add Operation</button></div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[['Total Operating Expense', totals.operating], ['Utility Expense', totals.utility], ['Maintenance Expense', totals.maintenance], ['Operational Purchases', totals.purchases], ['Machinery Investment', totals.machinery]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-xs uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-xl font-semibold">{money(value)}</p></div>)}</div></section>
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap gap-3"><label className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search operations" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm" /></label><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="">All types</option>{types.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="">All statuses</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="overdue">Overdue</option></select><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /><button onClick={exportRows} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Export Excel</button></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-3 py-3">Date</th><th>Type</th><th>Item / Description</th><th>Category</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">Loading operations...</td></tr> : entries.length === 0 ? <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">No operations found.</td></tr> : entries.map((item) => <tr key={item._id}><td className="px-3 py-4">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td><td>{types.find((type) => type.value === item.type)?.label || item.type}</td><td className="font-semibold text-slate-900">{item.name}</td><td>{item.category}</td><td className="font-semibold">{money(item.amount)}</td><td><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{item.paymentStatus || 'paid'}</span></td><td><div className="flex gap-2"><button title="View" onClick={() => setViewing(item)}><Eye className="h-4 w-4" /></button><button title="Edit" onClick={() => edit(item)}><Pencil className="h-4 w-4" /></button><button title="Delete" onClick={() => void remove(item._id)}><Trash2 className="h-4 w-4 text-rose-500" /></button></div></td></tr>)}</tbody></table></div><div className="mt-4 flex items-center justify-between text-sm text-slate-500"><span>{total} transactions</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">Previous</button><button disabled={page * 10 >= total} onClick={() => setPage((current) => current + 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">Next</button></div></div></section>
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold text-slate-900">Expense breakdown</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[['Utilities', totals.utility], ['Maintenance', totals.maintenance], ['Operational Purchases', totals.purchases], ['Other Expenses', summary?.otherExpenseCost || 0], ['Machinery Investment', totals.machinery]].map(([label, value]) => { const totalCost = Number(summary?.operatingExpenses || 0) + Number(summary?.machineryInvestment || 0); const percent = totalCost ? Number(value) / totalCost * 100 : 0; return <div key={String(label)} className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-lg font-semibold">{money(value)}</p><p className="mt-1 text-xs text-slate-400">{percent.toFixed(1)}% of operations</p></div>; })}</div></section>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><form onSubmit={submit} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.3em] text-slate-400">Operations</p><h2 className="mt-1 text-2xl font-semibold">{editing ? 'Edit operation' : 'Add operation'}</h2></div><button type="button" onClick={() => setOpen(false)}><X /></button></div><div className="mt-5 grid gap-4 md:grid-cols-2">{[['type','Operation Type'],['name','Item / Description'],['category','Category'],['supplier','Supplier'],['date','Date'],['billingPeriod','Billing Period'],['billNumber','Bill / Invoice Number'],['amount','Total Amount'],['paymentMethod','Payment Method'],['paymentStatus','Payment Status'],['warranty','Warranty'],['usefulLifeMonths','Useful Life (months)'],['notes','Notes'],['attachmentUrl','Attachment URL']].map(([key, label]) => <label key={key} className={key === 'notes' ? 'md:col-span-2' : ''}><span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>{key === 'type' ? <select value={form[key]} onChange={(e) => setField(key, e.target.value)} className="w-full rounded-xl border px-3 py-2.5">{types.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select> : key === 'category' ? <select value={form[key]} onChange={(e) => setField(key, e.target.value)} className="w-full rounded-xl border px-3 py-2.5">{(categories[form.type] || []).map((item) => <option key={item}>{item}</option>)}</select> : key === 'notes' ? <textarea value={form[key]} onChange={(e) => setField(key, e.target.value)} className="min-h-24 w-full rounded-xl border px-3 py-2.5" /> : <input type={key.toLowerCase().includes('date') ? 'date' : key === 'amount' || key === 'usefulLifeMonths' ? 'number' : 'text'} required={['name','category','date','amount'].includes(key)} value={form[key]} onChange={(e) => setField(key, e.target.value)} className="w-full rounded-xl border px-3 py-2.5" />}</label>)}</div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2.5">Cancel</button><button className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white">Save Operation</button></div></form></div>}
    {viewing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setViewing(null)}><div className="w-full max-w-lg rounded-[2rem] bg-white p-6" onClick={(e) => e.stopPropagation()}><div className="flex justify-between"><h2 className="text-2xl font-semibold">Operation details</h2><button onClick={() => setViewing(null)}><X /></button></div><dl className="mt-5 space-y-3 text-sm">{Object.entries(viewing).filter(([key]) => !['_id','__v','createdAt','updatedAt'].includes(key)).map(([key, value]) => <div key={key} className="flex justify-between gap-4 border-b pb-2"><dt className="capitalize text-slate-500">{key.replace(/[A-Z]/g, (letter) => ` ${letter}`)}</dt><dd className="text-right font-semibold text-slate-900">{String(value ?? '-')}</dd></div>)}</dl></div></div>}
  </div>;
}
