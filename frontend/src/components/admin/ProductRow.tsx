'use client';

import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { productAPI } from '@/services/api';

interface Props {
  product: any;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void | Promise<void>;
}

const placeholder = '/placeholder.jpg';
const getProductImage = (product: any) => product.thumbnail || product.images?.[0]?.url || placeholder;
const getCategoryLabel = (product: any) => {
  const value = product?.category;
  if (!value) return 'Uncategorized';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value.name || value.slug || value.title || value.value || value.key || 'Uncategorized';
  }
  return String(value) || 'Uncategorized';
};

export default function ProductRow({ product, onDelete, onToggleStatus }: Props) {
  const isActive = product.isActive !== false;
  return (
    <div className="grid gap-4 px-6 py-5 sm:grid-cols-[3fr_1fr_1fr_1fr] items-center">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-3xl bg-slate-100">
          <img src={getProductImage(product)} alt={product.name} className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">{product.name}</p>
          <p className="text-sm text-slate-500">SKU: {product.sku}</p>
          <p className="text-sm text-slate-500">{getCategoryLabel(product)}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
            <button
              type="button"
              onClick={() => onToggleStatus(product._id, !isActive)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
            >
              {isActive ? 'Set inactive' : 'Set active'}
            </button>
          </div>
        </div>
      </div>
      <div className="text-slate-900">{product.discountPrice ? (
        <div>
          <div className="text-sm line-through text-slate-500">Rs. {product.price?.toFixed?.(0) || 0}</div>
          <div className="font-semibold text-secondary">Rs. {product.discountPrice?.toFixed?.(0)}</div>
        </div>
      ) : (
        <>Rs. {product.price?.toFixed?.(0) || 0}</>
      )}</div>
      <div className="text-slate-900">{product.quantity ?? 0}</div>
      <div className="flex justify-end gap-2">
        <Link
          href={`/admin/products/${product._id}`}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
        <button
          type="button"
          onClick={() => onDelete(product._id)}
          className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );
}
