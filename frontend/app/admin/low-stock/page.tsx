'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '@/services/api';
import { RefreshCcw, Search, ArrowUpRight, Plus, Minus } from 'lucide-react';

export default function AdminLowStockPage() {
  const [threshold, setThreshold] = useState(10);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const { data, error, isLoading, mutate } = useSWR(
    ['admin-low-stock', threshold],
    () => adminAPI.getLowStock(threshold).then((response) => response.data)
  );

  const products = Array.isArray(data?.data) ? data.data : [];

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const term = search.trim().toLowerCase();
    return products.filter((product: any) =>
      product.name?.toLowerCase().includes(term)
      || product.sku?.toLowerCase().includes(term)
      || product.description?.toLowerCase().includes(term)
    );
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pagedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  useEffect(() => {
    setPage(1);
  }, [search, threshold]);

  const lowAlertCount = filteredProducts.length;

  const handleStockUpdate = async (productId: string, increment: number) => {
    const product = products.find((item: any) => item._id === productId);
    if (!product) return;
    const newQuantity = Math.max(0, product.quantity + increment);
    await adminAPI.updateStock(productId, { quantity: newQuantity });
    await mutate();
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Low stock</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">Inventory Alerts</h1>
            <p className="mt-4 text-sm text-slate-500">
              Review products running low and adjust stock levels directly from the admin dashboard.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[180px_auto]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Threshold</label>
              <input
                type="number"
                min={0}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Search</label>
              <div className="mt-2 flex items-center gap-2 rounded-2xl bg-white px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products"
                  className="w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        <div className="min-w-[860px]">
          <div className="grid gap-0 border-b border-slate-200 bg-slate-100 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 sm:grid-cols-[2fr_1fr_1fr_1fr_120px]">
            <span>Product</span>
            <span>SKU</span>
            <span>Stock</span>
            <span>Category</span>
            <span className="text-right">Actions</span>
          </div>

        {isLoading ? (
          <div className="p-10 text-center text-slate-500">Loading low stock products...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-700">Unable to load low stock products.</div>
        ) : pagedProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No low stock products found.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {pagedProducts.map((product: any) => (
              <div key={product._id} className="grid items-center gap-4 px-6 py-5 sm:grid-cols-[2fr_1fr_1fr_1fr_120px]">
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{product.description || 'No description'}</p>
                </div>
                <div className="text-slate-900">{product.sku}</div>
                <div className="text-slate-900">{product.quantity}</div>
                <div className="text-slate-900">{product.category?.name || 'Uncategorized'}</div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleStockUpdate(product._id, 1)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStockUpdate(product._id, -1)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-500">
        <div>{lowAlertCount} low stock items shown.</div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 disabled:opacity-50">Previous</button>
          <span className="text-sm font-semibold text-slate-700">Page {page} / {totalPages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 disabled:opacity-50">Next</button>
          <button
            type="button"
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
