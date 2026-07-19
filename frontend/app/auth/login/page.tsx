'use client';

import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function LoginPageContent() {
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || '/account/dashboard';
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (user?.role === 'admin') {
      router.replace('/admin');
    } else if (!user?.isVerified) {
      router.replace('/auth/verify?redirect=' + encodeURIComponent(redirectTo));
    } else {
      router.replace(redirectTo || '/account/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const loggedInUser = await login(formData.email, formData.password);
      if (loggedInUser?.role === 'admin') {
        router.replace('/admin');
      } else if (!loggedInUser?.isVerified) {
        router.replace('/auth/verify?redirect=' + encodeURIComponent(redirectTo));
      } else {
        router.replace(redirectTo || '/account/dashboard');
      }
    } catch (error: any) {
      console.error('Login failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-[#f0e8d8] flex items-center justify-center px-4 py-8 sm:py-10">
      <div className="grid w-full max-w-[900px] grid-cols-1 overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden lg:flex flex-col justify-between relative bg-[#1b3a2b] p-8 lg:p-14 text-white">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#c9a227]/20 text-2xl font-bold text-[#c9a227]">
                M
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-[#d9c68e]">Mokshya Foods</p>
                <p className="text-sm font-semibold text-[#f5f0e8]">Pure • Natural</p>
              </div>
            </div>

            <div className="mt-12 max-w-xl space-y-4">
              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">Welcome back to pure, natural goodness.</h1>
              <p className="text-sm text-[#d9c68e]/80">
                Sign in and access your orders, saved addresses, and premium offers from Mokshya.
              </p>
            </div>
          </div>

          <div className="mt-16 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Fast checkout' },
              { label: 'Saved favorites' },
              { label: 'Order tracking' },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3 text-sm text-[#f5f0e8] shadow-sm backdrop-blur">
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center bg-[#f4eddf] p-5 sm:p-8 lg:p-12">
          <div className="w-full max-w-[420px] rounded-[2rem] bg-white p-6 sm:p-8 shadow-xl">
            <button
              type="button"
              onClick={handleBack}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8caa7] bg-[#fbf6eb] px-4 py-2 text-sm font-semibold text-[#1b3a2b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f4ebd8] hover:text-[#9b7a2f]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <h2 className="text-3xl font-semibold text-[#1b3a2b]">Sign In</h2>
            <p className="mt-2 text-sm text-[#55615f]">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-[#9b7a2f] hover:text-[#c9a227]">
                Create one here
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                required
                placeholder="you@example.com"
                className="bg-[#fbf6eb]"
              />

              <FormInput
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                required
                placeholder="••••••••"
                className="bg-[#fbf6eb]"
                showPasswordToggle
              />

              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                className="w-full rounded-full bg-[#1b3a2b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#162e21]"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 border-t border-[#ece1ca] pt-5 text-center">
              <p className="text-sm text-[#6d7a6d]">
                New to Mokshya Foods?{' '}
                <Link href="/auth/register" className="font-semibold text-[#9b7a2f] hover:text-[#c9a227]">
                  Create your account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f0e8d8] px-4 py-8 text-sm font-semibold text-[#1b3a2b]">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
