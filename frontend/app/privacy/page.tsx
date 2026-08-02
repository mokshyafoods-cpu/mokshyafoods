'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Navigation />
      <main className="flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">Privacy Policy</h1>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            Mokshya Foods respects your privacy and collects only the information required to process orders, support your account, and respond to inquiries.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            We may collect your name, phone number, email address, delivery address, order details, and account information when you place an order, create an account, or contact us. This information is used to process orders, communicate updates, and improve service quality.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            We do not sell your personal data to third parties. Information may be shared only with service providers that help us deliver orders and operate the website, and only as needed to provide those services.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            If you have questions about your data or would like to request access or correction, please contact us through the contact page.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
