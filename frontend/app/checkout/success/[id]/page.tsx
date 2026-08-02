'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { orderAPI } from '@/services/api';
import { CheckCircle2, Package, Truck, CreditCard } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const params = useParams();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const loadOrder = async () => {
      try {
        const response = await orderAPI.getById(orderId);
        const payload = response?.data?.data ?? response?.data ?? response;
        setOrder(payload ?? null);
      } catch (error) {
        console.error('Failed to load order confirmation', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const subtotal = Number(order?.subtotal ?? 0) || 0;
  const deliveryCharge = Number(order?.deliveryCharge ?? order?.shippingCost ?? 0) || 0;
  const total = Number(order?.total ?? subtotal + deliveryCharge) || 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      <main className="flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Order placed successfully
              </div>
              <h1 className="mt-4 text-3xl font-bold text-slate-950">Thank you for your order</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600">
                Your order has been received and is now being prepared. We will send a confirmation email shortly.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Order number</p>
              <p className="mt-1 font-mono text-slate-700">{order?.orderNumber || orderId}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
              Loading your order confirmation...
            </div>
          ) : order ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-slate-950">Order details</h2>
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    {order.items?.map((item: any, index: number) => (
                      <div key={`${item.productId || index}`} className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
                        <div>
                          <p className="font-semibold text-slate-900">{item.name || 'Product'}</p>
                          <p className="text-slate-500">Qty: {item.quantity || 1}</p>
                        </div>
                        <p className="font-semibold text-slate-900">RS {Number(item.subtotal || 0).toFixed(0)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-slate-950">Payment</h2>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <p><span className="font-semibold text-slate-900">Payment method:</span> Cash on Delivery</p>
                    <p>Please pay in cash when your order is delivered.</p>
                    <p><span className="font-semibold text-slate-900">Payment status:</span> Pending</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-slate-950">Delivery</h2>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{order.shippingAddress?.name || 'Customer'}</p>
                    <p>{order.shippingAddress?.street || ''}</p>
                    <p>{order.shippingAddress?.city || ''}, {order.shippingAddress?.state || ''}</p>
                    <p>{order.shippingAddress?.postalCode || ''}, {order.shippingAddress?.country || ''}</p>
                    <p className="pt-2">Phone: {order.shippingAddress?.phone || order.user?.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-lg font-semibold text-slate-950">Order summary</h2>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex justify-between"><span>Subtotal</span><span>RS {subtotal.toFixed(0)}</span></div>
                    <div className="flex justify-between"><span>Delivery charge</span><span>RS {deliveryCharge.toFixed(0)}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-3 font-semibold text-slate-900"><span>Total</span><span>RS {total.toFixed(0)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
              We could not load your order confirmation details. Please check your order history for updates.
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/orders" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">View my orders</Link>
            <Link href="/products" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Continue shopping</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
