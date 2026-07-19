'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard } from 'lucide-react';
import { orderAPI } from '@/services/api';

const statusSteps = [
  { key: 'pending', label: 'Placed', description: 'Order received' },
  { key: 'processing', label: 'Processing', description: 'Preparing your order' },
  { key: 'shipped', label: 'Shipped', description: 'Order is on the way' },
  { key: 'delivered', label: 'Delivered', description: 'Order delivered successfully' },
];

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;

    const loadOrder = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await orderAPI.getById(orderId);
        const body = response?.data ?? response;
        const payload = body?.data ?? body;
        setOrder(payload ?? null);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Unable to load order details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const currentStatusIndex = useMemo(() => {
    if (!order) return 0;
    const status = String(order.orderStatus || order.status || 'pending').toLowerCase();
    const index = statusSteps.findIndex((step) => step.key === status);
    return index >= 0 ? index : 0;
  }, [order]);

  const orderStatusLabel = useMemo(() => {
    const rawStatus = String(order?.orderStatus || order?.status || 'pending').trim();
    return rawStatus ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1) : 'Pending';
  }, [order]);

  const orderTotal = Number(order?.total ?? 0) || 0;
  const orderSubtotal = Number(order?.subtotal ?? 0) || 0;
  const shippingCost = Number(order?.shippingCost ?? 0) || 0;
  const discountAmount = Number(order?.discountAmount ?? 0) || 0;
  const taxAmount = Number(order?.taxAmount ?? 0) || 0;

  return (
    <section className="space-y-8 px-4 py-8 lg:px-0">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm text-primary hover:text-secondary">
              <ArrowLeft className="h-4 w-4" /> Back to orders
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-slate-950">
              {order ? `Order ${order.orderNumber || order._id}` : `Order ${orderId}`}
            </h1>
            {order && (
              <p className="mt-2 text-sm text-slate-600">
                Placed on {new Date(order.createdAt).toLocaleDateString()} · Estimated delivery in 2 days
              </p>
            )}
          </div>
          {order && (
            <span className="rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700">
              {orderStatusLabel}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="mt-8 text-center py-16 text-slate-700">Loading order details…</div>
        ) : error ? (
          <div className="mt-8 rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">
            <p className="font-semibold">Unable to load order details.</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : order ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Shipping Address</p>
              <p className="mt-3 text-slate-900">{order.shippingAddress?.name || order.user?.name || 'Customer'}</p>
              <p className="text-slate-600">{order.shippingAddress?.street || ''}</p>
              <p className="text-slate-600">{order.shippingAddress?.city || ''}, {order.shippingAddress?.state || ''}</p>
              <p className="text-slate-600">{order.shippingAddress?.postalCode || ''}, {order.shippingAddress?.country || ''}</p>
              {order.shippingAddress?.phone && (
                <p className="mt-3 text-sm text-slate-500">Phone: {order.shippingAddress.phone}</p>
              )}
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Payment Method</p>
              <div className="mt-3 flex items-center gap-2 text-slate-900">
                <CreditCard className="h-4 w-4" />
                {order.paymentMethod?.toUpperCase() || 'N/A'}
              </div>
              <p className="mt-4 text-sm text-slate-500">Payment status</p>
              <p className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {String(order.paymentStatus || 'Pending').charAt(0).toUpperCase() + String(order.paymentStatus || 'Pending').slice(1)}
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Order Total</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">Rs {orderTotal}</p>
              <p className="mt-3 text-sm text-slate-600">{order.items?.length ?? 0} item(s)</p>
            </div>
          </div>
        ) : null}
      </div>

      {order && !isLoading && !error && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">Items in this order</h2>
            <div className="mt-6 space-y-4">
              {order.items?.map((item: any, index: number) => {
                const product = item.product || {};
                const imageUrl = product.images?.[0]?.url || product.thumbnail || '/placeholder.png';
                return (
                  <div key={`${product._id || item._id || index}`} className="flex gap-4 rounded-[1.75rem] border border-slate-200 p-4">
                    <img src={imageUrl} alt={product.name || item.name || 'Product'} className="h-20 w-20 rounded-2xl object-cover" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-950">{product.name || item.name || 'Product'}</p>
                      <p className="text-sm text-slate-600">Qty {item.quantity}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">Rs {item.price}</p>
                      {product?.description && <p className="mt-2 text-sm text-slate-600 line-clamp-2">{product.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90"
            >
              <CheckCircle2 className="h-4 w-4" /> Reorder
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-950">Delivery Timeline</h3>
              <div className="mt-6 space-y-4">
                {statusSteps.map((step, index) => {
                  const isComplete = index <= currentStatusIndex;
                  return (
                    <div key={step.key} className="flex items-center gap-4">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${isComplete ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{step.label}</p>
                        <p className="text-sm text-slate-600">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-950">Order summary</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex justify-between"><span>Subtotal</span><span>Rs {orderSubtotal}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>Rs {shippingCost}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>Rs {taxAmount}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>-Rs {discountAmount}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-3 font-semibold"><span>Total</span><span>Rs {orderTotal}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
