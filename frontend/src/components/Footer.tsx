'use client';

import Link from 'next/link';
import { Camera, PhoneCall, ChevronRight, Home, ShieldCheck, Info, ShoppingBag, Lock, FileText, Sparkles } from 'lucide-react';

const footerLinks = [
  { href: '/privacy', label: 'Privacy Policy', icon: Lock },
  { href: '/terms', label: 'Terms and Conditions', icon: FileText },
  { href: '/refund', label: 'Refund Policy', icon: ShieldCheck },
  { href: '/faq', label: 'FAQs', icon: Sparkles },
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-[#d6b37e] bg-white text-slate-950 sm:mt-12 lg:mt-16">
      <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-20">
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="max-w-full">
            <Link href="/" className="inline-flex items-center gap-3 sm:gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-[#b77f22] text-lg font-bold text-slate-950 shadow-md shadow-black/10 sm:h-16 sm:w-16">
                M
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-950 sm:text-xl">Mokshya Foods</p>
                <p className="text-sm font-medium text-[#9f7b2f]">Foods and Spices</p>
              </div>
            </Link>
            <p className="mt-5 max-w-full text-sm leading-6 text-slate-700 sm:mt-6 sm:leading-7">
              Mokshya Foods is one of Nepal’s leading dried fruits manufacturers, certified by DFTQC and approved by the Government of Nepal for quality and safety.
            </p>
          </div>

          <div className="min-w-0">
            <h4 className="mb-4 font-semibold text-slate-950">Quick Links</h4>
            <ul className="space-y-3 text-sm text-slate-700">
              <li><Link href="/products" className="flex items-center gap-2 break-words hover:text-[#b77f22] transition"><ShoppingBag className="h-4 w-4" /> Shop</Link></li>
              <li><Link href="/auth/login" className="flex items-center gap-2 break-words hover:text-[#b77f22] transition"><Home className="h-4 w-4" /> Login</Link></li>
              <li><Link href="/auth/register" className="flex items-center gap-2 break-words hover:text-[#b77f22] transition"><ChevronRight className="h-4 w-4" /> Register</Link></li>
            </ul>
          </div>

          <div className="min-w-0">
            <h4 className="mb-4 font-semibold text-slate-950">Information</h4>
            <ul className="space-y-3 text-sm text-slate-700">
              <li><Link href="/about" className="flex items-center gap-2 break-words hover:text-[#b77f22] transition"><Info className="h-4 w-4" /> About Us</Link></li>
              <li><Link href="/faq" className="flex items-center gap-2 break-words hover:text-[#b77f22] transition"><ChevronRight className="h-4 w-4" /> FAQs</Link></li>
              <li><Link href="/contact" className="flex items-center gap-2 break-words hover:text-[#b77f22] transition"><ChevronRight className="h-4 w-4" /> Contact Us</Link></li>
            </ul>
          </div>

          <div className="min-w-0">
            <h4 className="mb-4 font-semibold text-slate-950">Policy</h4>
            <ul className="space-y-3 text-sm text-slate-700">
              {footerLinks.map(({ href, label, icon: Icon }) => (
                <li key={href}><Link href={href} className="flex items-center gap-2 break-words hover:text-[#b77f22] transition"><Icon className="h-4 w-4" /> {label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#d6b37e] pt-6 sm:gap-6 md:flex-row md:pt-8">
          <p className="max-w-full text-center text-sm text-slate-700 md:text-left">© 2026 Mokshya Foods. All Rights Reserved.</p>
          <div className="flex items-center gap-3">
            <Link href="https://www.instagram.com/mokshyafoods?igsh=ZGx5dXUwaTJybWpy" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#b77f22] text-slate-950 transition hover:bg-[#a36e1f]">
              <Camera className="h-5 w-5" />
            </Link>
            <Link href="https://wa.me/9745298975" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#b77f22] text-slate-950 transition hover:bg-[#a36e1f]">
              <PhoneCall className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
