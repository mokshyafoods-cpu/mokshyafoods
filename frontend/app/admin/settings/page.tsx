'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const settings = [
  { category: 'Company Info', status: 'Configured', details: 'Business name, contact, brand assets' },
  { category: 'Homepage', status: 'Draft', details: 'Hero banner, featured products, testimonials' },
  { category: 'Shipping', status: 'Active', details: 'Delivery zones, rates, pickup options' },
  { category: 'Payments', status: 'Active', details: 'COD, Stripe, UPI and offline payments' },
  { category: 'Notifications', status: 'Pending', details: 'Order emails, SMS alerts, admin notifications' },
  { category: 'Legal', status: 'Configured', details: 'Terms, privacy policy, return policy' },
];

const emptyForm = {
  name: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

export default function AdminSettingsPage() {
  const { user, updateProfile, isLoading } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      street: user.address?.street || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      postalCode: user.address?.postalCode || '',
      country: user.address?.country || '',
    });
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
        },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Settings</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">Store configuration</h1>
        <p className="mt-4 text-sm text-slate-500">
          Update the admin profile details and review the core store configuration areas from one place.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Profile</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Admin contact details</h2>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{user?.role || 'Admin'}</span>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input value={user?.email || ''} readOnly className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-500" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Country</label>
                <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Street</label>
                <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">State</label>
                <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Postal code</label>
                <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </div>
            </div>

            <button type="submit" disabled={saving || isLoading} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {settings.map((item) => (
            <div key={item.category} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{item.category}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{item.details}</p>
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
