'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '@/services/api';
import { downloadExcel } from '@/lib/excel';
import { toast } from 'sonner';
import { Printer, FileSpreadsheet, RefreshCcw } from 'lucide-react';

const money = (value: unknown) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
const dateValue = (date: Date) => date.toISOString().slice(0, 10);
const periods = [
  ['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['lastMonth', 'Last Month'], ['quarter', 'This Quarter'], ['year', 'This Year'], ['custom', 'Custom Range'],
];

export default function AdminReportsPage() {
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState(() => dateValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [endDate, setEndDate] = useState(() => dateValue(new Date()));
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const applyPeriod = (value: string) => {
    setPeriod(value);
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), 1);
    let end = now;
    if (value === 'today') start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (value === 'week') { start = new Date(now); start.setDate(now.getDate() - now.getDay()); }
    if (value === 'lastMonth') { start = new Date(now.getFullYear(), now.getMonth() - 1, 1); end = new Date(now.getFullYear(), now.getMonth(), 0); }
    if (value === 'quarter') { start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); }
    if (value === 'year') start = new Date(now.getFullYear(), 0, 1);
    if (value !== 'custom') { setStartDate(dateValue(start)); setEndDate(dateValue(end)); }
  };
  const load = async () => { setLoading(true); try { const response = await adminAPI.getMonthlyReport({ startDate, endDate }); setReport(response.data?.data || null); } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to load report'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [startDate, endDate]);

  const expenseRows = useMemo(() => [
    ['Raw Materials', report?.rawMaterialSpend || 0], ['Utilities', report?.utilityCost || 0], ['Maintenance', report?.maintenanceCost || 0], ['Operational Purchases', report?.operationalPurchaseCost || 0], ['Other Expenses', report?.otherExpenseCost || 0], ['Machinery', report?.machineryInvestment || 0],
  ], [report]);
  const exportExcel = async () => downloadExcel('business-report.xlsx', [{ name: 'Summary', data: [['Mokshya Foods Business Report'], ['Period', `${startDate} to ${endDate}`], ['Total Revenue', report?.totalSales || 0], ['Raw Material Cost', report?.rawMaterialSpend || 0], ['Operating Expenses', report?.operatingExpenses || 0], ['Machinery Investment', report?.machineryInvestment || 0], ['Total Business Cost', report?.totalBusinessCost || 0], ['Net Profit', report?.netProfit || 0], ['Profit Margin %', report?.profitMargin || 0]] }, { name: 'Expenses', data: [['Category', 'Amount'], ...expenseRows] }, { name: 'Operations', data: [['Date', 'Type', 'Name', 'Amount'], ...(report?.operations || []).map((item: any) => [item.date, item.type, item.name, item.amount])] }] );
  const print = () => window.print();
  const productionTotal = Object.values(report?.productionByProduct || {}).reduce((sum: number, value: any) => sum + Number(value || 0), 0);
  const kpis = [['Total Revenue', report?.totalSales], ['Total Business Cost', report?.totalBusinessCost], ['Operating Expenses', report?.operatingExpenses], ['Net Profit / Surplus', report?.netProfit], ['Profit Margin', `${Number(report?.profitMargin || 0).toFixed(1)}%`], ['Machinery Investment', report?.machineryInvestment]];

  return <div className="space-y-6 print:bg-white">
    <header className="rounded-[2rem] border border-slate-800/70 bg-slate-950/80 p-6 text-white shadow-xl"><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reports</p><h1 className="mt-2 text-3xl font-semibold">Business performance</h1><p className="mt-2 text-sm text-slate-400">Revenue, costs, operations, production, and profit from the selected period.</p></div><div className="flex flex-wrap gap-2">{periods.map(([value, label]) => <button key={value} onClick={() => applyPeriod(value)} className={`rounded-xl px-3 py-2 text-xs font-semibold ${period === value ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-300'}`}>{label}</button>)}</div></div><div className="mt-4 flex flex-wrap items-center gap-3"><input type="date" value={startDate} onChange={(e) => { setPeriod('custom'); setStartDate(e.target.value); }} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /><span className="text-slate-500">to</span><input type="date" value={endDate} onChange={(e) => { setPeriod('custom'); setEndDate(e.target.value); }} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm"><RefreshCcw className="h-4 w-4" /> Refresh</button><button onClick={() => void exportExcel()} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900"><FileSpreadsheet className="h-4 w-4" /> Export Excel</button><button onClick={print} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm"><Printer className="h-4 w-4" /> Export PDF</button><button onClick={print} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm"><Printer className="h-4 w-4" /> Print Report</button></div></header>
    {loading && <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm">Loading report...</div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">{kpis.map(([label, value]) => <div key={String(label)} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p><p className="mt-3 text-2xl font-semibold text-slate-900">{typeof value === 'string' ? value : money(value)}</p></div>)}</div>
    <div className="grid gap-6 xl:grid-cols-2"><section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Revenue vs Cost</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-sm text-emerald-700">Revenue</p><p className="mt-2 text-2xl font-semibold text-emerald-900">{money(report?.totalSales)}</p></div><div className="rounded-2xl bg-rose-50 p-4"><p className="text-sm text-rose-700">Applicable costs</p><p className="mt-2 text-2xl font-semibold text-rose-900">{money(report?.totalBusinessCost)}</p></div><div className="rounded-2xl bg-slate-100 p-4"><p className="text-sm text-slate-600">Profit</p><p className="mt-2 text-2xl font-semibold">{money(report?.netProfit)}</p></div></div><div className="mt-6 h-5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, Number(report?.totalSales || 0) / Math.max(1, Number(report?.totalSales || 0) + Number(report?.totalBusinessCost || 0)) * 100))}%` }} /></div></section><section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Sales source analysis</h2><div className="mt-5 space-y-3">{[['Website Sales', report?.websiteSales], ['POS Sales', report?.posSales], ['Total Sales', report?.totalSales]].map(([label, value]) => <div key={String(label)} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span>{label}</span><strong>{money(value)}</strong></div>)}</div></section></div>
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Cost breakdown</h2><p className="mt-1 text-sm text-slate-500">Raw Materials and Production remain sourced from their dedicated modules.</p></div><span className="text-sm font-semibold text-slate-500">Total {money(report?.totalBusinessCost)}</span></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{expenseRows.map(([label, value]) => { const total = Number(report?.totalBusinessCost || 0) + Number(report?.machineryInvestment || 0); return <div key={String(label)} className="rounded-2xl border border-slate-100 p-4"><div className="flex justify-between text-sm"><span>{label}</span><strong>{money(value)}</strong></div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-500" style={{ width: `${total ? Math.min(100, Number(value) / total * 100) : 0}%` }} /></div><p className="mt-2 text-xs text-slate-400">{total ? (Number(value) / total * 100).toFixed(1) : '0.0'}% of combined costs</p></div>; })}</div></section>
    <div className="grid gap-6 xl:grid-cols-2"><section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Profit & Loss Summary</h2><dl className="mt-5 space-y-3 text-sm">{[['Revenue', report?.totalSales], ['Raw Material Cost', report?.rawMaterialSpend], ['Operating Expenses', report?.operatingExpenses], ['Estimated Net Profit', report?.netProfit]].map(([label, value]) => <div key={String(label)} className="flex justify-between border-b pb-3"><dt>{label}</dt><dd className="font-semibold">{money(value)}</dd></div>)}</dl></section><section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Production & activity</h2><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Units produced</p><p className="mt-2 text-2xl font-semibold">{productionTotal}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Orders</p><p className="mt-2 text-2xl font-semibold">{report?.ordersCount || 0}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Operations</p><p className="mt-2 text-2xl font-semibold">{report?.operations?.length || 0}</p></div></div></section></div>
  </div>;
}
