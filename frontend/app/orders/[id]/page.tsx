'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, XCircle, Package, Truck, Clock } from 'lucide-react';
import { orderAPI } from '@/services/api';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AddToCartButton from '@/components/AddToCartButton';

const statusSteps = [
  { key: 'pending', label: 'Pending', description: 'Order received' },
  { key: 'processing', label: 'Processing', description: 'Preparing your order' },
  { key: 'shipped', label: 'Shipping', description: 'Order is on the way' },
  { key: 'delivered', label: 'Delivered', description: 'Order delivered' },
];

const getOrderItemImage = (item: any): string => {
  const product = item?.product || {};
  const productData = item?.productData || {};
  const imageCandidates = [
    item?.image,
    item?.thumbnail,
    item?.productImage,
    productData?.thumbnail,
    productData?.image,
    productData?.images?.[0]?.url,
    productData?.images?.[0]?.secure_url,
    productData?.images?.[0]?.path,
    product?.image,
    product?.thumbnail,
    product?.images?.[0]?.url,
    product?.images?.[0]?.secure_url,
    product?.images?.[0]?.path,
    item?.images?.[0]?.url,
    item?.images?.[0]?.secure_url,
    item?.images?.[0]?.path,
  ];

  const safeImage = imageCandidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  return safeImage || '/placeholder.jpg';
};

