'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] py-16">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-border bg-white p-10 shadow-lg">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">About Mokshya Foods</p>
            <h1 className="mt-3 text-4xl font-bold text-slate-950">Our Story</h1>
          </div>
          <div className="space-y-4 text-slate-700">
            <p>
              Mokshya Foods is a Nepal-based food business focused on naturally dried food products and food powders for everyday use, gifting, and household routines.
              We aim to present products clearly, support customers with practical information, and offer dependable service from order placement to delivery.
            </p>
            <p>
              The business is led by Krishna Banjade, Ukesh Gyawali, and Bishal Banjade, who help guide operations, finance, and business growth with a focus on product quality and customer experience.
            </p>
            <p>
              Our product range includes naturally dried foods and food powders sourced and prepared with care in Nepal. We share clear product details so customers can make informed purchasing decisions.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-[#f8f9fa] p-6">
              <h2 className="text-xl font-semibold text-slate-950">What We Offer</h2>
              <p className="mt-3 text-slate-600">Naturally dried fruits and food powders made for everyday use, practical storage, and trusted family routines.</p>
            </div>
            <div className="rounded-3xl border border-border bg-[#f8f9fa] p-6">
              <h2 className="text-xl font-semibold text-slate-950">What Sets Us Apart</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• Thoughtful product selection with clear product information</li>
                <li>• Practical packaging designed for daily use and easier storage</li>
                <li>• Helpful support for retail orders and product questions</li>
              </ul>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-[#f8f9fa] p-6 text-center">
            <p className="text-sm text-slate-600">Want to share feedback or questions?</p>
            <Link href="/contact" className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
