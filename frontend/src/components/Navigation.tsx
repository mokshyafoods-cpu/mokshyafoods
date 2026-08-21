'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, User, LogOut, Menu, X, Heart, Search, House, Phone, Package2, BadgeInfo, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/context/cartStore';
import { addGuestWishlistItem, readGuestWishlist, removeGuestWishlistItem } from '@/lib/wishlist';
import { categoryAPI, wishlistAPI } from '@/services/api';
import { toast } from 'sonner';
import { FormEvent, useEffect, useState } from 'react';

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const { items, getTotalItems, getTotalPrice, updateQuantity, removeItem, addItem } = useCartStore();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<'cart' | 'wishlist' | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setSearchOpen(false);
        setActiveDrawer(null);
      }
    };

    if (menuOpen || searchOpen || activeDrawer) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen, searchOpen, activeDrawer]);

  useEffect(() => {
    const syncWishlistDrawer = async () => {
      if (!isMounted) return;

      if (isAuthenticated) {
        try {
          const response = await wishlistAPI.getWishlist();
          const payload = response?.data ?? response;
          const nextItems = Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload)
              ? payload
              : [];
          setWishlistItems(nextItems);
        } catch (error) {
          console.error('Failed to load wishlist drawer items:', error);
          setWishlistItems([]);
        }
        return;
      }

      setWishlistItems(readGuestWishlist());
    };

    syncWishlistDrawer();
  }, [isMounted, isAuthenticated, user]);

  const cartItemsCount = isMounted ? getTotalItems() : 0;
  const cartTotal = isMounted ? getTotalPrice() : 0;
  const wishlistCount = isMounted ? wishlistItems.length : 0;
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

  const handleCategoryClick = (categorySlug: string) => {
    const categoryUrl = `/products?category=${encodeURIComponent(categorySlug)}`;
    const currentUrl = window.location.pathname + window.location.search;

    if (currentUrl === categoryUrl) {
      router.refresh();
    } else {
      router.push(categoryUrl);
    }

    closeNav();
  };

  const toggleDrawer = (drawer: 'cart' | 'wishlist') => {
    setActiveDrawer((current) => (current === drawer ? null : drawer));
  };

  const closeDrawer = () => setActiveDrawer(null);

  const handleMoveWishlistItemToCart = (item: any) => {
    const productId = String(item?.product?._id || item?.productId || item?.id || item?._id || item?.id || '');
    const productName = item?.product?.name || item?.name || 'Product';
    const price = Number(item?.product?.discountPrice ?? item?.product?.price ?? item?.price ?? 0);
    const image = item?.product?.thumbnail || item?.product?.image || item?.image || '/placeholder.jpg';

    if (!productId) return;

    addItem({
      productId,
      name: productName,
      price,
      quantity: 1,
      image,
      category: item?.product?.category?.name || item?.category || 'Uncategorized',
      thumbnail: image,
      images: item?.product?.images?.map((img: any) => img?.url || img?.secure_url || img?.path).filter(Boolean) || [image],
      stock: item?.product?.quantity ?? 1,
    });

    if (isAuthenticated) {
      wishlistAPI.removeFromWishlist(productId).catch(() => undefined);
    } else {
      removeGuestWishlistItem(productId);
    }

    setWishlistItems((current) => current.filter((entry) => {
      if (isAuthenticated) {
        return String(entry?.product?._id || entry?.productId || entry?._id || entry?.id || '') !== productId;
      }
      return String(entry?.id || '') !== productId;
    }));

    toast.success(`${productName} moved to cart`);
    closeDrawer();
  };

  const removeWishlistItem = async (item: any) => {
    const productId = String(item?.product?._id || item?.productId || item?.id || item?._id || item?.id || '');

    if (!productId) return;

    if (isAuthenticated) {
      try {
        await wishlistAPI.removeFromWishlist(productId);
      } catch (error) {
        console.error('Failed to remove wishlist item:', error);
      }
    } else {
      removeGuestWishlistItem(productId);
    }

    setWishlistItems((current) => current.filter((entry) => {
      if (isAuthenticated) {
        return String(entry?.product?._id || entry?.productId || entry?._id || entry?.id || '') !== productId;
      }
      return String(entry?.id || '') !== productId;
    }));
  };

  return (
    <div className="sticky top-0 z-50 w-full overflow-x-hidden pb-16 pt-0 supports-[padding-top:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top,0px)] lg:pb-0">
      <div className="bg-primary px-3 py-1 text-center text-[11px] font-semibold leading-3 text-primary-foreground sm:px-4 sm:py-1.5 sm:text-sm sm:leading-4">
        <span className="block truncate sm:whitespace-normal">
          Naturally dried foods and food powders from Nepal, prepared with care.
        </span>
      </div>
      <nav className="border-b border-border/80 bg-white/95 backdrop-blur will-change-transform">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-10 items-center justify-between gap-2 py-0 sm:h-16 sm:gap-3 sm:py-3 lg:h-20">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="Mokshya Foods home">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-2xl ring-1 ring-accent/20 bg-accent/10 sm:h-12 sm:w-12">
                  <Image
                    src="/logo.jpeg"
                    alt="Mokshya Foods"
                    width={48}
                    height={48}
                    priority
                    className="h-full w-full object-cover"
                    sizes="(max-width: 640px) 36px, 48px"
                  />
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
                    Shop
                    <span className="absolute left-0 -bottom-1 h-[3px] w-full bg-primary origin-left scale-x-0 transition-transform duration-150 ease-out group-hover:scale-x-100" />
                  </span>
                </Link>
                <Link href="/products?category=powder" onClick={closeNav} className="flex items-center gap-2 text-slate-950 group hover:text-primary transition">
                  <BadgeInfo className="h-4 w-4 text-primary" />
                  <span className="relative inline-block transform transition-transform duration-150 ease-out group-hover:-translate-y-1">
                    Powder
                    <span className="absolute left-0 -bottom-1 h-[3px] w-full bg-primary origin-left scale-x-0 transition-transform duration-150 ease-out group-hover:scale-x-100" />
                  </span>
                </Link>
                {filteredCategories.slice(0, 2).map((category) => (
                  <button
                    key={category._id || category.name}
                    type="button"
                    onClick={() => handleCategoryClick(category.slug || category._id || category.name)}
                    className="flex items-center gap-2 text-slate-950 group hover:text-primary transition"
                  >
                    <BadgeInfo className="h-4 w-4 text-primary" />
                    <span className="relative inline-block transform transition-transform duration-150 ease-out group-hover:-translate-y-1">
                      {category.name}
                      <span className="absolute left-0 -bottom-1 h-[3px] w-full bg-primary origin-left scale-x-0 transition-transform duration-150 ease-out group-hover:scale-x-100" />
                    </span>
                  </button>
                ))}
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
              <form onSubmit={handleSearchSubmit} className="hidden md:flex w-full max-w-2xl rounded-full border border-border bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200/80 md:py-3.5">
                <Search className="w-5 h-5 text-slate-500" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  name="search"
                  type="search"
                  placeholder="Search products by name..."
                  className="w-full bg-white px-3 text-base text-slate-950 placeholder:text-slate-400 focus:outline-none"
                />
                <button type="submit" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-secondary transition">
                  Search
                </button>
              </form>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <button
                type="button"
                onClick={() => toggleDrawer('wishlist')}
                className="relative flex flex-col items-center gap-1 text-center text-sm text-slate-950 hover:text-rose-600 transition"
              >
                <Heart className="w-5 h-5" />
                <span>Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex items-center justify-center rounded-full bg-rose-600 text-white text-xs font-semibold px-2 py-0.5">
                    {wishlistCount}
                  </span>
                )}
              </button>
              <Link href={isAuthenticated ? '/account' : '/auth/login'} className="flex flex-col items-center gap-1 text-center text-sm text-slate-950 hover:text-primary transition">
                <User className="w-5 h-5" />
                <span>{isAuthenticated ? 'Account' : 'Sign in'}</span>
              </Link>
              <button
                type="button"
                onClick={() => toggleDrawer('cart')}
                className="relative flex flex-col items-center gap-1 text-center text-sm text-slate-950 hover:text-primary transition"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Cart</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex items-center justify-center rounded-full bg-primary text-white text-xs font-semibold px-2 py-0.5">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-1 lg:hidden">
              <button
                type="button"
                onClick={() => setSearchOpen((current) => !current)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                aria-label={searchOpen ? 'Close search' : 'Open search'}
                aria-expanded={searchOpen}
                aria-controls="mobile-search"
              >
                <Search className="h-5 w-5 text-primary" />
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                aria-haspopup="dialog"
              >
                {menuOpen ? <X className="h-5 w-5 text-primary" /> : <Menu className="h-5 w-5 text-primary" />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile menu" className="lg:hidden max-h-[calc(100dvh-5.5rem)] overflow-y-auto overflow-x-hidden border-t border-border bg-white/95 py-4 shadow-[0_10px_35px_rgba(15,23,42,0.08)] transition-opacity duration-150 ease-out">
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
                <Link href="/products?category=powder" onClick={closeNav} className="flex items-center gap-2 py-2 text-slate-950 hover:text-primary">
                  <BadgeInfo className="h-4 w-4 text-primary" />
                  <span>Powder</span>
                </Link>
                {filteredCategories.slice(0, 5).map((category) => (
                  <button
                    key={category._id || category.name}
                    type="button"
                    onClick={() => handleCategoryClick(category.slug || category._id || category.name)}
                    className="block py-2 text-slate-950 hover:text-primary transition w-full text-left group"
                  >
                    <span className="relative inline-block transform transition-transform duration-150 ease-out group-hover:-translate-y-1">
                      {category.name}
                      <span className="absolute left-0 -bottom-1 h-[3px] w-full bg-primary origin-left scale-x-0 transition-transform duration-150 ease-out group-hover:scale-x-100" />
                    </span>
                  </button>
                ))}
                <Link href="/contact" onClick={closeNav} className="flex items-center gap-2 py-2 text-slate-950 hover:text-primary">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>Contact</span>
                </Link>
                <Link href={isAuthenticated ? '/account' : '/auth/login'} onClick={closeNav} className="flex items-center gap-2 py-2 text-slate-950 hover:text-primary">
                  <User className="h-4 w-4 text-primary" />
                  <span>{isAuthenticated ? 'Account' : 'Sign in'}</span>
                </Link>
                <button type="button" onClick={() => { closeNav(); toggleDrawer('wishlist'); }} className="flex items-center gap-2 py-2 text-slate-950 hover:text-rose-600 text-left">
                  <Heart className="h-4 w-4 text-rose-600" />
                  <span>Wishlist</span>
                  {wishlistCount > 0 && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">{wishlistCount}</span>}
                </button>
                <button type="button" onClick={() => { closeNav(); toggleDrawer('cart'); }} className="flex items-center gap-2 py-2 text-slate-950 hover:text-primary text-left">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <span>Cart</span>
                  {cartItemsCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">{cartItemsCount}</span>}
                </button>
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
            <div id="mobile-search" role="search" className="lg:hidden border-t border-border bg-white/95 py-4">
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
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  closeNav();
                  if (item.href === '/cart') {
                    toggleDrawer('cart');
                    return;
                  }
                  router.push(item.href);
                }}
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
              </button>
            );
          })}
        </div>
      </div>

      {activeDrawer && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[1px]" onClick={closeDrawer} aria-hidden="true" />
      )}

      {activeDrawer === 'cart' && (
        <aside className="fixed inset-y-0 right-0 z-[80] w-full max-w-md border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Your Cart ({cartItemsCount} items)</h2>
              </div>
              <button type="button" onClick={closeDrawer} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Close cart">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <ShoppingCart className="mb-3 h-10 w-10 text-slate-400" />
                  <p className="text-lg font-semibold text-slate-800">Your cart is empty</p>
                  <p className="mt-1 text-sm text-slate-500">Add a few products to get started.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.productId} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-white">
                      <img src={item.image || '/placeholder.jpg'} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-600">Rs {item.price}</p>
                        </div>
                        <button type="button" onClick={() => removeItem(item.productId)} className="rounded-full p-1.5 text-slate-400 transition hover:bg-white hover:text-red-500" aria-label={`Remove ${item.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
                          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="flex h-8 w-8 items-center justify-center text-slate-700 hover:bg-slate-100" aria-label="Decrease quantity">
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold text-slate-800">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="flex h-8 w-8 items-center justify-center text-slate-700 hover:bg-slate-100" aria-label="Increase quantity">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-slate-900">Rs {item.price * item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-200 bg-white px-5 py-4">
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold text-slate-900">Rs {cartTotal.toFixed(0)}</span></div>
                <div className="flex justify-between"><span>Total</span><span className="text-base font-bold text-slate-900">Rs {cartTotal.toFixed(0)}</span></div>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  router.push('/checkout');
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {activeDrawer === 'wishlist' && (
        <aside className="fixed inset-y-0 left-0 z-[80] w-full max-w-md border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-xl font-bold text-slate-900">Your Wishlist ({wishlistCount} items)</h2>
              <button type="button" onClick={closeDrawer} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Close wishlist">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {wishlistItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <Heart className="mb-3 h-10 w-10 text-rose-400" />
                  <p className="text-lg font-semibold text-slate-800">No saved items yet</p>
                  <p className="mt-1 text-sm text-slate-500">Save products you love to revisit later.</p>
                </div>
              ) : (
                wishlistItems.map((item) => {
                  const productId = String(item?.product?._id || item?.productId || item?.id || item?._id || item?.product?.id || '');
                  const productName = item?.product?.name || item?.name || 'Product';
                  const productImage = item?.product?.thumbnail || item?.product?.image || item?.image || '/placeholder.jpg';
                  const productPrice = Number(item?.product?.discountPrice ?? item?.product?.price ?? item?.price ?? 0);

                  return (
                    <div key={productId || productName} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-white">
                        <img src={productImage} alt={productName} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-semibold text-slate-900">{productName}</p>
                            <p className="text-sm text-slate-600">Rs {productPrice}</p>
                          </div>
                          <button type="button" onClick={() => removeWishlistItem(item)} className="rounded-full p-1.5 text-slate-400 transition hover:bg-white hover:text-red-500" aria-label={`Remove ${productName}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <button type="button" onClick={() => handleMoveWishlistItemToCart(item)} className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary/90">
                          Move to cart
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
