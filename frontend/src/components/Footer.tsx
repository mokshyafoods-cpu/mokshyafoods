'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PhoneCall, ChevronRight, ShieldCheck, Info, ShoppingBag, Lock, FileText, Sparkles, Leaf, MapPin } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa6';
import { siteConfig } from '@/lib/business';

const footerLinks = [
  { href: '/privacy', label: 'Privacy Policy', icon: Lock },
  { href: '/terms', label: 'Terms and Conditions', icon: FileText },
  { href: '/refund', label: 'Refund Policy', icon: ShieldCheck },
  { href: '/faq', label: 'FAQs', icon: Sparkles },
];

export default function Footer() {
  return (
    <footer className="mt-10 mb-6 border-t border-[#d6b37e] bg-white text-slate-950 sm:mt-12 sm:mb-8 lg:mt-16 lg:mb-10">
      <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-20">
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="max-w-full">
            <Link href="/" className="inline-flex items-center gap-3 sm:gap-4" aria-label="Mokshya Foods home">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-3xl bg-white shadow-md shadow-black/10 sm:h-16 sm:w-16">
                <Image
                  src="/logo.jpeg"
                  alt="Mokshya Foods"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  sizes="(max-width: 640px) 56px, 64px"
                />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-950 sm:text-xl">Mokshya Foods</p>
                <p className="text-sm font-medium text-[#9f7b2f]">Naturally dried foods and food powders</p>
              </div>
            </Link>
            <p className="mt-5 max-w-full text-sm leading-6 text-slate-700 sm:mt-6 sm:leading-7">
              {siteConfig.description}
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p className="flex items-center gap-2"><PhoneCall className="h-4 w-4" /> {siteConfig.phoneDisplay}</p>
              <a href={`mailto:${siteConfig.email}`} className="transition hover:text-[#b77f22]">{siteConfig.email}</a>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {siteConfig.location}</p>
            </div>
          </div>

          <div className="min-w-0">
            <h4 className="mb-4 font-semibold text-slate-950">Quick Links</h4>
            <ul className="space-y-3 text-sm text-slate-700">
              <li><Link href="/products" className="flex items-center gap-2 break-words hover:text-[#b77f22] transition"><ShoppingBag className="h-4 w-4" /> Shop</Link></li>
              <li><Link href="/about" className="flex items-center gap-2 break-words hover:text-[#b77f22] transition"><Info className="h-4 w-4" /> About</Link></li>
              <li><Link href="/faq" className="flex items-center gap-2 break-words hover:text-[#b77f22] transition"><Leaf className="h-4 w-4" /> FAQ</Link></li>
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
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end sm:gap-4">
            <a href={siteConfig.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#b77f22] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#a36e1f] sm:h-12 sm:w-12" aria-label="Visit Mokshya Foods on Facebook">
              <FaFacebookF className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>
            <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#b77f22] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#a36e1f] sm:h-12 sm:w-12" aria-label="Visit Mokshya Foods on Instagram">
              <FaInstagram className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>
            <a href={siteConfig.tiktok} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#b77f22] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#a36e1f] sm:h-12 sm:w-12" aria-label="Visit Mokshya Foods on TikTok">
              <FaTiktok className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>
            <a href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#b77f22] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#a36e1f] sm:h-12 sm:w-12" aria-label="Contact Mokshya Foods on WhatsApp">
              <FaWhatsapp className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
