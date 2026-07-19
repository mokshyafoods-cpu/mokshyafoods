'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { productAPI } from '@/services/api';
import { Package, PlusCircle } from 'lucide-react';
import ProductRow from '@/components/admin/ProductRow';

const placeholder = '/placeholder.jpg';

const getProductImage = (product: any) => product.thumbnail || product.images?.[0]?.url || placeholder;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAll({ includeInactive: true });
      const payload = response?.data?.data ?? response?.data ?? [];
      setProducts(Array.isArray(payload) ? payload : []);
      setError('');
    } catch (err: any) {
      console.error('Failed to load products', err);
      setError(err.response?.data?.message || 'Unable to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productAPI.delete(productId);
      setProducts((current) => current.filter((product) => product._id !== productId));
      toast.success('Product deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete product', err);
      toast.error(err.response?.data?.message || 'Unable to delete product');
    }
  };

  const handleToggleStatus = async (productId: string, isActive: boolean) => {
    try {
      const response = await productAPI.update(productId, { isActive });
      const updatedProduct = response?.data?.data ?? response?.data ?? null;
      setProducts((current) => current.map((product) => {
        if (product._id !== productId) return product;
        return { ...product, ...(updatedProduct || {}), isActive };
      }));
      toast.success(isActive ? 'Product activated' : 'Product deactivated');
    } catch (err: any) {
      console.error('Failed to update product visibility', err);
      toast.error(err.response?.data?.message || 'Unable to update product visibility');
    }
  };

  const filteredProducts = products.filter((product) => {
    const isActive = product.isActive !== false;
    if (statusFilter === 'active') return isActive;
    if (statusFilter === 'inactive') return !isActive;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Products</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">Product Catalog</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-500">
              Manage inventory, edit product details, and remove outdated items from one place.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Product
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl">
            Loading products...
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-10 text-center text-red-700 shadow-xl">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl">
            <p className="text-lg font-semibold text-slate-900">No products available yet.</p>
            <p className="mt-3 text-sm text-slate-500">Create a product to see it listed here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-xl">
            <div className="min-w-[840px]">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-6 py-4">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'active', label: 'Active' },
                  { key: 'inactive', label: 'Inactive' },
                ].map((filter) => {
                  const active = statusFilter === filter.key;
                  return (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setStatusFilter(filter.key as 'all' | 'active' | 'inactive')}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${active ? 'bg-primary text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-0 border-b border-slate-200 bg-slate-100 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 sm:grid-cols-[3fr_1fr_1fr_1fr]">
                <span>Product</span>
                <span>Price</span>
                <span>Stock</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-slate-200">
                {filteredProducts.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">
                    No products match this filter.
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <ProductRow key={product._id} product={product} onDelete={handleDelete} onToggleStatus={handleToggleStatus} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
