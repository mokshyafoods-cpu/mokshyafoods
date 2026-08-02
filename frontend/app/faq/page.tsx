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
          <p className="mt-3 text-sm leading-7 text-slate-600">Here are practical answers about our products, storage, ordering, and delivery support.</p>
          <div className="mt-8 space-y-5 text-sm leading-7 text-slate-700">
            <div>
              <h2 className="font-semibold text-slate-950">What products does Mokshya Foods offer?</h2>
              <p className="mt-2">We offer naturally dried food products and food powders designed for everyday use, gifting, and household routines.</p>
            </div>
            <div>
              <h2 className="font-semibold text-slate-950">How does delivery work?</h2>
              <p className="mt-2">We deliver across Nepal. Free delivery is available within town, while outside-town delivery is based on distance and may be charged up to Rs 150.</p>
            </div>
            <div>
              <h2 className="font-semibold text-slate-950">What payment methods are available?</h2>
              <p className="mt-2">Our current customer payment option is cash on delivery.</p>
            </div>
            <div>
              <h2 className="font-semibold text-slate-950">What is your return or refund policy?</h2>
              <p className="mt-2">Returns and refunds are reviewed within one week of delivery for eligible concerns. If a product is damaged, we aim to replace it with a new product where possible.</p>
            </div>
            <div>
              <h2 className="font-semibold text-slate-950">How can I place a larger order or ask a product question?</h2>
              <p className="mt-2">Please contact us through the contact page and we will guide you with the best available option.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
