'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function AddressesPage() {
  const { user, updateProfile, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nepal',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    setFormData({
      street: user.address?.street || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      postalCode: user.address?.postalCode || '',
      country: user.address?.country || 'Nepal',
      phone: user.phone || '',
    });
  }, [user]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await updateProfile({
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        },
      });
      toast.success('Address saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="space-y-8">
        <div className="rounded-[2rem] border border-border bg-white p-10 shadow-sm text-center">
          <p className="text-lg text-slate-600">Please log in to view and update your addresses.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8 px-4 py-8 lg:px-0">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-secondary">My Addresses</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Saved shipping address</h1>
            <p className="mt-2 text-sm text-slate-600">Update your default delivery address for checkout.</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Address'}
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Street Address</label>
              <input
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Street address"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">City</span>
                <input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">State</span>
                <input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Postal Code</span>
                <input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="Postal code"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Country</span>
                <input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Country"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </label>
            </div>
          </div>

          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Phone</label>
              <input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">Current saved address</p>
              <p className="mt-4 text-slate-700">
                {user?.address?.street || 'No address saved yet'}
              </p>
              {(user?.address?.city || user?.address?.state || user?.address?.postalCode || user?.address?.country) && (
                <p className="mt-1 text-slate-700">
                  {user?.address?.city ? `${user.address.city}, ` : ''}
                  {user?.address?.state ? `${user.address.state} ` : ''}
                  {user?.address?.postalCode ? `${user.address.postalCode}, ` : ''}
                  {user?.address?.country || ''}
                </p>
              )}
              <p className="mt-4 text-sm text-slate-500">Saved phone: {user?.phone || 'Not set'}</p>
            </div>
          </div>
        </form>
        </div>
      </div>
    </section>
  );
}
