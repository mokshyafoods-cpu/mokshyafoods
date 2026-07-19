'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function VerifyEmailPage() {
  const { user, isAuthenticated, verifyEmail, resendOtp } = useAuth();
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    if (user?.isVerified) {
      router.replace('/account/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter the verification code.');
      return;
    }

    try {
      setLoading(true);
      await verifyEmail(otp.trim());
      router.replace('/account/dashboard');
    } catch (error: any) {
      console.error('Verify email error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResendLoading(true);
      await resendOtp();
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f0e6]">
      <Navigation />
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl rounded-[2rem] border border-border bg-white p-10 shadow-xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign up
          </button>
          <h1 className="text-3xl font-bold text-primary mb-4">Verify your email</h1>
          <p className="mb-6 text-sm leading-6 text-slate-600">
            Enter the 6-digit verification code sent to your email address to complete account setup. This code expires in 5 minutes.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                placeholder="Enter 6-digit code"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Haven't received the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="font-semibold text-primary hover:text-secondary"
              >
                {resendLoading ? 'Resending…' : 'Resend code'}
              </button>
            </p>
            <p className="mt-3 text-sm text-slate-500">
              If you still have trouble, check your spam folder or use the email address you registered with.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
