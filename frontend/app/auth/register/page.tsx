'use client';

import FormInput from '@/components/FormInput';
import { useAuth } from '@/context/AuthContext';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisterPageContent() {
  const { register, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || '/account/dashboard';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (user?.role === 'admin') {
      router.push('/admin');
    } else if (!user?.isVerified) {
      router.push('/auth/verify?redirect=' + encodeURIComponent(redirectTo));
    } else {
      router.push(redirectTo || '/account/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; phone?: string; password?: string; confirmPassword?: string } = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const newUser = await register(formData.name, formData.email, formData.password, formData.phone);
      if (newUser?.role === 'admin') {
        router.push('/admin');
      } else if (!newUser?.isVerified) {
        router.push('/auth/verify?redirect=' + encodeURIComponent(redirectTo));
      } else {
        router.push(redirectTo || '/account/dashboard');
      }
    } catch (error: any) {
      console.error('Registration failed', error);
    } finally {
      setLoading(false);
    }
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
                <p className="text-xs uppercase tracking-[0.4em] text-[#d9c68e]">Mokshya Foods</p>
                <p className="text-base font-semibold text-[#f5f0e8]">Pure • Natural</p>
              </div>
            </div>

            <div className="mt-12 max-w-xl space-y-4">
              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">Join the Mokshya family today.</h1>
              <p className="text-sm text-[#d9c68e]/80">
                Create an account and enjoy exclusive access to premium Nepali dried fruits delivered to your door.
              </p>
            </div>
          </div>

          <div className="mt-16 grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Exclusive Offers' },
              { label: 'Order Tracking' },
              { label: 'Saved Addresses' },
              { label: 'Order History' },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-[#f5f0e8] shadow-sm backdrop-blur">
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center bg-[#f4eddf] p-5 sm:p-8 lg:p-12">
          <div className="w-full max-w-[420px] rounded-[2rem] bg-white p-6 sm:p-8 shadow-xl">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#55615f] hover:text-[#9b7a2f]"
            >
              ← Back
            </button>
            <span className="inline-flex rounded-full bg-[#fbedda] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#9a7b34]">
              New Customer
            </span>
            <h2 className="mt-6 text-3xl font-semibold text-[#1b3a2b]">Create Account</h2>
            <p className="mt-2 text-sm text-[#55615f]">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-[#9b7a2f] hover:text-[#c9a227]">
                Sign in here
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <FormInput
                label="Full Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
                placeholder="Aarav Sharma"
                className="bg-[#fbf6eb]"
              />

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
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                required
                placeholder="+977 9841234567"
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
                placeholder="Min. 8 characters"
                className="bg-[#fbf6eb]"
                showPasswordToggle
              />

              <FormInput
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
                required
                placeholder="Re-enter your password"
                className="bg-[#fbf6eb]"
                showPasswordToggle
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#1b3a2b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#162e21] disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 border-t border-[#ece1ca] pt-5 text-center">
              <p className="text-sm text-[#6d7a6d]">
                Already a member?{' '}
                <Link href="/auth/login" className="font-semibold text-[#9b7a2f] hover:text-[#c9a227]">
                  Sign in to your account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f0e8d8] px-4 py-8 text-sm font-semibold text-[#1b3a2b]">Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
