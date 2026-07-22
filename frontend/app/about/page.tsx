'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] py-16">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-border bg-white p-10 shadow-lg">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">About Mero</p>
            <h1 className="mt-3 text-4xl font-bold text-slate-950">Our Story</h1>
          </div>
          <div className="space-y-4 text-slate-700">
            <p>
              Mero is dedicated to bringing pure, high-quality Nepali dried fruits and natural snacks to your table.
              We source from local growers and craft every product with care so you can enjoy authentic taste and healthy convenience.
            </p>
            <p>
              Our mission is to support small producers, celebrate local flavors, and make premium ingredients accessible to every home.
              Thank you for trusting Mero for your family’s everyday nourishment.
            </p>
            <p>
              Explore our products, view your orders, and reach out anytime through the contact page if you have questions.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-[#f8f9fa] p-6">
              <h2 className="text-xl font-semibold text-slate-950">What We Offer</h2>
              <p className="mt-3 text-slate-600">Naturally dried fruits, healthy snack mixes, and fresh flavors made for families who care about quality.</p>
            </div>
            <div className="rounded-3xl border border-border bg-[#f8f9fa] p-6">
              <h2 className="text-xl font-semibold text-slate-950">Why Choose Mero</h2>
              <p className="mt-3 text-slate-600">Local sourcing, premium ingredients, transparent packaging, and a commitment to authentic Nepali taste.</p>
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
