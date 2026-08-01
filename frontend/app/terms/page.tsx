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
            By shopping with Mokshya Foods, you agree to use our website responsibly, provide accurate order details, and refrain from unauthorized copying, resale, or misuse of our product content and brand materials.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            Prices, availability, packaging details, and delivery timelines may change from time to time. We aim to keep all information accurate and transparent, but final fulfillment depends on stock availability and service conditions at the time of order.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            Customers are responsible for confirming the correctness of shipping addresses and contact details before placing their order. Mokshya Foods reserves the right to decline or cancel orders where necessary for compliance, quality, or operational reasons.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