export default function PublicOrderDetailPage() {
  const params = useParams();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      <main className="flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href="/products" className="inline-flex items-center gap-2 text-sm text-primary hover:text-secondary">
                  <ArrowLeft className="h-4 w-4" /> Continue Shopping
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
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    order.orderStatus === 'processing' ? 'bg-amber-100 text-amber-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {orderStatusLabel}
                  </span>
                  {['pending', 'processing'].includes(String(order.orderStatus || order.status || '').toLowerCase()) && (
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={async () => {
                        const reason = window.prompt('Please provide a cancellation reason.');
                        if (!reason?.trim()) {
                          toast.error('Cancellation reason is required');
                          return;
                        }
                        setIsCancelling(true);
                        try {
                          const response = await orderAPI.cancel(orderId, reason.trim());
                          const payload = response?.data?.data ?? response?.data ?? response;
                          setOrder(payload ?? order);
                          toast.success('Order cancelled successfully');
                        } catch (cancelError: any) {
                          const message = cancelError?.response?.data?.message || cancelError?.message || 'Unable to cancel order';
                          toast.error(message);
                        } finally {
                          setIsCancelling(false);
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      {isCancelling ? 'Cancelling...' : 'Cancel order'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Loading/Error States */}
          {isLoading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-medium text-slate-700">Loading order details…</p>
            </div>
          ) : error ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-sm">
              <p className="font-semibold text-rose-700">Unable to load order details.</p>
              <p className="mt-2 text-sm text-rose-600">{error}</p>
            </div>
          ) : order ? (
            <>
              {/* Order Status Timeline - Column View */}
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950 mb-6">Order Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {statusSteps.map((step, index) => {
                    const isComplete = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    return (
                      <div key={step.key} className={`p-4 rounded-[1.5rem] border-2 text-center transition ${
                        isComplete
                          ? 'bg-primary/5 border-primary'
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full mb-3 ${
                          isComplete
                            ? isCurrent ? 'bg-primary text-white animate-pulse' : 'bg-green-500 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}>
                          {isComplete && isCurrent ? <Clock className="h-6 w-6" /> :
                           isComplete ? <CheckCircle2 className="h-6 w-6" /> :
                           <div className="h-3 w-3 rounded-full bg-current" />}
                        </div>
                        <p className={`font-semibold text-sm ${isComplete ? 'text-slate-950' : 'text-slate-600'}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-slate-600 mt-2">{step.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Details Grid */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500 font-semibold">DELIVERY ADDRESS</p>
                  <p className="mt-3 font-semibold text-slate-900">{order.shippingAddress?.name || order.user?.name || 'Customer'}</p>
                  <p className="text-sm text-slate-600 mt-2">{order.shippingAddress?.street || ''}</p>
                  <p className="text-sm text-slate-600">{order.shippingAddress?.city || ''}, {order.shippingAddress?.state || ''}</p>
                  <p className="text-sm text-slate-600">{order.shippingAddress?.postalCode || ''}, {order.shippingAddress?.country || ''}</p>
                  {order.shippingAddress?.phone && (
                    <p className="mt-3 text-sm text-slate-500">Phone: {order.shippingAddress.phone}</p>
                  )}
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500 font-semibold">PAYMENT</p>
                  <div className="mt-3 flex items-center gap-2 font-semibold text-slate-900">
                    <CreditCard className="h-5 w-5 text-primary" />
                    {order.paymentMethod?.toUpperCase() || 'N/A'}
                  </div>
                  <p className="mt-4 text-sm text-slate-500">Status</p>
                  <p className="mt-1 inline-block rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700">
                    {String(order.paymentStatus || 'Pending').charAt(0).toUpperCase() + String(order.paymentStatus || 'Pending').slice(1)}
                  </p>
                  {order.paymentMethod === 'cod' && (
                    <p className="mt-3 text-sm text-slate-600">Please pay in cash when your order is delivered.</p>
                  )}
                </div>

                <div className="rounded-[1.75rem] border border-primary/20 bg-primary/5 p-5">
                  <p className="text-sm text-slate-500 font-semibold">ORDER TOTAL</p>
                  <p className="mt-3 text-3xl font-bold text-slate-950">Rs {orderTotal.toFixed(0)}</p>
                  <p className="mt-3 text-sm text-slate-600">{order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}</p>
                  <div className="mt-4 pt-4 border-t border-primary/20 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-semibold text-slate-900">Rs {orderSubtotal.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Delivery</span>
                      <span className="font-semibold text-slate-900">Rs {shippingCost.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items and Add to Cart Section */}
              <div className="grid gap-6 lg:grid-cols-[1fr_0.4fr]">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-slate-950 mb-6">Items in this order</h2>
                  <div className="space-y-4">
                    {order.items?.map((item: any, index: number) => {
                      const product = item.product || {};
                      const imageUrl = getOrderItemImage(item);
                      return (
                        <div key={`${product._id || item._id || index}`} className="flex gap-4 rounded-[1.75rem] border border-slate-200 p-4 hover:bg-slate-50 transition">
                          <img
                            src={imageUrl}
                            alt={product.name || item.name || 'Product'}
                            className="h-24 w-24 rounded-2xl object-cover"
                            onError={(event) => {
                              const target = event.currentTarget as HTMLImageElement;
                              if (target.src !== `${window.location.origin}/placeholder.jpg`) {
                                target.src = '/placeholder.jpg';
                              }
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-950">{product.name || item.name || 'Product'}</p>
                            <p className="text-sm text-slate-600">Qty × {item.quantity}</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">Rs {(item.price * item.quantity).toFixed(0)}</p>
                            {product?.description && <p className="mt-2 text-sm text-slate-600 line-clamp-1">{product.description}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Add to Cart Section */}
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm h-fit">
                  <h3 className="text-lg font-semibold text-slate-950 mb-4">Shop Again</h3>
                  <p className="text-sm text-slate-600 mb-6">Quickly add previous items to your cart.</p>
                  <div className="space-y-3 mb-6">
                    {order.items?.slice(0, 3).map((item: any, index: number) => {
                      const product = item.product || {};
                      return (
                        <AddToCartButton
                          key={`${product._id || item._id || index}`}
                          product={{
                            _id: product._id || product.id || item.productId,
                            name: product.name || item.name,
                            price: product.price || item.price,
                            quantity: product.quantity || 100,
                            thumbnail: getOrderItemImage(item),
                            image: getOrderItemImage(item),
                          }}
                          compact
                        />
                      );
                    })}
                  </div>
                  <Link
                    href="/products"
                    className="block w-full rounded-full bg-primary px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-primary/90"
                  >
                    Browse All Products
                  </Link>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
