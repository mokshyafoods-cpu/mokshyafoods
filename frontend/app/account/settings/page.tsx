'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    orderUpdates: true,
    promotions: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      orderUpdates: user?.notifications?.orderUpdates ?? current.orderUpdates,
      promotions: user?.notifications?.promotions ?? current.promotions,
    }));
  }, [user?.notifications?.orderUpdates, user?.notifications?.promotions]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    const wantsPasswordChange = Boolean(formData.currentPassword || formData.newPassword || formData.confirmPassword);
    if (wantsPasswordChange) {
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('New password and confirmation do not match.');
        return;
      }

      if (!formData.currentPassword) {
        toast.error('Please enter your current password.');
        return;
      }

      if (formData.newPassword.length < 6) {
        toast.error('New password must be at least 6 characters.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        notifications: {
          orderUpdates: formData.orderUpdates,
          promotions: formData.promotions,
        },
      };

      if (wantsPasswordChange) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      await updateProfile(payload);
      toast.success(wantsPasswordChange ? 'Settings saved successfully.' : 'Preferences saved.');
      setFormData((current) => ({ ...current, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-8 px-4 py-8 lg:px-0">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-slate-950">Settings</h1>
        <p className="mt-2 text-sm text-slate-600">Update your password and notification preferences.</p>

        <form onSubmit={handleSave} className="mt-8 space-y-8">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-950">Change Password</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {[
                { label: 'Current Password', value: formData.currentPassword, name: 'currentPassword' },
                { label: 'New Password', value: formData.newPassword, name: 'newPassword' },
                { label: 'Confirm Password', value: formData.confirmPassword, name: 'confirmPassword' },
              ].map((field) => (
                <label key={field.name} className="block">
                  <span className="text-sm font-semibold text-slate-700">{field.label}</span>
                  <input
                    type="password"
                    value={field.value}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-950">Notification Preferences</h2>
            <div className="mt-6 space-y-4">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <input
                  type="checkbox"
                  checked={formData.orderUpdates}
                  onChange={(e) => setFormData({ ...formData, orderUpdates: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm text-slate-700">Email me about order updates</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <input
                  type="checkbox"
                  checked={formData.promotions}
                  onChange={(e) => setFormData({ ...formData, promotions: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm text-slate-700">Email me about promotions and offers</span>
              </label>
            </div>
          </div>

          <button disabled={isSaving} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
        </div>
      </div>
    </section>
  );
}
