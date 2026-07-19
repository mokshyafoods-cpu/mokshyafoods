'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Navigation />
      <main className="flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">Terms and Conditions</h1>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            By shopping with Mokshya Foods, you agree to use our website responsibly, provide accurate order details, and refrain from unauthorized copying or misuse of our product content.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            We reserve the right to update pricing, shipping, and availability information as necessary while keeping the shopping experience fair and transparent.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
