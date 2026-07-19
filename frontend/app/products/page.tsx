'use client';

export const dynamic = 'force-dynamic';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { productAPI, categoryAPI, wishlistAPI } from '@/services/api';
import { useCartStore } from '@/context/cartStore';
import { toast } from 'sonner';
import { ShoppingCart, Heart, Grid, List, Search, X } from 'lucide-react';
import { addGuestWishlistItem } from '@/lib/wishlist';

const sortOptions = [
  { value: 'latest', label: 'Latest Products' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Best Rated' },
];

function ProductsPageContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [priceFilter, setPriceFilter] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [selectedTags, setSelectedTags] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [showDiscounted, setShowDiscounted] = useState(false);
  const [showFeatured, setShowFeatured] = useState(false);
  const [packagingFilter, setPackagingFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [sortOption, setSortOption] = useState('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuerySync = useRef(true);
  const [queryReady, setQueryReady] = useState(false);
  const { addItem } = useCartStore();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoryResponse = await categoryAPI.getAll();
        const payload = categoryResponse?.data ?? categoryResponse;
        const normalized = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.categories)
              ? payload.categories
              : [];
        const nextCategories = normalized.filter((item: any) => item && (item.name || item.slug || item._id || item.id));
        setCategories(nextCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (!searchParams) return;

    const urlCategory = searchParams.get('category') || '';
    const urlSearch = searchParams.get('search') || '';
    const urlMinPrice = searchParams.get('minPrice') || '';
    const urlMaxPrice = searchParams.get('maxPrice') || '';
    const urlSort = searchParams.get('sort') || 'latest';

    setSelectedCategories(urlCategory ? urlCategory.split(',').filter(Boolean) : []);
    setSearchQuery(urlSearch);
    setMinPrice(urlMinPrice);
    setMaxPrice(urlMaxPrice);
    setPriceFilter({
      min: urlMinPrice ? Number(urlMinPrice) : null,
      max: urlMaxPrice ? Number(urlMaxPrice) : null,
    });
    setSortOption(urlSort);
    setQueryReady(true);
  }, [searchParams]);

  useEffect(() => {
    if (!queryReady) return;
    if (initialQuerySync.current) {
      initialQuerySync.current = false;
      return;
    }

    const params = new URLSearchParams();

    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategories.length > 0) params.set('category', selectedCategories.join(','));
    if (priceFilter.min !== null) params.set('minPrice', String(priceFilter.min));
    if (priceFilter.max !== null) params.set('maxPrice', String(priceFilter.max));
    if (sortOption) params.set('sort', sortOption);
    if (showDiscounted) params.set('discounted', 'true');
    if (showFeatured) params.set('featured', 'true');
    if (selectedTags) params.set('tags', selectedTags);
    if (ratingFilter) params.set('rating', ratingFilter);
    if (packagingFilter) params.set('packaging', packagingFilter);
    if (originFilter) params.set('origin', originFilter);

    const url = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    if (url !== window.location.pathname + window.location.search) {
      router.replace(url, { scroll: false });
    }
  }, [searchQuery, selectedCategories, priceFilter.min, priceFilter.max, sortOption, showDiscounted, showFeatured, selectedTags, ratingFilter, packagingFilter, originFilter, router, queryReady]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const params: any = {
          limit: 100,
          page: 1,
          sort: sortOption,
        };

        if (selectedCategories.length > 0) {
          params.category = selectedCategories.join(',');
        }
        if (searchQuery) {
          params.search = searchQuery;
        }
        if (priceFilter.min !== null) {
          params.minPrice = priceFilter.min;
        }
        if (priceFilter.max !== null) {
          params.maxPrice = priceFilter.max;
        }
        if (showDiscounted) {
          params.discounted = true;
        }
        if (showFeatured) {
          params.featured = true;
        }
        if (selectedTags) {
          params.tags = selectedTags;
        }
        if (ratingFilter) {
          params.rating = ratingFilter;
        }
        if (packagingFilter) {
          params.packaging = packagingFilter;
        }
        if (originFilter) {
          params.origin = originFilter;
        }

        const response = await productAPI.getAll(params);
        const payload = response.data;
        const nextProducts = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        setProducts(nextProducts);
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedCategories, searchQuery, priceFilter.min, priceFilter.max, sortOption, showDiscounted, showFeatured, selectedTags, ratingFilter, packagingFilter, originFilter]);

  const filteredCategories = useMemo(
    () => (Array.isArray(categories) ? categories.filter((category) => (category.name || '').toLowerCase().includes(categorySearch.toLowerCase())) : []),
    [categories, categorySearch]
  );

  const getCategoryValues = (category: any) => [
    category?._id,
    category?.id,
    category?.slug,
    category?.name,
    category?.value,
    category?.key,
  ].filter(Boolean).map((value) => String(value).toLowerCase().trim());

  const isCategorySelected = (category: any) => {
    const values = getCategoryValues(category);
    return selectedCategories.some((value) => values.includes(String(value).toLowerCase().trim()));
  };

  const handleCategoryToggle = (category: any) => {
    const values = getCategoryValues(category);
    const categoryKey = values[0] || category?._id || category?.id || category?.slug || category?.name || '';
    setSelectedCategories((current) => {
      const isSelected = current.some((value) => values.includes(String(value).toLowerCase().trim()));
      if (isSelected) {
        return current.filter((value) => !values.includes(String(value).toLowerCase().trim()));
      }
      return [...current, categoryKey];
    });
  };

  const activeCategoryLabel = useMemo(() => {
    if (selectedCategories.length === 1) {
      const [value] = selectedCategories;
      const normalizedValue = String(value).toLowerCase().trim();
      const match = categories.find((category: any) => getCategoryValues(category).includes(normalizedValue));
      return match?.name || value;
    }
    return selectedCategories.length > 1 ? `${selectedCategories.length} categories` : 'All categories';
  }, [categories, selectedCategories]);

  const applyPriceFilter = () => {
    setPriceFilter({
      min: minPrice ? Number(minPrice) : null,
      max: maxPrice ? Number(maxPrice) : null,
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setCategorySearch('');
    setMinPrice('');
    setMaxPrice('');
    setPriceFilter({ min: null, max: null });
    setSortOption('latest');
    setShowDiscounted(false);
    setShowFeatured(false);
    setSelectedTags('');
    setRatingFilter('');
    setPackagingFilter('');
    setOriginFilter('');
  };

  const hasActiveFilters =
    !!searchQuery ||
    selectedCategories.length > 0 ||
    priceFilter.min !== null ||
    priceFilter.max !== null ||
    showDiscounted ||
    showFeatured ||
    !!selectedTags ||
    !!ratingFilter ||
    !!packagingFilter ||
    !!originFilter;

  const getDisplayCategoryLabel = (value: any) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return value.name || value.slug || value.title || value.value || value.key || '';
    }
    return String(value);
  };

  const getCategoryCandidates = (product: any) => {
    const rawCategory = product.category;
    const list = [
      rawCategory,
      rawCategory?.name,
      rawCategory?.slug,
      rawCategory?.id,
      rawCategory?._id,
      product.categoryName,
      product.categorySlug,
      product.categoryId,
      rawCategory?.title,
      rawCategory?.value,
      rawCategory?.key,
      product.categoryType,
      product.categoryType?.name,
      product.categoryType?.slug,
      product.categoryType?.value,
      product.categoryType?.key,
      product.category,
    ].filter(Boolean);

    return list.flatMap((field) => {
      if (typeof field === 'string') return [field];
      if (field && typeof field === 'object') {
        return [field._id, field.id, field.slug, field.name, field.title, field.value, field.key].filter(Boolean);
      }
      return [];
    }).map((value) => String(value).toLowerCase().trim());
  };

  const matchesSelectedCategory = (product: any, categoryValue: string) => {
    const normalized = categoryValue.toLowerCase().trim();
    const candidates = getCategoryCandidates(product);
    return candidates.some((value) => value === normalized || value.includes(normalized));
  };

  const displayedProducts = useMemo(() => {
    const now = Date.now();
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return products
      .filter((product) => {
        const categoryMatches = selectedCategories.length === 0 || selectedCategories.some((categoryValue) => matchesSelectedCategory(product, categoryValue));
        if (!categoryMatches) return false;

        if (!normalizedSearch) return true;
        const categoryName = getDisplayCategoryLabel(product.category) || '';
        const searchableText = [
          product.name,
          product.sku,
          product.description,
          product.packaging,
          categoryName,
          ...(Array.isArray(product.tags) ? product.tags : []),
          ...(Array.isArray(product.seoKeywords) ? product.seoKeywords : []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
      .map((product) => {
        const onSale = !!product.onSale;
        const saleStart = product.saleStart ? new Date(product.saleStart).getTime() : null;
        const saleEnd = product.saleEnd ? new Date(product.saleEnd).getTime() : null;
        const saleActive = onSale && (!saleStart || saleStart <= now) && (!saleEnd || saleEnd >= now) && product.discountPrice;
        const computedPrice = Number(saleActive ? product.discountPrice : product.price || 0);
        return { ...product, computedPrice, saleActive };
      });
  }, [products, searchQuery, selectedCategories]);

  const resultCount = displayedProducts.length;

  const getProductImage = (product: any) => product.thumbnail || product.images?.[0]?.url || '/placeholder.jpg';

  const handleAddToCart = (product: any) => {
    if (product.quantity === 0) {
      toast.error('This product is currently out of stock.');
      return;
    }

    addItem({
      productId: product._id,
      name: product.name,
      price: product.computedPrice,
      quantity: 1,
      image: getProductImage(product),
      description: product.description,
      category: typeof product.category === 'string' ? product.category : product.category?.name || 'Uncategorized',
      sku: product.sku,
      weight: product.weight,
      stock: product.quantity,
      thumbnail: getProductImage(product),
      images: (product.images || []).map((img: any) => img?.url || img?.secure_url || img?.path).filter(Boolean),
      discountPrice: product.discountPrice,
      compareAtPrice: product.price,
      onSale: product.onSale,
      rating: product.rating,
      reviewCount: product.reviewCount,
      packaging: product.packaging,
      origin: product.origin,
    });
    toast.success('Added to cart!');
  };

  const handleAddToWishlist = async (product: any) => {
    if (!isAuthenticated) {
      addGuestWishlistItem(product);
      toast.success('Added to your wishlist');
      return;
    }

    try {
      await wishlistAPI.addToWishlist(product._id || product.id);
      toast.success('Added to wishlist');
    } catch (error) {
      console.error('Failed to add product to wishlist:', error);
      toast.error('Unable to add to wishlist right now');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Navigation />

      <main className="flex-grow py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-secondary">Shop the range</p>
              <h1 className="mt-3 text-4xl font-bold text-primary">Browse Our Products</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:border-secondary hover:text-secondary transition lg:hidden"
              >
                <Search className="w-4 h-4" />
                Filters
              </button>
              <div className="flex flex-wrap items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <label htmlFor="sort" className="text-sm font-medium text-slate-500">
                  Sort by
                </label>
                <select
                  id="sort"
                  value={sortOption}
                  onChange={(event) => setSortOption(event.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-full p-2 transition ${viewMode === 'grid' ? 'bg-secondary text-secondary-foreground' : 'text-slate-500 hover:bg-slate-100'}`}
                  aria-label="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`rounded-full p-2 transition ${viewMode === 'list' ? 'bg-secondary text-secondary-foreground' : 'text-slate-500 hover:bg-slate-100'}`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-950 mb-4">Filter by Price</h2>
                  <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Min price</label>
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(event) => setMinPrice(event.target.value)}
                        placeholder="Min"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Max price</label>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(event) => setMaxPrice(event.target.value)}
                        placeholder="Max"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyPriceFilter}
                      className="w-full rounded-full bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-950 mb-4">Categories</h2>
                  <div className="mb-4">
                    <input
                      type="search"
                      value={categorySearch}
                      onChange={(event) => setCategorySearch(event.target.value)}
                      placeholder="Search categories..."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                    {filteredCategories.map((category: any) => {
                      const categoryId = category?._id || category?.id || category?.slug || category?.name || '';
                      return (
                        <label key={categoryId} className="flex items-center gap-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={isCategorySelected(category)}
                            onChange={() => handleCategoryToggle(category)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-secondary"
                          />
                          <span>{category?.name || category?.slug || categoryId}</span>
                        </label>
                      );
                    })}
                    {filteredCategories.length === 0 && (
                      <p className="text-sm text-muted-foreground">No categories found.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-950 mb-4">Advanced Filters</h2>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={showDiscounted}
                        onChange={(event) => setShowDiscounted(event.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-secondary"
                      />
                      <span>Only discounted</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={showFeatured}
                        onChange={(event) => setShowFeatured(event.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-secondary"
                      />
                      <span>Featured products</span>
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Minimum rating</label>
                      <select
                        value={ratingFilter}
                        onChange={(event) => setRatingFilter(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Any rating</option>
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating} stars & up
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                      <input
                        type="text"
                        value={selectedTags}
                        onChange={(event) => setSelectedTags(event.target.value)}
                        placeholder="organic, spicy"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Packaging</label>
                      <input
                        type="text"
                        value={packagingFilter}
                        onChange={(event) => setPackagingFilter(event.target.value)}
                        placeholder="pouch, box"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Origin</label>
                      <input
                        type="text"
                        value={originFilter}
                        onChange={(event) => setOriginFilter(event.target.value)}
                        placeholder="Nepal"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <section>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{resultCount} result{resultCount === 1 ? '' : 's'} found</p>
                  {hasActiveFilters && (
                    <button type="button" onClick={clearFilters} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-secondary">
                      Clear all filters
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
                    {activeCategoryLabel}
                  </span>
                  {priceFilter.min !== null && <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">Min Rs {priceFilter.min}</span>}
                  {priceFilter.max !== null && <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">Max Rs {priceFilter.max}</span>}
                </div>
              </div>
              {isFilterOpen && (
                <div
                  className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-6 lg:hidden"
                  onClick={() => setIsFilterOpen(false)}
                >
                  <div
                    className="mx-auto max-w-md rounded-[1.75rem] bg-white p-6 shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-secondary">Filters</p>
                        <h2 className="text-lg font-semibold text-primary">Refine products</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="rounded-full border border-slate-200 bg-slate-100 p-2 text-slate-900 hover:bg-slate-200"
                        aria-label="Close filters"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-3">Price Range</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <input
                            type="number"
                            value={minPrice}
                            onChange={(event) => setMinPrice(event.target.value)}
                            placeholder="Min"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="number"
                            value={maxPrice}
                            onChange={(event) => setMaxPrice(event.target.value)}
                            placeholder="Max"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={applyPriceFilter}
                          className="mt-4 w-full rounded-full bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90"
                        >
                          Apply
                        </button>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-3">Categories</h3>
                        <input
                          type="search"
                          value={categorySearch}
                          onChange={(event) => setCategorySearch(event.target.value)}
                          placeholder="Search categories..."
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="mt-4 max-h-60 space-y-3 overflow-y-auto pr-2">
                          {filteredCategories.map((category: any) => {
                            const categoryId = category?._id || category?.id || category?.slug || category?.name || '';
                            return (
                              <label key={categoryId} className="flex items-center gap-3 text-sm text-foreground">
                                <input
                                  type="checkbox"
                                  checked={isCategorySelected(category)}
                                  onChange={() => handleCategoryToggle(category)}
                                  className="h-4 w-4 rounded border-border text-primary focus:ring-secondary"
                                />
                                <span>{category?.name || category?.slug || categoryId}</span>
                              </label>
                            );
                          })}
                          {filteredCategories.length === 0 && (
                            <p className="text-sm text-muted-foreground">No categories found.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin">Loading...</div>
                </div>
              ) : displayedProducts.length === 0 ? (
                <div className="rounded-[1.75rem] border border-border bg-white p-12 text-center">
                  <p className="text-lg text-muted-foreground">No products match these filters.</p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-6'}>
                  {displayedProducts.map((product) => (
                  <Link
                    key={product._id}
                    href={`/products/${product._id}`}
                    className={`group block overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                      viewMode === 'list' ? 'sm:flex sm:items-center' : ''
                    }`}
                  >
                    <div className={`relative overflow-hidden bg-muted ${viewMode === 'list' ? 'h-48 sm:h-40 sm:w-56 flex-shrink-0' : 'aspect-[4/3]'}`}>
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className={`h-full w-full object-cover transition duration-500 ${product.quantity === 0 ? 'opacity-60' : 'group-hover:scale-105'}`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/10"></div>
                      <div className="absolute inset-x-4 bottom-4 z-20 flex gap-2 sm:inset-auto sm:right-4 sm:top-4 sm:flex-col sm:gap-3 sm:opacity-100 sm:group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleAddToWishlist(product);
                          }}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-sm backdrop-blur-sm transition hover:bg-white"
                        >
                          <Heart className="h-5 w-5 text-rose-600" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={product.quantity === 0}
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-sm transition ${
                            product.quantity === 0 ? 'cursor-not-allowed opacity-60' : 'hover:bg-secondary/90'
                          }`}
                        >
                          <ShoppingCart className="h-5 w-5" />
                        </button>
                      </div>
                      {product.quantity === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-4">
                          <span className="rounded-full bg-white/95 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      {product.saleActive && product.discountPrice && product.price && Number(product.discountPrice) < Number(product.price) && (
                        <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                          {Math.round(((Number(product.price) - Number(product.discountPrice)) / Number(product.price)) * 100)}% OFF
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">★ {(product.rating || 0).toFixed(1)}</span>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">{product.reviewCount || 0} reviews</span>
                        {getDisplayCategoryLabel(product.category) && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">
                            {getDisplayCategoryLabel(product.category)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-slate-950 mb-3 line-clamp-2">{product.name}</h3>
                      {product.description && (
                        <p className="mb-4 text-sm leading-6 text-slate-600 line-clamp-3">{product.description}</p>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-lg font-bold text-secondary">Rs. {product.computedPrice}</p>
                          {product.saleActive && product.discountPrice && product.price && Number(product.discountPrice) < Number(product.price) && (
                            <p className="text-xs text-slate-500 line-through">Rs. {product.price}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa] px-4 py-20 text-center text-sm font-semibold text-slate-700">Loading products...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
