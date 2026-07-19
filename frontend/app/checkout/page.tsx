'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCartStore } from '@/context/cartStore';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/services/api';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || 'Nepal',
    paymentMethod: 'cod',
  });

  useEffect(() => {
    if (!user) return;

    setFormData((current) => ({
      ...current,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      street: user.address?.street || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      postalCode: user.address?.postalCode || '',
      country: user.address?.country || 'Nepal',
    }));
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-grow flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-primary">Please Log In</h1>
            <p className="text-muted-foreground">You must be logged in to checkout</p>
            <Link href="/auth/login?redirect=/checkout" className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition font-semibold">
              Go to Login
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (user && !user.isVerified) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-grow flex items-center justify-center py-12 px-4">
          <div className="max-w-xl rounded-[2rem] border border-border bg-white p-10 text-center shadow-lg">
            <h1 className="text-3xl font-bold text-primary mb-4">Verify your email to checkout</h1>
            <p className="text-slate-600 mb-8">
              We sent a verification code to your email. Please verify your account before placing an order.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/auth/verify?redirect=/checkout" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
                Verify Email
              </Link>
              <Link href="/account/dashboard" className="rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5">
                Account Dashboard
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
    setLoading(true);
    setSubmitError(null);

    try {
      const savedAddress = user?.address;
      const shippingAddress = {
        name: formData.name || user?.name || '',
        email: formData.email || user?.email || '',
        phone: formData.phone || user?.phone || '',
        street: formData.street || savedAddress?.street || '',
        city: formData.city || savedAddress?.city || '',
        state: formData.state || savedAddress?.state || '',
        postalCode: formData.postalCode || savedAddress?.postalCode || '',
        country: formData.country || savedAddress?.country || 'Nepal',
      };

      const orderData = {
        items: items.map((item) => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress,
        paymentMethod: formData.paymentMethod,
      };

      await orderAPI.create(orderData);
      clearCart();
      toast.success('Order placed successfully!');
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
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <h2 className="text-xl font-bold text-primary">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                      placeholder="+977 9841234567"
                    />
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white border border-border rounded-lg p-6 space-y-4">
                  <h2 className="text-xl font-bold text-primary">Shipping Address</h2>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Street Address</label>
                    <input
                      type="text"
                      required
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">City</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Postal Code</label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                        placeholder="Postal code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Country</label>
                      <input
                        type="text"
                        required
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="rounded-[1.75rem] border border-slate-300 bg-white p-6 shadow-sm space-y-4">
                  <h2 className="text-xl font-bold text-slate-950">Payment Method</h2>
                  <div className="space-y-3">
                    <label
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-slate-900 transition ${
                        formData.paymentMethod === 'cod'
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="h-4 w-4 text-primary accent-primary"
                      />
                      <div>
                        <span className="font-semibold text-slate-950">Cash on Delivery</span>
                        <p className="text-sm text-slate-600">Pay when your order arrives.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {submitError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition font-semibold disabled:opacity-50"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="w-full min-w-0">
              <div className="bg-slate-100 border border-slate-300 rounded-3xl p-4 sm:p-6 lg:sticky lg:top-20 shadow-sm space-y-4 max-w-full overflow-x-hidden">
                <h2 className="text-xl font-bold text-slate-950">Order Summary</h2>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.productId} className="flex flex-wrap items-start justify-between gap-2 text-sm text-slate-800">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-950 break-words">{item.name}</p>
                        <p className="text-slate-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-slate-950 whitespace-nowrap">Rs. {item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-300 pt-4 space-y-2">
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-950">Rs. {getTotalPrice()}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Shipping</span>
                    <span className="font-semibold text-slate-950">Rs. 0</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Tax</span>
                    <span className="font-semibold text-slate-950">Rs. 0</span>
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex justify-between text-lg font-bold text-slate-950">
                    <span>Total</span>
                    <span>Rs. {getTotalPrice()}</span>
                  </div>
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
