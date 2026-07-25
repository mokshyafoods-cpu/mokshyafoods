'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import { authAPI } from '@/services/api';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token || '';
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Missing reset token. Please request a new reset link.');
    }
  }, [token]);

  const validateForm = () => {
    const nextErrors: { password?: string; confirmPassword?: string } = {};

    if (!formData.password) {
      nextErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;
    if (!token) {
      toast.error('Reset token is missing.');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword(token, {
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      toast.success(response?.data?.message || 'Password reset successfully.');
      setSuccess(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to reset your password right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0e8d8] flex items-center justify-center px-4 py-8 sm:py-10">
      <div className="w-full max-w-[560px] overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="bg-[#1b3a2b] px-6 py-8 text-white sm:px-8">
          <Link href="/auth/login" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
          <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-3xl bg-[#c9a227]/20 text-[#c9a227]">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold">Set a new password</h1>
          <p className="mt-3 max-w-lg text-sm leading-7 text-[#d9c68e]">
            Choose a strong password for your Mokshya Foods account.
          </p>
        </div>

        <div className="bg-[#f4eddf] p-6 sm:p-8">
          {success ? (
            <div className="rounded-[1.5rem] border border-[#d8caa7] bg-white p-6 text-center shadow-sm">
              <p className="text-lg font-semibold text-[#1b3a2b]">Password updated</p>
              <p className="mt-3 text-sm leading-7 text-[#55615f]">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="mt-6 inline-flex rounded-full bg-[#1b3a2b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#162e21]"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 rounded-[1.5rem] border border-[#d8caa7] bg-white p-6 shadow-sm">
              <FormInput
                label="New Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(event) => {
                  setFormData((current) => ({ ...current, password: event.target.value }));
                  if (errors.password) setErrors((current) => ({ ...current, password: '' }));
                }}
                error={errors.password}
                required
                placeholder="••••••••"
                className="bg-[#fbf6eb]"
                showPasswordToggle
              />

              <FormInput
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(event) => {
                  setFormData((current) => ({ ...current, confirmPassword: event.target.value }));
                  if (errors.confirmPassword) setErrors((current) => ({ ...current, confirmPassword: '' }));
                }}
                error={errors.confirmPassword}
                required
                placeholder="••••••••"
                className="bg-[#fbf6eb]"
                showPasswordToggle
              />

              <Button type="submit" disabled={loading} loading={loading} className="w-full rounded-full bg-[#1b3a2b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#162e21]">
                Reset Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
