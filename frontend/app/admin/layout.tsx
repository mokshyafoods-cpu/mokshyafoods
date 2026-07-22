'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, BarChart3, Package, ShoppingBag, Users, Settings, LogOut, Menu, X, PlusCircle, BookOpenCheck, Factory, FileBarChart, Boxes } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type SectionKey = 'overview' | 'orders' | 'products' | 'low-stock' | 'customers' | 'payment-ledger' | 'raw-materials' | 'production' | 'reports' | 'operations' | 'settings';

const getSectionFromPath = (pathname?: string | null): SectionKey => {
  const normalized = pathname?.replace(/\/+$/, '') || '/admin';
  if (normalized === '/admin') return 'overview';
  if (normalized.startsWith('/admin/orders')) return 'orders';
  if (normalized.startsWith('/admin/products')) return 'products';
  if (normalized.startsWith('/admin/low-stock')) return 'low-stock';
  if (normalized.startsWith('/admin/customers')) return 'customers';
  if (normalized.startsWith('/admin/payment-ledger')) return 'payment-ledger';
  if (normalized.startsWith('/admin/raw-materials')) return 'raw-materials';
  if (normalized.startsWith('/admin/production')) return 'production';
  if (normalized.startsWith('/admin/reports')) return 'reports';
  if (normalized.startsWith('/admin/operations')) return 'operations';
  if (normalized.startsWith('/admin/settings')) return 'settings';
  return 'overview';
};

