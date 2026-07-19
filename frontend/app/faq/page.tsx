'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Navigation />
      <main className="flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">FAQs</h1>
          <div className="mt-6 space-y-5 text-sm leading-7 text-slate-700">
            <div>
              <h2 className="font-semibold text-slate-950">How long does delivery take?</h2>
              <p className="mt-2">Most orders are dispatched within 24 hours and delivered across Nepal within 2–4 working days.</p>
            </div>
            <div>
              <h2 className="font-semibold text-slate-950">Do you offer custom bundles?</h2>
              <p className="mt-2">Yes. Please reach out via the contact page and our team will help you arrange a custom order.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
