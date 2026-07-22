'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '@/services/api';
import { toast } from 'sonner';

export default function AdminReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadReport = async () => {
    try {
      const response = await adminAPI.getMonthlyReport({ startDate, endDate });
      setReport(response.data?.data ?? null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to load report');
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ['Metric', 'Value'],
      ['Raw material spend', report.rawMaterialSpend || 0],
      ['Website sales', report.websiteSales || 0],
      ['POS sales', report.posSales || 0],
      ['Total sales', report.totalSales || 0],
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'business-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const breakdownEntries = useMemo(() => Object.entries(report?.rawMaterialBreakdown || {}), [report]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/70 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Reports</p>
            <h1 className="mt-2 text-3xl font-semibold">Business performance</h1>
          </div>
          <div className="flex gap-3">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <button onClick={loadReport} className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white">Apply</button>
            <button onClick={exportCsv} className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Export CSV</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Raw spend</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">Rs. {report?.rawMaterialSpend || 0}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Produced</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{Object.values(report?.productionByProduct || {}).reduce((sum: number, value: any) => sum + Number(value || 0), 0)}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Website sales</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">Rs. {report?.websiteSales || 0}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">POS sales</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">Rs. {report?.posSales || 0}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Raw material spend breakdown</h2>
          <div className="mt-4 space-y-2">
            {breakdownEntries.length === 0 ? <p className="text-sm text-slate-500">No data for selected range.</p> : breakdownEntries.map(([name, value]) => (
              <div key={name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span>{name}</span>
                <span>Rs. {value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Production by product</h2>
          <div className="mt-4 space-y-2">
            {Object.entries(report?.productionByProduct || {}).length === 0 ? <p className="text-sm text-slate-500">No production data for selected range.</p> : Object.entries(report.productionByProduct || {}).map(([name, quantity]) => (
              <div key={name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span>{name}</span>
                <span>{quantity} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
