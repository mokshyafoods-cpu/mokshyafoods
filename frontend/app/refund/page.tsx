'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function RefundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Navigation />
      <main className="flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">Refund Policy</h1>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            Refunds are available for damaged or incorrect items reported within 48 hours of delivery. Please include photos of the package and the product so we can assess the issue quickly.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            Approved refunds are processed to the original payment method within 5–7 working days after confirmation.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
