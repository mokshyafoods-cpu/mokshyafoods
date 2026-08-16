'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '@/services/api';
import { RefreshCcw, Search, Plus, Minus, Package, AlertTriangle } from 'lucide-react';

const getProductImage = (product: any) => product?.thumbnail || product?.images?.[0]?.url || '/placeholder.jpg';

export default function AdminLowStockPage() {
  const [threshold, setThreshold] = useState(10);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [restockInputs, setRestockInputs] = useState<Record<string, number>>({});
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
      || product.category?.name?.toLowerCase().includes(term)
    );
  }, [products, search]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a: any, b: any) => {
      const stockA = Number(a.quantity || 0);
      const stockB = Number(b.quantity || 0);
      if (stockA !== stockB) return stockA - stockB;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }, [filteredProducts]);

  const criticalCount = sortedProducts.filter((product: any) => Number(product.quantity || 0) <= Math.max(0, Math.floor(threshold / 2))).length;
  const watchCount = sortedProducts.filter((product: any) => Number(product.quantity || 0) > Math.max(0, Math.floor(threshold / 2)) && Number(product.quantity || 0) <= threshold).length;

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
  const pagedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedProducts.slice(start, start + PAGE_SIZE);
  }, [sortedProducts, page]);

  useEffect(() => {
    setPage(1);
  }, [search, threshold]);

  const lowAlertCount = sortedProducts.length;

  const handleStockUpdate = async (productId: string, increment: number) => {
    const product = products.find((item: any) => item._id === productId);
    if (!product) return;
    const newQuantity = Math.max(0, product.quantity + increment);
    await adminAPI.updateStock(productId, { quantity: newQuantity });
    await mutate();
  };

  const handleRestock = async (product: any) => {
    const productId = product?._id;
    if (!productId) return;

    const amount = Number(restockInputs[productId] ?? 1);
    if (!Number.isFinite(amount) || amount <= 0) {
      setRestockInputs((prev) => ({ ...prev, [productId]: 1 }));
      return;
    }

    await adminAPI.updateStock(productId, { quantity: Number(product.quantity || 0) + amount });
    setRestockInputs((prev) => ({ ...prev, [productId]: 1 }));
    await mutate();
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Low stock</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">Inventory alerts</h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-500">
              Review products running low, check the item image and stock level, and add restock quantity instantly from this dashboard.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[160px_1fr] lg:min-w-[420px]">
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.25em] text-rose-500">Critical</p>
          <p className="mt-3 text-3xl font-semibold text-rose-700">{criticalCount}</p>
          <p className="mt-1 text-sm text-rose-600">Products at or below half the threshold</p>
        </div>
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-600">Watchlist</p>
          <p className="mt-3 text-3xl font-semibold text-amber-700">{watchCount}</p>
          <p className="mt-1 text-sm text-amber-600">Products approaching the danger zone</p>
        </div>
        <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-600">Needs reorder</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-700">{lowAlertCount}</p>
          <p className="mt-1 text-sm text-emerald-600">Total items currently under the target stock level</p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-xl">Loading low stock products...</div>
      ) : error ? (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-10 text-center text-red-700 shadow-xl">Unable to load low stock products.</div>
      ) : pagedProducts.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xl">No low stock products found.</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {pagedProducts.map((product: any) => {
            const qty = Number(product.quantity || 0);
            const reorderNeeded = Math.max(0, threshold - qty);
            const image = getProductImage(product);

            return (
              <div key={product._id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
                <div className="flex h-52 w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
                  {image ? (
                    <img src={image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-[1.5rem] bg-white text-slate-400 shadow-sm">
                      <Package className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div className="space-y-5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{product.name}</h2>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{product.sku || 'No SKU'}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${qty <= Math.max(0, Math.floor(threshold / 2)) ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200' : qty <= threshold ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'}`}>
                      {qty <= Math.max(0, Math.floor(threshold / 2)) ? 'Critical' : qty <= threshold ? 'Watch' : 'Healthy'}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Current stock</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{qty}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Threshold</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{threshold}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Need</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{reorderNeeded}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      {reorderNeeded > 0 ? `Restock by ${reorderNeeded} units to meet the target threshold.` : 'Stock is meeting the target threshold.'}
                    </div>
                    <p className="mt-2 text-slate-500">{product.category?.name || 'Uncategorized'} • {product.description || 'No description available'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={restockInputs[product._id] ?? 1}
                      onChange={(e) => setRestockInputs((prev) => ({ ...prev, [product._id]: Number(e.target.value) || 1 }))}
                      className="w-28 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => handleRestock(product)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <Plus className="h-4 w-4" /> Add stock
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStockUpdate(product._id, 1)}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                      aria-label={`Increase stock for ${product.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStockUpdate(product._id, -1)}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                      aria-label={`Decrease stock for ${product.name}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
