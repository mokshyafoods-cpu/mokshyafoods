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
              Mokshya Foods is a Nepali food brand focused on naturally dried fruits and wholesome snacks that bring the taste of local orchards into everyday homes.
              We work closely with trusted growers and prepare each product with care so families can enjoy simple, honest ingredients.
            </p>
            <p>
              Our mission is to celebrate Nepali produce, support responsible sourcing, and offer premium snacks that feel good to share and easy to enjoy.
              Every pack reflects our commitment to quality, freshness, and a more thoughtful way of snacking.
            </p>
            <p>
              Whether you are shopping for a family snack, a gift, or a daily staple, we are here to help you discover products that are practical, delicious, and made with care.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-[#f8f9fa] p-6">
              <h2 className="text-xl font-semibold text-slate-950">What We Offer</h2>
              <p className="mt-3 text-slate-600">Naturally dried fruits, wholesome snacks, and premium gift-ready packs designed for everyday routines and special occasions.</p>
            </div>
            <div className="rounded-3xl border border-border bg-[#f8f9fa] p-6">
              <h2 className="text-xl font-semibold text-slate-950">What Sets Us Apart</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• Carefully sourced ingredients from trusted Nepali growers</li>
                <li>• Simple, honest packaging with clear product details</li>
                <li>• Friendly support for retail and bulk orders</li>
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
