'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { Home, ShoppingBag, User, MapPin, Heart, Star, Settings, LogOut, ListChecks, BadgeInfo } from 'lucide-react';

const navItems = [
  { href: '/account/dashboard', label: 'Dashboard', icon: Home },
  { href: '/account/orders', label: 'My Orders', icon: ListChecks },
  { href: '/account/profile', label: 'My Profile', icon: User },
  { href: '/account/addresses', label: 'My Addresses', icon: MapPin },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/reviews', label: 'My Reviews', icon: Star },
  { href: '/account/settings', label: 'Settings', icon: Settings },
  { href: '/about', label: 'About', icon: BadgeInfo },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();
  const [activeNav, setActiveNav] = useState(pathname);

  useEffect(() => {
    setActiveNav(pathname);
  }, [pathname]);

  const activePath = (href: string) => activeNav === href || pathname === href || pathname?.startsWith(`${href}/`);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
        <Navigation />
        <main className="flex-grow flex items-center justify-center px-4 py-20">
          <div className="max-w-xl rounded-[2rem] border border-border bg-white p-10 text-center shadow-lg">
            <h1 className="text-3xl font-bold text-primary mb-4">Please sign in to access your account</h1>
            <p className="text-slate-600 mb-8">Your customer dashboard is only available after login.</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/auth/login" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
                Sign In
              </Link>
              <Link href="/auth/register" className="rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5">
                Create Account
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (user && !user.isVerified) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
        <Navigation />
        <main className="flex-grow flex items-center justify-center px-4 py-20">
          <div className="max-w-xl rounded-[2rem] border border-border bg-white p-10 text-center shadow-lg">
            <h1 className="text-3xl font-bold text-primary mb-4">Account locked until email verification</h1>
            <p className="text-slate-600 mb-8">
              Please verify your email address to access your account features, orders, and saved data.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/auth/verify" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
                Verify Email
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.replace('/auth/login');
                }}
                className="rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                Logout
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-4 overflow-x-auto pb-4 lg:hidden">
          <div className="flex gap-2 min-w-max">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activePath(item.href)
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Account actions</p>
                <p className="text-sm text-slate-600">Sign out quickly from your dashboard on any device.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.replace('/auth/login');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6 rounded-[2rem] border border-border bg-white p-6 shadow-sm">
              <div className="space-y-3 border-b border-border pb-5 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <p className="text-lg font-semibold text-primary">{user?.name || 'Customer'}</p>
                <p className="text-sm text-muted-foreground">{user?.email || 'No email available'}</p>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setActiveNav(item.href)}
                    className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      activePath(item.href)
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.replace('/auth/login');
                }}
                className="mt-6 w-full rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <LogOut className="h-4 w-4" /> Logout
                </span>
              </button>
            </div>
          </aside>

          <main className="space-y-8">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
