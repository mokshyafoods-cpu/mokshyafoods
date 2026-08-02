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
            Returns and refunds may be considered for damaged, incorrect, or defective items reported within one week of delivery. Please include clear photos of the package and the product so we can assess the issue quickly.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            If a product is damaged, we aim to replace it with a new product where possible. Refund decisions are reviewed case by case and are handled within one week of confirmation.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            Please contact us through the support channels listed on the contact page if you believe your order requires review.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
