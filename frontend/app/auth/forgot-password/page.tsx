'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import { authAPI } from '@/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateEmail()) return;

    setLoading(true);

    try {
      const response = await authAPI.forgotPassword({ email: email.trim().toLowerCase() });
      toast.success(response?.data?.message || 'If an account exists with this email, a password reset link has been sent.');
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to send the password reset email right now.');
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
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold">Forgot your password?</h1>
          <p className="mt-3 max-w-lg text-sm leading-7 text-[#d9c68e]">
            Enter your registered email address and we&apos;ll send you a secure link to reset your password.
          </p>
        </div>

        <div className="bg-[#f4eddf] p-6 sm:p-8">
          {submitted ? (
            <div className="rounded-[1.5rem] border border-[#d8caa7] bg-white p-6 text-center shadow-sm">
              <p className="text-lg font-semibold text-[#1b3a2b]">Check your inbox</p>
              <p className="mt-3 text-sm leading-7 text-[#55615f]">
                If an account exists for <span className="font-semibold text-[#1b3a2b]">{email}</span>, we have sent a password reset link.
              </p>
              <Link href="/auth/login" className="mt-6 inline-flex rounded-full bg-[#1b3a2b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#162e21]">
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 rounded-[1.5rem] border border-[#d8caa7] bg-white p-6 shadow-sm">
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError('');
                }}
                error={error}
                required
                placeholder="you@example.com"
                className="bg-[#fbf6eb]"
              />

              <Button type="submit" disabled={loading} loading={loading} className="w-full rounded-full bg-[#1b3a2b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#162e21]">
                Send Reset Link
              </Button>

              <p className="text-center text-sm text-[#6d7a6d]">
                Remembered your password?{' '}
                <Link href="/auth/login" className="font-semibold text-[#9b7a2f] hover:text-[#c9a227]">
                  Sign in here
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
