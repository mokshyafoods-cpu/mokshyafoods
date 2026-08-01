'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Award, Leaf, Play, Sparkles, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { productAPI } from '@/services/api';
import { toast } from 'sonner';
import { getProductUrl } from '@/lib/productRoutes';
import WishlistButton from '@/components/WishlistButton';
import AddToCartButton from '@/components/AddToCartButton';

const featureItems = [
  { title: 'No sugar added', description: 'Naturally sweet dried fruits.' },
  { title: 'Farm fresh', description: 'From Nepali orchards and spice farms.' },
  { title: 'Gift-ready packs', description: 'Premium packaging for every occasion.' },
];

const whyItems = [
  { title: 'Naturally Dried', description: 'Carefully dried to preserve flavor, texture, and nutrition.', icon: Leaf },
  { title: 'Crafted for Quality', description: 'Carefully selected and packed with attention to detail.', icon: Award },
  { title: 'Fast Delivery', description: 'Reliable delivery across Nepal for everyday convenience.', icon: Truck },
  { title: 'Trusted by Families', description: 'Simple, wholesome snacks made for daily routines.', icon: Sparkles },
];

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const productData = await productAPI.getAll();
        const payload = productData?.data;
        const nextProducts = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        setProducts(nextProducts);
      } catch (error) {
        console.error('Failed to load homepage data', error);
        toast.error('Unable to load products.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const heroImage = products[0]?.thumbnail || products[0]?.images?.[0]?.url || '/placeholder.jpg';
  const rankedProducts = [...products]
    .map((item) => {
      const ratingScore = Number(item.rating || 0) * 8;
      const reviewScore = Number(item.reviewCount || 0) * 2;
      const stockScore = Number(item.quantity || 0) > 0 ? Math.min(Number(item.quantity || 0), 100) / 20 : 0;
      const featuredScore = item.featured ? 20 : 0;
      const popularityScore = ratingScore + reviewScore + stockScore + featuredScore;

      return {
        ...item,
        popularityScore,
      };
    })
    .sort((a, b) => b.popularityScore - a.popularityScore);

  const topSelling = rankedProducts.slice(0, 3);
  const everydayBites = rankedProducts.slice(0, 8);

  const getItemImage = (item: any) => item.thumbnail || item.image || item.images?.[0]?.url || '/placeholder.jpg';

  const getSalePricing = (item: any) => {
    const now = Date.now();
    const onSale = !!item.onSale;
    const saleStart = item.saleStart ? new Date(item.saleStart).getTime() : null;
    const saleEnd = item.saleEnd ? new Date(item.saleEnd).getTime() : null;
    const saleActive = onSale && (!saleStart || saleStart <= now) && (!saleEnd || saleEnd >= now) && item.discountPrice;
    const price = Number(saleActive ? item.discountPrice : item.price || item.amount || 0);
    const compareAtPrice = Number(item.price || item.amount || 0);
    return { price, compareAtPrice, saleActive };
  };

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsHydrated(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col bg-[#f8f9fa] ${isHydrated ? 'opacity-100' : 'opacity-95'}`}>
      <Navigation />

      <main className="flex-grow">
        <section className="relative overflow-hidden bg-[#f5f0e8] pt-4 pb-10 sm:pt-6 sm:pb-12 lg:pt-8 lg:pb-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(28,64,40,0.08),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(201,162,39,0.08),_transparent_30%)]" />
          <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-semibold text-secondary">
                  Natural snacks from Nepal
                </div>
                <div className="mt-8">
                  <div className="space-y-6 max-w-3xl">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-600">
                      Mokshya Foods
                    </p>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                      Pure Taste, Naturally Preserved.
                    </h1>
                    <p className="text-lg leading-8 text-slate-700">
                      Naturally dried fruits and wholesome snacks from Nepal — carefully prepared for everyday family use, gifting, and simple pantry staples.
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <Link href="/products" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-8 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-200/20 transition hover:bg-slate-800">
                        Shop Now <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link href="/#story" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-100">
                        Our Story
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
                  {['Naturally Dried', 'Thoughtful Packaging', 'Delivered with Care'].map((label) => (
                    <div key={label} className="rounded-3xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm">
                      <p className="text-sm font-semibold text-slate-950">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6">
                <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-[0_40px_80px_rgba(15,23,42,0.18)] h-[320px] sm:h-[460px] lg:h-[560px]">
                  <Image
                    src="/1.jpeg"
                    alt="Mokshya premium dried fruits"
                    fill
                    className="object-cover brightness-[0.95]"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>

                <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                  {['/driedmango.png', '/driedkiwi.png', '/1.jpeg'].map((src, index) => (
                    <div key={index} className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white h-32 sm:h-40 shadow-sm">
                      <Image src={src} alt={`Premium fruit ${index + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
              {[
                { label: 'Batch Checked', description: 'Packed with care' },
                { label: 'Made in Nepal', description: 'Local sourcing' },
                { label: '100% Natural', description: 'No additives' },
                { label: 'Resealable Pouch', description: 'Practical packaging' },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-center shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary">{item.label}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-secondary">Top Selling</p>
                <h2 className="mt-2 text-3xl font-bold text-primary">Best sellers this week</h2>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Browse our most popular products, loved by customers for taste and freshness.
              </p>
            </div>

            {loading ? (
              <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-[420px] animate-pulse rounded-[1.75rem] border border-border bg-slate-100" />
                ))}
              </div>
            ) : topSelling.length === 0 ? (
              <div className="rounded-[1.75rem] border border-border bg-white p-12 text-center">
                <p className="text-lg text-muted-foreground">No featured products available yet.</p>
              </div>
            ) : (
              <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {topSelling.map((item) => {
                  const imageSrc = getItemImage(item);
                  const { price, compareAtPrice, saleActive } = getSalePricing(item);
                  return (
                    <Link
                      key={item._id || item.id || item.name}
                      href={getProductUrl(item, item._id || item.id)}
                      className="group block overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative overflow-hidden">
                        <Image
                          src={imageSrc}
                          alt={item.name}
                          width={540}
                          height={420}
                          className="h-72 w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute left-4 top-4">
                          <WishlistButton product={item} className="h-10 w-10" iconClassName="w-4 h-4" />
                        </div>
                        {item.status && (
                          <span className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                            {item.status}
                          </span>
                        )}
                      </div>
                      <div className="space-y-3 p-5">
                        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                          <span>{item.category?.name || 'Premium snack'}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">{item.weight || '250g'}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-primary line-clamp-2">{item.name}</h3>
                        {item.description && <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>}
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-lg font-bold text-secondary">RS {price.toFixed(0)}</div>
                            {saleActive && compareAtPrice > price && (
                              <div className="text-xs text-slate-500 line-through">RS {compareAtPrice.toFixed(0)}</div>
                            )}
                          </div>
                          <AddToCartButton
                            product={item}
                            price={price}
                            image={getItemImage(item)}
                            className="rounded-full px-4 py-2"
                            labelClassName="text-sm"
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-secondary">Everyday healthy bites</p>
                <h2 className="mt-2 text-3xl font-bold text-primary">Snacks for every day</h2>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Light, tasty, and wholesome snacks that fit into daily routines and family meals.
              </p>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-[420px] animate-pulse rounded-[1.75rem] border border-border bg-slate-100" />
                ))}
              </div>
            ) : everydayBites.length === 0 ? (
              <div className="rounded-[1.75rem] border border-border bg-white p-12 text-center">
                <p className="text-lg text-muted-foreground">No everyday favorites are available yet.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {everydayBites.map((item) => {
                  const imageSrc = getItemImage(item);
                  const { price, compareAtPrice, saleActive } = getSalePricing(item);
                  return (
                    <Link
                      key={item._id || item.id || item.name}
                      href={getProductUrl(item, item._id || item.id)}
                      className="group block overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative overflow-hidden h-72">
                        <Image
                          src={imageSrc}
                          alt={item.name}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition duration-200 group-hover:opacity-100">
                          <WishlistButton product={item} className="h-10 w-10" iconClassName="h-5 w-5" />
                          <AddToCartButton product={item} price={price} image={getItemImage(item)} compact />
                        </div>
                      </div>
                      <div className="space-y-3 p-5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Sparkles className="w-4 h-4 text-secondary" />
                          <span>{item.category?.name || 'Healthy choice'}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-primary line-clamp-2">{item.name}</h3>
                        {item.description && <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>}
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-lg font-bold text-secondary">RS {price.toFixed(0)}</div>
                            {saleActive && compareAtPrice > price && (
                              <div className="text-xs text-slate-500 line-through">RS {compareAtPrice.toFixed(0)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-secondary">Why Mokshya Foods?</p>
            <h2 className="mt-4 text-3xl font-bold text-primary">Authentic taste, quality ingredients, and careful preparation</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">
              We bring you food you can trust — made with tradition, delivered with care.
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {whyItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="why-card rounded-[1.75rem] border border-border bg-white p-8 shadow-sm transition duration-200 ease-out"
                  >
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary transition-transform duration-300 hover:scale-105">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-primary">{item.title}</h3>
                    <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-secondary">Social stories</p>
                <h2 className="mt-2 text-3xl font-bold text-primary">See how our products come to life</h2>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Behind-the-scenes packing, product handling, and daily work from the Mokshya team.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { video: '/video/video1.mp4', title: 'Production Process', desc: 'Watch our careful drying process' },
                { video: '/video/video2.mp4', title: 'Quality Check', desc: 'How we ensure premium quality' },
                { video: '/video/video1.mp4', title: 'Behind the Scenes', desc: 'Life at Mokshya Foods' },
              ].map((item, index) => (
                <div key={index} className="group overflow-hidden rounded-[1.75rem] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative h-80 overflow-hidden bg-muted">
                    <video
                      src={item.video}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      preload="metadata"
                      controls
                      muted
                      autoPlay
                      loop
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-200 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          const video = document.querySelector(`video[src="${item.video}"]`) as HTMLVideoElement;
                          if (video) {
                            video.play();
                          }
                        }}
                        className="rounded-full bg-white p-4 text-primary shadow-lg transition hover:bg-white/90"
                        aria-label="Play video"
                      >
                        <Play className="w-8 h-8" />
                      </button>
                    </div>
                    <div className="absolute left-4 top-4 rounded-full bg-white/90 p-3 text-primary group-hover:opacity-0 transition duration-200">
                      <Play className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-semibold text-secondary">Mokshya Foods</p>
                    <h3 className="mt-3 text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
