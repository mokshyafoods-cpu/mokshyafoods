'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Navigation />
      <main className="flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">Frequently Asked Questions</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">Here are the most common questions about our products, delivery, and ordering process.</p>
          <div className="mt-8 space-y-5 text-sm leading-7 text-slate-700">
            <div>
              <h2 className="font-semibold text-slate-950">How long does delivery take?</h2>
              <p className="mt-2">Most orders are dispatched within 24 hours and delivered across Nepal within 2–4 working days, depending on your location.</p>
            </div>
            <div>
              <h2 className="font-semibold text-slate-950">Do you offer custom bundles?</h2>
              <p className="mt-2">Yes. Please reach out through the contact page and our team will help you arrange a custom order for gifts or bulk purchases.</p>
            </div>
            <div>
              <h2 className="font-semibold text-slate-950">How should I store the products?</h2>
              <p className="mt-2">Keep the packs sealed and stored in a cool, dry place away from direct sunlight to preserve flavor and texture.</p>
            </div>
            <div>
              <h2 className="font-semibold text-slate-950">Do you offer payment options beyond cash on delivery?</h2>
              <p className="mt-2">We support secure digital and bank transfer payments for eligible orders. Please contact us for current options.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
