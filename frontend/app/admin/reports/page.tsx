'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '@/services/api';
import { toast } from 'sonner';

export default function AdminReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadReport = async (nextStartDate = startDate, nextEndDate = endDate) => {
    try {
      const response = await adminAPI.getMonthlyReport({ startDate: nextStartDate, endDate: nextEndDate });
      setReport(response.data?.data ?? null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to load report');
    }
  };

  useEffect(() => {
    void loadReport();
  }, [startDate, endDate]);

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

  const exportExcel = async () => {
    if (!report) return;

    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    const summaryRows = [
      ['Metric', 'Value'],
      ['Raw material spend', report.rawMaterialSpend || 0],
      ['Website sales', report.websiteSales || 0],
      ['POS sales', report.posSales || 0],
      ['Total sales', report.totalSales || 0],
      ['Partner products taken', report.partnerProductsTakenCount || 0],
      ['Partner sales value', report.partnerSalesValue || 0],
      ['Order count', report.ordersCount || 0],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    const rawMaterialSheetData = [
      ['Raw material', 'Spend'],
      ...Object.entries(report.rawMaterialBreakdown || {}).map(([name, value]) => [name, value]),
    ];
    const rawMaterialSheet = XLSX.utils.aoa_to_sheet(rawMaterialSheetData);
    XLSX.utils.book_append_sheet(workbook, rawMaterialSheet, 'Raw Materials');

    const productionSheetData = [
      ['Product', 'Quantity Produced'],
      ...Object.entries(report.productionByProduct || {}).map(([name, quantity]) => [name, quantity]),
    ];
    const productionSheet = XLSX.utils.aoa_to_sheet(productionSheetData);
    XLSX.utils.book_append_sheet(workbook, productionSheet, 'Production');

    const rawMaterialsData = Array.isArray(report.rawMaterials)
      ? [
          ['Name', 'Purchase Date', 'Total Cost', 'Vendor', 'Notes'],
          ...report.rawMaterials.map((item: any) => [
            item.name || '',
            item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : '',
            item.totalCost || 0,
            item.vendor || '',
            item.notes || '',
          ]),
        ]
      : [];
    if (rawMaterialsData.length > 1) {
      const rawMaterialsSheet = XLSX.utils.aoa_to_sheet(rawMaterialsData);
      XLSX.utils.book_append_sheet(workbook, rawMaterialsSheet, 'Raw Material Purchases');
    }

    const productionBatchesData = Array.isArray(report.productionBatches)
      ? [
          ['Batch Number', 'Product', 'Quantity Produced', 'Production Date', 'Staff In Charge'],
          ...report.productionBatches.map((batch: any) => [
            batch.batchNumber || '',
            batch.productName || '',
            batch.quantityProduced || 0,
            batch.productionDate ? new Date(batch.productionDate).toLocaleDateString() : '',
            batch.staffInCharge || '',
          ]),
        ]
      : [];
    if (productionBatchesData.length > 1) {
      const productionBatchesSheet = XLSX.utils.aoa_to_sheet(productionBatchesData);
      XLSX.utils.book_append_sheet(workbook, productionBatchesSheet, 'Production Batches');
    }

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'business-report.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  };

  const breakdownEntries = useMemo(() => Object.entries(report?.rawMaterialBreakdown || {}), [report]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Reports</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Business Performance</h1>
            <p className="mt-2 text-sm text-slate-500">Monitor revenue, production, purchases, and sales metrics across channels.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200" />
            </div>
            <button onClick={exportExcel} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Export Excel</button>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Export CSV</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Raw Material Spend</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">Rs {Number(report?.rawMaterialSpend || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Total Produced</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{Object.values(report?.productionByProduct || {}).reduce((sum: number, value: any) => sum + Number(value || 0), 0)}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Website Sales</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">Rs {Number(report?.websiteSales || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">POS Sales</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">Rs {Number(report?.posSales || 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Raw Material Spend Breakdown</h2>
          <div className="mt-5 space-y-2">
            {breakdownEntries.length === 0 ? <p className="text-sm text-slate-500">No data for selected range.</p> : breakdownEntries.map(([name, value]) => (
              <div key={name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span className="font-medium text-slate-800">{name}</span>
                <span className="font-semibold text-slate-900">Rs {Number(value || 0).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Production by Product</h2>
          <div className="mt-5 space-y-2">
            {Object.entries(report?.productionByProduct || {}).length === 0 ? <p className="text-sm text-slate-500">No production data for selected range.</p> : Object.entries(report.productionByProduct || {}).map(([name, quantity]) => (
              <div key={name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span className="font-medium text-slate-800">{name}</span>
                <span className="font-semibold text-slate-900">{Number(quantity || 0)} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
