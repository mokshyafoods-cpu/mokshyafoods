'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCartStore } from '@/context/cartStore';
import Link from 'next/link';
import { Trash2, Minus, Plus } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation />
        <main className="flex-grow flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-primary">Your Cart is Empty</h1>
            <p className="text-muted-foreground">Add some delicious products to get started!</p>
            <Link href="/products" className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition font-semibold">
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />

      <main className="flex-grow py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-8">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
                {items.map((item, idx) => {
                  const detailCategory = item.category || 'Uncategorized';
                  const detailWeight = item.weight || '';
                  const detailStock = typeof item.stock === 'number' ? item.stock : null;
                  const detailDescription = item.description || '';
                  const detailPrice = Number(item.price || 0);
                  const detailCompareAtPrice = Number(item.compareAtPrice || 0);
                  const detailImage = item.image || item.thumbnail || '/placeholder.jpg';
                  const detailSku = item.sku || '';
                  const isOnSale = Boolean(item.onSale || (item.compareAtPrice && detailCompareAtPrice > detailPrice));

                  return (
                    <div key={item.productId} className="p-6 border-b border-slate-200 last:border-b-0 flex flex-col gap-6 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-semibold text-white bg-primary rounded-full w-8 h-8 flex items-center justify-center">{idx + 1}</div>
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                          <img src={detailImage} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      </div>

                      <div className="flex-grow">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-950">{item.name}</h3>
                          {detailSku ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">SKU {detailSku}</span> : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                          <span className="rounded-full bg-amber-50 px-3 py-1">{detailCategory}</span>
                          {detailWeight ? <span className="rounded-full bg-slate-100 px-3 py-1">Weight: {detailWeight}</span> : null}
                          {detailStock !== null ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">In stock: {detailStock}</span> : null}
                        </div>
                        {detailDescription ? <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-3">{detailDescription}</p> : null}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                          <span className="font-semibold text-slate-950">Rs. {detailPrice}</span>
                          {detailCompareAtPrice > detailPrice ? (
                            <span className="text-slate-500 line-through">Rs. {detailCompareAtPrice}</span>
                          ) : null}
                          {isOnSale ? <span className="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-700">On sale</span> : null}
                        </div>
                      </div>

                    <div className="flex flex-col items-end gap-4">
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="rounded-full bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="min-w-[2.5rem] rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-slate-950 shadow-sm border border-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="rounded-full bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId)}
                        className="rounded-full p-2 text-rose-600 transition hover:bg-rose-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-20 space-y-4">
                <h2 className="text-xl font-bold text-slate-950">Order Summary</h2>

                <div className="space-y-2 border-b border-border pb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-semibold">{getTotalItems()}</span>
                  </div>
                </div>

                <div className="flex justify-between text-lg font-bold text-primary">
                  <span>Total items</span>
                  <span>{getTotalItems()}</span>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition font-semibold text-center"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href="/products"
                  className="block w-full px-4 py-3 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition font-semibold text-center"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
