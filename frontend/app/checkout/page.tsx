'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCartStore } from '@/context/cartStore';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/services/api';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

const DELIVERY_ZONE_OPTIONS = [
  { value: 'inside-butwal', label: 'Inside Butwal', charge: 0 },
  { value: 'outside-butwal', label: 'Outside Butwal', charge: 100 },
] as const;

const nepaliPhoneRegex = /^(?:\+977|977)?9\d{9}$/;

const normalizePhone = (value: string) => {
  const plain = value.replace(/[^\d+]/g, '').replace(/^\+?977/, '').trim();
  return plain ? `+977${plain}` : value.trim();
};

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart, removeItem } = useCartStore();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(true);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: '',
    deliveryAddress: '',
    paymentMethod: 'cod',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    deliveryAddress?: string;
  }>({});

  useEffect(() => {
    if (!user) return;

    setFormData((current) => ({
      ...current,
      name: user.name || current.name || '',
      email: user.email || current.email || '',
      phone: user.phone || current.phone || '',
    }));
  }, [user]);

  const subtotal = useMemo(() => getTotalPrice(), [items, getTotalPrice]);
  const selectedZone = DELIVERY_ZONE_OPTIONS.find((zone) => zone.value === formData.location) ?? DELIVERY_ZONE_OPTIONS[0];
  const shippingCharge = selectedZone.charge;
  const total = subtotal + shippingCharge;

  const getZoneLabel = (zone: string) => {
    if (zone === 'inside-butwal') return 'Inside Butwal';
    if (zone === 'outside-butwal') return 'Outside Butwal';
    return zone;
  };

  const validateField = (field: keyof typeof formData, value: string) => {
    switch (field) {
      case 'name':
        return value.trim() ? '' : 'Full name is required';
      case 'email':
        if (!value.trim()) return '';
        return /\S+@\S+\.\S+/.test(value) ? '' : 'Enter a valid email address';
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        return nepaliPhoneRegex.test(value.replace(/\s+/g, '').replace(/[-()]/g, '')) ? '' : 'Enter a valid Nepali phone number';
      case 'location':
        return value ? '' : 'Please select your delivery zone';
      case 'deliveryAddress':
        return value.trim() ? '' : 'Delivery address is required';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const nextErrors: typeof errors = {};
    const fields: Array<[keyof typeof formData, string]> = [
      ['name', formData.name],
      ['email', formData.email],
      ['phone', formData.phone],
      ['location', formData.location],
      ['deliveryAddress', formData.deliveryAddress],
    ];

    fields.forEach(([field, value]) => {
      const message = validateField(field, value);
      if (message) {
        nextErrors[field] = message;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const isFormValid =
    formData.name.trim() &&
    formData.phone.trim() &&
    nepaliPhoneRegex.test(formData.phone.replace(/\s+/g, '').replace(/[-()]/g, '')) &&
    formData.location &&
    formData.deliveryAddress.trim() &&
    (!formData.email.trim() || /\S+@\S+\.\S+/.test(formData.email));

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-grow flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-primary">Your Cart is Empty</h1>
            <Link href="/products" className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition font-semibold">
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const isValid = validateForm();
    if (!isValid) {
      toast.error('Please fix the highlighted fields before checkout.');
      return;
    }

    setLoading(true);

    try {
      const shippingAddress = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: normalizePhone(formData.phone),
        street: formData.deliveryAddress.trim(),
        address: formData.deliveryAddress.trim(),
        city: getZoneLabel(formData.location),
        state: getZoneLabel(formData.location),
        country: 'Nepal',
        location: formData.location,
        deliveryZone: formData.location,
      };

      const orderData = {
        customer: isAuthenticated ? user?._id || user?.id || null : null,
        deliveryZone: formData.location,
        deliveryCharge: shippingCharge,
        shippingCost: shippingCharge,
        items: items.map((item) => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
        })),
        shippingAddress,
        paymentMethod: formData.paymentMethod,
      };

      const response = await orderAPI.create(orderData);
      const orderPayload = response?.data?.data ?? response?.data ?? response;
      const orderId = orderPayload?._id || orderPayload?.data?._id || orderPayload?.id;

      if (orderId && orderPayload) {
        sessionStorage.setItem('last-order-confirmation', JSON.stringify(orderPayload));
      }

      clearCart();
      toast.success('Order placed successfully!');
      if (orderId) {
        router.push(`/checkout/success/${orderId}`);
        return;
      }
      router.push('/orders');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to place order';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />

      <main className="flex-grow py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <h2 className="text-xl font-bold text-primary">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-900">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData((current) => ({ ...current, name: value }));
                          setErrors((current) => ({ ...current, name: validateField('name', value) }));
                        }}
                        className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 ${errors.name ? 'border-red-300' : 'border-slate-300'}`}
                      />
                      {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-900">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData((current) => ({ ...current, email: value }));
                          setErrors((current) => ({ ...current, email: validateField('email', value) }));
                        }}
                        className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 ${errors.email ? 'border-red-300' : 'border-slate-300'}`}
                        placeholder="Optional"
                      />
                      {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData((current) => ({ ...current, phone: value }));
                        setErrors((current) => ({ ...current, phone: validateField('phone', value) }));
                      }}
                      className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 ${errors.phone ? 'border-red-300' : 'border-slate-300'}`}
                      placeholder="+977 9841234567"
                    />
                    {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <h2 className="text-xl font-bold text-primary">Delivery Details</h2>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">Location</label>
                    <select
                      value={formData.location}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData((current) => ({ ...current, location: value }));
                        setErrors((current) => ({ ...current, location: validateField('location', value) }));
                      }}
                      className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 ${errors.location ? 'border-red-300' : 'border-slate-300'}`}
                    >
                      <option value="">Select delivery zone</option>
                      {DELIVERY_ZONE_OPTIONS.map((zone) => (
                        <option key={zone.value} value={zone.value}>{zone.label}</option>
                      ))}
                    </select>
                    {errors.location && <p className="mt-2 text-sm text-red-600">{errors.location}</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">Delivery Address</label>
                    <textarea
                      value={formData.deliveryAddress}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData((current) => ({ ...current, deliveryAddress: value }));
                        setErrors((current) => ({ ...current, deliveryAddress: validateField('deliveryAddress', value) }));
                      }}
                      rows={4}
                      className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 ${errors.deliveryAddress ? 'border-red-300' : 'border-slate-300'}`}
                      placeholder="House number, street, landmark, area"
                    />
                    {errors.deliveryAddress && <p className="mt-2 text-sm text-red-600">{errors.deliveryAddress}</p>}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-300 bg-white p-6 shadow-sm space-y-4">
                  <h2 className="text-xl font-bold text-slate-950">Payment Method</h2>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 rounded-2xl border border-primary bg-primary/10 px-4 py-4 text-slate-900 shadow-sm">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={(e) => setFormData((current) => ({ ...current, paymentMethod: e.target.value }))}
                        className="h-4 w-4 text-primary accent-primary"
                      />
                      <div>
                        <span className="font-semibold text-slate-950">Cash on Delivery</span>
                        <p className="text-sm text-slate-600">Pay in cash when your order is delivered.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {submitError && (
                  <div role="alert" aria-live="assertive" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Complete Checkout'}
                </button>
              </form>
            </div>

            <div className="w-full min-w-0">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-slate-950">Order Summary</h2>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setCartOpen((current) => !current)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-900"
                  >
                    <span>Cart Items</span>
                    <span className="text-slate-500">{cartOpen ? 'Hide' : 'Show'}</span>
                  </button>
                  {cartOpen && (
                    <div className="space-y-3 border-t border-slate-200 p-3">
                      {items.map((item) => (
                        <div key={item.productId} className="flex items-start gap-3 rounded-2xl bg-white p-2 shadow-sm">
                          <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-slate-100">
                            <img src={item.image || '/placeholder.jpg'} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                                <p className="text-xs text-slate-600">Rs {item.price} × {item.quantity}</p>
                              </div>
                              <button type="button" onClick={() => removeItem(item.productId)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500" aria-label={`Remove ${item.name}`}>
                                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-1 7h2v8H8v-8zm6 0h2v8h-2v-8z" /></svg>
                              </button>
                            </div>
                            <div className="mt-2 text-right text-sm font-semibold text-slate-900">Rs {item.price * item.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">Rs {subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-semibold text-slate-900">Rs {shippingCharge}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-950">
                    <span>Total</span>
                    <span>Rs {total.toFixed(0)}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <Link href="/products" className="inline-flex items-center justify-center rounded-2xl border border-primary px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5">
                    Back to Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