const navItems: Array<{ label: string; key: SectionKey; href: string; icon: React.ReactNode }> = [
  { label: 'Overview', key: 'overview', href: '/admin', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Orders', key: 'orders', href: '/admin/orders', icon: <ShoppingBag className="w-5 h-5" /> },
  { label: 'Products', key: 'products', href: '/admin/products', icon: <Package className="w-5 h-5" /> },
  { label: 'Low stock', key: 'low-stock', href: '/admin/low-stock', icon: <AlertTriangle className="w-5 h-5" /> },
  { label: 'Customers', key: 'customers', href: '/admin/customers', icon: <Users className="w-5 h-5" /> },
  { label: 'Payment Ledger', key: 'payment-ledger', href: '/admin/payment-ledger', icon: <BookOpenCheck className="w-5 h-5" /> },
  { label: 'Raw Materials', key: 'raw-materials', href: '/admin/raw-materials', icon: <Boxes className="w-5 h-5" /> },
  { label: 'Production', key: 'production', href: '/admin/production', icon: <Factory className="w-5 h-5" /> },
  { label: 'Reports', key: 'reports', href: '/admin/reports', icon: <FileBarChart className="w-5 h-5" /> },
  { label: 'Operations', key: 'operations', href: '/admin/operations', icon: <Factory className="w-5 h-5" /> },
  { label: 'Settings', key: 'settings', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>(() => getSectionFromPath(pathname));

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    setActiveSection(getSectionFromPath(pathname));
  }, [pathname]);

  if (!user) {
    return null;
  }

  const allowedAdminPaths = user.role === 'admin' ? null : ['/admin/pos'];

  if (user.role !== 'admin' && !allowedAdminPaths?.includes(pathname || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-xl rounded-[2rem] border border-border bg-white p-10 text-center shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Access Denied</p>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">Admin access required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            You do not have permission to view this page. Please sign in with an admin or cashier account.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const navItemsForRole = navItems.filter((item) => item.key !== 'orders' || user.role === 'admin');

  const renderSectionContent = () => {
    if (pathname?.startsWith('/admin/products/') && pathname !== '/admin/products/new') {
      return children;
    }
    if (pathname === '/admin/pos') {
      return children;
    }
    if (pathname === '/admin/orders') {
      return children;
    }
    if (pathname === '/admin/products') {
      return children;
    }
    if (pathname === '/admin/low-stock') {
      return children;
    }
    if (pathname === '/admin/customers') {
      return children;
    }
    if (pathname === '/admin/payment-ledger') {
      return children;
    }
    if (pathname === '/admin/raw-materials') {
      return children;
    }
    if (pathname === '/admin/production') {
      return children;
    }
    if (pathname === '/admin/reports') {
      return children;
    }
    if (pathname === '/admin/operations') {
      return children;
    }
    if (pathname === '/admin/settings') {
      return children;
    }
    return children;
  };

  const isPosFullScreen = pathname === '/admin/pos' || pathname.startsWith('/admin/pos/');

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#08111f_48%,_#0f172a_100%)] text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {!isPosFullScreen && (
          <aside className={`print:hidden fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-slate-800/80 bg-[linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] text-white shadow-[12px_0_45px_rgba(2,6,23,0.35)] transition-transform duration-300 lg:static lg:translate-x-0 ${navOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="flex h-full flex-col justify-between p-6">
              <div className="mb-6 flex items-center justify-between lg:hidden">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.38em] text-slate-400">Mokshya Admin</p>
                  <h2 className="text-xl font-semibold text-white">Control Panel</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setNavOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div>
                <div className="mb-10 space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.38em] text-slate-400">Mokshya Admin</p>
                  <h2 className="text-2xl font-semibold text-white">Control Panel</h2>
                </div>

                <nav className="space-y-1">
                  {navItemsForRole.map((item) => {
                    const active = pathname === item.href || (item.href === '/admin' && pathname === '/admin');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setNavOpen(false)}
                        className={`relative z-30 flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition select-none pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                          active ? 'bg-sky-400/15 text-white shadow-[inset_0_0_0_1px_rgba(125,211,252,0.25)]' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                        aria-current={active ? 'page' : undefined}
                        aria-label={`Open ${item.label}`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-4 border-t border-white/10 pt-5">
                <div className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Logged in as</p>
                  <p className="mt-2 font-medium text-white">{user.name}</p>
                  <p className="text-sm text-slate-400">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    router.replace('/auth/login');
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </aside>
        )}

        <main className={`flex-1 ${isPosFullScreen ? 'lg:p-0' : 'lg:p-8'}`}>
          <div className="print:hidden border-b border-slate-800/70 bg-slate-950/75 px-4 py-4 backdrop-blur-xl lg:px-0">
            <div className={`mx-auto flex items-center justify-between gap-4 ${isPosFullScreen ? 'max-w-none px-4 sm:px-6 lg:px-8' : 'max-w-7xl'}`}>
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Admin</p>
                <p className="text-lg font-semibold text-white">Operations Hub</p>
              </div>
              <div className="flex items-center gap-2">
                {isPosFullScreen ? (
                  <Link
                    href="/admin"
                    className="inline-flex h-11 items-center rounded-full border border-slate-700/70 bg-slate-900 px-4 text-sm font-semibold text-slate-100 transition hover:border-sky-400 hover:text-sky-200"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Link>
                ) : (
                  <Link
                    href="/admin/pos"
                    className="hidden h-11 items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-4 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20 sm:inline-flex"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    POS Dashboard
                  </Link>
                )}
                <Link
                  href="/admin/products/new"
                  className="hidden h-11 items-center rounded-full bg-sky-500 px-4 text-sm font-semibold text-white transition hover:bg-sky-400 sm:inline-flex"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Product
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    router.replace('/auth/login');
                  }}
                  className="hidden h-11 items-center rounded-full border border-slate-700/70 bg-slate-900 px-3 text-sm font-semibold text-slate-100 transition hover:border-sky-400 hover:text-sky-200 sm:inline-flex"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </button>
                {!isPosFullScreen && (
                  <button
                    type="button"
                    onClick={() => setNavOpen(true)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-white transition hover:bg-slate-700 lg:hidden"
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className={isPosFullScreen ? 'w-full px-0 py-0' : 'mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-0'}>
            {renderSectionContent()}
          </div>
        </main>
      </div>
      {navOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setNavOpen(false)} />}
    </div>
  );
}
