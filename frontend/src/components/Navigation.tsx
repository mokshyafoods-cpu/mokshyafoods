'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, User, LogOut, Menu, X, Heart, Search, House, Phone, Package2, BadgeInfo, BadgeCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/context/cartStore';
import { readGuestWishlist } from '@/lib/wishlist';
import { categoryAPI } from '@/services/api';
import { toast } from 'sonner';
import { FormEvent, useEffect, useState } from 'react';

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const { getTotalItems, getTotalPrice } = useCartStore();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);

    const loadCategories = async () => {
      try {
        const response = await categoryAPI.getAll();
        const payload = response.data;
        const nextCategories = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        setCategories(nextCategories);
      } catch (error) {
        console.error('Failed to load navigation categories:', error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const cartItemsCount = isMounted ? getTotalItems() : 0;
  const cartTotal = 0; // hide money display by design
  const wishlistCount = isMounted ? (isAuthenticated ? ((user as any)?.wishlist ? (user as any).wishlist.length : 0) : readGuestWishlist().length) : 0;
  const filteredCategories = Array.isArray(categories) ? categories.filter((c) => {
    const name = (c.name || '').toString().toLowerCase().trim();
    return name !== 'healthy snacks' && name !== 'gift packs';
  }) : [];
  const [searchText, setSearchText] = useState('');
  const mobileNavItems = [
    { href: '/', label: 'Home', icon: House },
    { href: '/products', label: 'Products', icon: Package2 },
    { href: '/cart', label: 'Cart', icon: ShoppingCart },
    { href: isAuthenticated ? '/account' : '/auth/login', label: 'Account', icon: User },
  ];

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = searchText.trim();
    if (!keyword) {
      console.log('Please enter a search term before searching.');
      return;
    }

    setMenuOpen(false);
    setSearchOpen(false);
    setSearchText('');
    router.push(`/products?search=${encodeURIComponent(keyword)}`);
  };

  const closeNav = () => {
    setMenuOpen(false);
    setSearchOpen(false);
  };

  return (
    <div className="sticky top-0 z-50 w-full overflow-x-hidden pb-20 pt-0 supports-[padding-top:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top,0px)] lg:pb-0">
      <div className="bg-primary px-3 py-1 text-center text-[11px] font-semibold leading-3 text-primary-foreground sm:px-4 sm:py-1.5 sm:text-sm sm:leading-4">
        <span className="block truncate sm:whitespace-normal">
          Pure Nepali dried fruits, naturally crafted for your family.
        </span>
      </div>
      <nav className="border-b border-border/80 bg-white/95 backdrop-blur will-change-transform">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-10 items-center justify-between gap-2 py-0 sm:h-16 sm:gap-3 sm:py-3 lg:h-20">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="relative h-9 w-9 rounded-2xl overflow-hidden ring-1 ring-accent/20 bg-accent/10 sm:h-12 sm:w-12">
                  <img src="/logo.jpeg" alt="Mokshya Foods Logo" className="object-cover w-full h-full" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Mokshya</p>
                  <p className="text-base font-bold text-primary">Foods</p>
                </div>
              </Link>

              <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
                <Link href="/products" onClick={closeNav} className="flex items-center gap-2 text-slate-950 group">
                  <Package2 className="h-4 w-4 text-primary" />
                  <span className="relative inline-block transform transition-transform duration-150 ease-out group-hover:-translate-y-1">
                    All Products
                    <span className="absolute left-0 -bottom-1 h-[3px] w-full bg-primary origin-left scale-x-0 transition-transform duration-150 ease-out group-hover:scale-x-100" />
                  </span>
                </Link>
                {filteredCategories.slice(0, 3).map((category) => (
                  <Link
                    key={category._id || category.name}
                    href={`/products?category=${encodeURIComponent(category.slug || category._id || category.name)}`}
                    onClick={closeNav}
                    className="flex items-center gap-2 text-slate-950 group"
                  >
                    <BadgeInfo className="h-4 w-4 text-primary" />
                    <span className="relative inline-block transform transition-transform duration-150 ease-out group-hover:-translate-y-1">
                      {category.name}
                      <span className="absolute left-0 -bottom-1 h-[3px] w-full bg-primary origin-left scale-x-0 transition-transform duration-150 ease-out group-hover:scale-x-100" />
                    </span>
                  </Link>
                ))}
                {filteredCategories.length > 3 && (
                  <Link href="/products" onClick={closeNav} className="text-slate-950 group">
                    <span className="relative inline-block transform transition-transform duration-150 ease-out group-hover:-translate-y-1">
                      More
                      <span className="absolute left-0 -bottom-1 h-[3px] w-full bg-primary origin-left scale-x-0 transition-transform duration-150 ease-out group-hover:scale-x-100" />
                    </span>
                  </Link>
                )}
                <Link href="/contact" onClick={closeNav} className="flex items-center gap-2 text-slate-950 group">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="relative inline-block transform transition-transform duration-150 ease-out group-hover:-translate-y-1">
                    Contact
                    <span className="absolute left-0 -bottom-1 h-[3px] w-full bg-primary origin-left scale-x-0 transition-transform duration-150 ease-out group-hover:scale-x-100" />
                  </span>
                </Link>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-center">
              <form onSubmit={handleSearchSubmit} className="hidden md:flex w-full max-w-xl rounded-full border border-border bg-white px-3 py-2 shadow-sm">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  name="search"
                  type="search"
                  placeholder="Search products..."
                  className="w-full bg-white px-3 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none"
                />
                <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-secondary transition">
                  Search
                </button>
              </form>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <Link href={isAuthenticated ? '/account/wishlist' : '/wishlist'} className="relative flex flex-col items-center gap-1 text-center text-sm text-slate-950 hover:text-rose-600 transition">
                <Heart className="w-5 h-5" />
                <span>Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex items-center justify-center rounded-full bg-rose-600 text-white text-xs font-semibold px-2 py-0.5">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link href={isAuthenticated ? '/account' : '/auth/login'} className="flex flex-col items-center gap-1 text-center text-sm text-slate-950 hover:text-primary transition">
                <User className="w-5 h-5" />
                <span>{isAuthenticated ? 'Account' : 'Sign in'}</span>
              </Link>
              <Link href="/cart" className="relative flex flex-col items-center gap-1 text-center text-sm text-slate-950 hover:text-primary transition">
                <ShoppingCart className="w-5 h-5" />
                <span>Cart</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex items-center justify-center rounded-full bg-primary text-white text-xs font-semibold px-2 py-0.5">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </div>

            <div className="flex shrink-0 items-center gap-1 lg:hidden">
              <button
                type="button"
                onClick={() => setSearchOpen((current) => !current)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                aria-label="Open search"
              >
                <Search className="h-5 w-5 text-primary" />
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="h-5 w-5 text-primary" /> : <Menu className="h-5 w-5 text-primary" />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="lg:hidden max-h-[calc(100dvh-5.5rem)] overflow-y-auto overflow-x-hidden border-t border-border bg-white/95 py-4 shadow-[0_10px_35px_rgba(15,23,42,0.08)] transition-opacity duration-150 ease-out">
              <div className="flex flex-col gap-3 px-2">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Search className="w-4 h-4 text-slate-500" />
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    name="search"
                    type="search"
                    placeholder="Search products"
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-secondary transition"
                  >
                    Go
                  </button>
                </form>
                <Link href="/products" onClick={closeNav} className="flex items-center gap-2 py-2 text-slate-950 hover:text-primary">
                  <Package2 className="h-4 w-4 text-primary" />
                  <span>All Products</span>
                </Link>
                {filteredCategories.slice(0, 5).map((category) => (
                  <Link
                    key={category._id || category.name}
                    href={`/products?category=${encodeURIComponent(category.slug || category._id || category.name)}`}
                    onClick={closeNav}
                    className="block py-2 text-slate-950 group"
                  >
                    <span className="relative inline-block transform transition-transform duration-150 ease-out group-hover:-translate-y-1">
                      {category.name}
                      <span className="absolute left-0 -bottom-1 h-[3px] w-full bg-primary origin-left scale-x-0 transition-transform duration-150 ease-out group-hover:scale-x-100" />
                    </span>
                  </Link>
                ))}
                <Link href="/contact" onClick={closeNav} className="flex items-center gap-2 py-2 text-slate-950 hover:text-primary">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>Contact</span>
                </Link>
                <Link href={isAuthenticated ? '/account' : '/auth/login'} onClick={closeNav} className="flex items-center gap-2 py-2 text-slate-950 hover:text-primary">
                  <User className="h-4 w-4 text-primary" />
                  <span>{isAuthenticated ? 'Account' : 'Sign in'}</span>
                </Link>
                <Link href={isAuthenticated ? '/account/wishlist' : '/wishlist'} onClick={closeNav} className="flex items-center gap-2 py-2 text-slate-950 hover:text-rose-600">
                  <Heart className="h-4 w-4 text-rose-600" />
                  <span>Wishlist</span>
                  {wishlistCount > 0 && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">{wishlistCount}</span>}
                </Link>
                <Link href="/cart" onClick={closeNav} className="flex items-center gap-2 py-2 text-slate-950 hover:text-primary">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <span>Cart</span>
                  {cartItemsCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">{cartItemsCount}</span>}
                </Link>
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      closeNav();
                      router.replace('/auth/login');
                    }}
                    className="mt-3 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
                  >
                    <div className="inline-flex items-center justify-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
          {searchOpen && (
            <div className="lg:hidden border-t border-border bg-white/95 py-4">
              <div className="flex flex-col gap-3 px-2">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Search className="w-4 h-4 text-slate-500" />
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    name="search"
                    type="search"
                    placeholder="Search products"
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-secondary transition"
                  >
                    Go
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200/80 bg-white/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/'
              ? pathname === '/'
              : item.href === '/account'
                ? pathname === '/account' || pathname?.startsWith('/account/')
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeNav}
                className={`flex flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${isActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-primary'}`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-slate-600'}`} />
                  {item.href === '/cart' && cartItemsCount > 0 && (
                    <span className="absolute -right-2 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                      {cartItemsCount}
                    </span>
                  )}
                </div>
                <span className={`mt-1 ${isActive ? 'text-primary' : 'text-slate-600'}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
