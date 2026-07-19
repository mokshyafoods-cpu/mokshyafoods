'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { isMobileDevice } from '@/lib/utils';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nepal',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      street: user.address?.street || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      postalCode: user.address?.postalCode || '',
      country: user.address?.country || 'Nepal',
    });
    setAvatarPreview(user.avatar || '');
  }, [user]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (isMobileDevice()) {
      toast.error('Image uploads are not allowed on mobile devices.');
      return;
    }

    const file = event.target.files?.[0] || null;
    setAvatarFile(file);

    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('phone', formData.phone);
      payload.append(
        'address',
        JSON.stringify({
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        })
      );

      if (avatarFile) {
        payload.append('avatar', avatarFile);
      }

      await updateProfile(payload);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-8 px-4 py-8 lg:px-0">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-950">My Profile</h1>
        <p className="mt-2 text-sm text-slate-600">Edit your account details and keep your contact information current.</p>

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Full Name</span>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <div className="block">
              <span className="text-sm font-semibold text-slate-700">Profile Picture</span>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">No image</div>
                  )}
                </div>
                <label className="cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-100">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  Choose image
                </label>
              </div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                disabled
                value={formData.email}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Phone Number</span>
              <input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Country</span>
              <input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Street</span>
              <input
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">City</span>
              <input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">State</span>
              <input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Postal Code</span>
              <input
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <div />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
        </div>
      </div>
    </section>
  );
}
