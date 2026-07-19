'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Navigation />
      <main className="flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">Privacy Policy</h1>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            We collect only the information needed to fulfill your orders, manage your account, and respond to support requests. Your data is never sold to third parties and is stored securely in accordance with industry best practices.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            If you have questions about how we handle your personal information, please contact our support team through the contact page.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
