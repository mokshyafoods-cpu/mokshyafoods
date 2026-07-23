'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { categoryAPI, posAPI, productAPI, userAPI } from '@/services/api';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ImageIcon,
  Mail,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingBag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductItem {
  _id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  images?: Array<{ url: string }>;
  category?: { _id: string; name: string };
}

interface CategoryItem {
  _id: string;
  name: string;
}

interface CartItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  subtotal: number;
}

const LOW_STOCK_THRESHOLD = 10;

const unwrapResponseData = (response: any, fallback: any = null) => {
  if (!response) return fallback;
  if (response?.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data ?? fallback;
  }
  return response?.data ?? response ?? fallback;
};

export default function POSPage() {
  const { user } = useAuth();
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement | null>(null);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [scanInput, setScanInput] = useState('');
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [attachedCustomer, setAttachedCustomer] = useState<{ _id: string; name: string; phone: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cod'>('cash');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountMode, setDiscountMode] = useState<'flat' | 'percent'>('flat');
  const [discountReason, setDiscountReason] = useState('');
  const [tenderedAmount, setTenderedAmount] = useState(0);
  const [tillHistory, setTillHistory] = useState<any[]>([]);
  const [openTill, setOpenTill] = useState<any>(null);
  const [startingCash, setStartingCash] = useState('');
  const [countedCash, setCountedCash] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [saleNumber] = useState(() => `INV-${Date.now()}`);
  const [invoiceNumber, setInvoiceNumber] = useState('BILL-TBD');

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    loadProducts();
    loadCategories();
    loadTillHistory();
  }, [user, activeCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scanInput.trim().length > 1) {
        searchProducts(scanInput.trim());
      } else {
        setSearchResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [scanInput]);

  useEffect(() => {
    const openSession = tillHistory.find((session) => session.status === 'open');
    setOpenTill(openSession || null);
  }, [tillHistory]);

  useEffect(() => {
    if (showReceipt && receiptOrder) {
      const printTimer = window.setTimeout(() => {
        window.print();
      }, 250);
      return () => window.clearTimeout(printTimer);
    }
    return undefined;
  }, [showReceipt, receiptOrder]);

  const visibleProducts = useMemo(() => {
    return activeCategory === 'all'
      ? products
      : products.filter((product) => product.category?._id === activeCategory);
  }, [products, activeCategory]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    const safeValue = Math.max(0, discountValue || 0);
    return discountMode === 'percent' ? Math.round((subtotal * safeValue) / 100) : safeValue;
  }, [discountMode, discountValue, subtotal]);

  const taxAmount = useMemo(() => 0, []);

  const total = useMemo(() => Math.max(0, subtotal - discountAmount + taxAmount), [subtotal, discountAmount, taxAmount]);

  const lowStockItems = cart.filter((item) => {
    const remainingStock = item.stock - item.quantity;
    return remainingStock >= 0 && remainingStock <= LOW_STOCK_THRESHOLD;
  });

  const loadProducts = async () => {
    try {
      const response = await productAPI.getAll({ limit: 40, category: activeCategory !== 'all' ? activeCategory : undefined });
      const payload = unwrapResponseData(response, []);
      setProducts(Array.isArray(payload) ? payload : []);
    } catch (error) {
      toast.error('Unable to load products');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      const payload = unwrapResponseData(response, []);
      setCategories(Array.isArray(payload) ? payload : []);
    } catch (error) {
      toast.error('Unable to load categories');
    }
  };

  const loadTillHistory = async () => {
    try {
      const response = await posAPI.getTillHistory();
      const payload = unwrapResponseData(response, []);
      setTillHistory(Array.isArray(payload) ? payload : []);
    } catch (error) {
      toast.error('Unable to load till history');
    }
  };

  const searchProducts = async (query: string) => {
    setIsSearchLoading(true);
    try {
      const result = await productAPI.getAll({ search: query, limit: 8, category: activeCategory !== 'all' ? activeCategory : undefined });
      const payload = unwrapResponseData(result, []);
      setSearchResults(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const findProductByCode = (code: string) => {
    const normalized = code.trim().toLowerCase();
    const match = products.find((product) => product.sku?.toLowerCase() === normalized);
    if (match) return match;
    return products.find((product) => product.name.toLowerCase() === normalized || product.name.toLowerCase().includes(normalized));
  };

  const addProductToCart = (product: ProductItem, quantity = 1) => {
    if (product.quantity === 0) {
      toast.error('Product is sold out');
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.productId === product._id);
      if (existing) {
        const nextQuantity = Math.min(existing.quantity + quantity, product.quantity);
        if (nextQuantity === existing.quantity) {
          toast.error(`Only ${product.quantity} item${product.quantity === 1 ? '' : 's'} available`);
          return current;
        }
        if (nextQuantity < existing.quantity + quantity) {
          toast.error(`Limited to ${product.quantity} item${product.quantity === 1 ? '' : 's'} due to stock`);
        }
        return current.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: nextQuantity, subtotal: nextQuantity * item.price }
            : item
        );
      }

      if (quantity > product.quantity) {
        toast.error(`Only ${product.quantity} item${product.quantity === 1 ? '' : 's'} available`);
        quantity = product.quantity;
      }

      return [
        ...current,
        {
          productId: product._id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          quantity,
          stock: product.quantity,
          subtotal: product.price * quantity,
        },
      ];
    });
  };

  const handleScanSubmit = async () => {
    const code = scanInput.trim();
    if (!code) return;

    const productMatch = findProductByCode(code);
    if (productMatch) {
      addProductToCart(productMatch);
      setScanInput('');
      return;
    }

    try {
      const result = await productAPI.getAll({ search: code, limit: 1 });
      const remoteProduct = result.data?.[0];
      if (!remoteProduct) {
        toast.error('Product not found');
        return;
      }
      addProductToCart(remoteProduct);
      setScanInput('');
    } catch (error) {
      toast.error('Product not found');
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setCart((current) =>
      current.map((item) => {
        if (item.productId !== productId) return item;
        const nextQuantity = Math.min(Math.max(1, quantity), item.stock);
        return { ...item, quantity: nextQuantity, subtotal: nextQuantity * item.price };
      })
    );
  };

  const removeCartItem = (productId: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
  };

  const clearSale = () => {
    setCart([]);
    setAttachedCustomer(null);
    setCustomerPhone('');
    setCustomerName('');
    setDiscountValue(0);
    setDiscountMode('flat');
    setDiscountReason('');
    setTenderedAmount(0);
  };

  const attachCustomer = async () => {
    if (!customerPhone.trim()) {
      toast.error('Enter a phone number');
      return;
    }

    try {
      const response = await userAPI.searchByPhone(customerPhone.trim());
      const payload = unwrapResponseData(response, null);
      const nextCustomer = payload && typeof payload === 'object' ? payload : null;
      setAttachedCustomer(nextCustomer);
      if (nextCustomer && typeof nextCustomer === 'object' && 'name' in nextCustomer) {
        setCustomerName(String(nextCustomer.name || ''));
        toast.success(`${nextCustomer.name} attached`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Customer not found');
      setAttachedCustomer(null);
    }
  };

  const startShift = async () => {
    if (!startingCash.trim()) {
      toast.error('Enter starting cash');
      return;
    }

    try {
      await posAPI.startShift({ startingCash: Number(startingCash) });
      toast.success('Shift started');
      loadTillHistory();
      setStartingCash('');
    } catch (error) {
      toast.error('Unable to start shift');
    }
  };

  const closeShift = async () => {
    if (!openTill) {
      toast.error('No open till found');
      return;
    }
    if (!countedCash.trim()) {
      toast.error('Enter counted cash');
      return;
    }

    try {
      await posAPI.closeShift(openTill._id, { countedCash: Number(countedCash) });
      toast.success('Shift closed');
      loadTillHistory();
      setCountedCash('');
    } catch (error) {
      toast.error('Unable to close shift');
    }
  };

  const confirmPayment = async () => {
    if (cart.length === 0) {
      toast.error('Add items before charging');
      return;
    }

    if (paymentMethod === 'cash' && tenderedAmount < total) {
      toast.error('Amount tendered must cover total');
      return;
    }

    setIsLoading(true);
    try {
      const response = await posAPI.createOrder({
        items: cart.map((item) => ({ product: item.productId, quantity: item.quantity, price: item.price })),
        customerName: customerName.trim() || attachedCustomer?.name || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || attachedCustomer?.phone || '',
        customerEmail: '',
        paymentMethod,
        discountAmount,
        customerId: attachedCustomer?._id,
        tenderedAmount: paymentMethod === 'cash' ? tenderedAmount : 0,
        notes: discountReason,
      });

      const payload = unwrapResponseData(response, null);
      const nextReceiptOrder = payload && typeof payload === 'object' ? payload : null;
      setReceiptOrder(nextReceiptOrder);
      setInvoiceNumber(nextReceiptOrder?.invoiceNumber || 'BILL-TBD');
      setShowReceipt(true);
      setCart([]);
      setAttachedCustomer(null);
      setCustomerPhone('');
      setCustomerName('');
      setDiscountValue(0);
      setDiscountMode('flat');
      setDiscountReason('');
      setTenderedAmount(0);
      setPaymentOpen(false);
      loadTillHistory();
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !['admin', 'cashier'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="max-w-xl rounded-[2rem] border border-border bg-white p-10 text-center shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Access Denied</p>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">POS access required</h1>
          <p className="mt-3 text-sm text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-slate-50 p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl screen-only print:hidden">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="inline-flex items-center gap-3 rounded-full bg-slate-100 px-4 py-3 text-sm text-slate-700">
                <span>{cart.length} items</span>
                <span className="font-semibold">Rs. {total}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1.5fr_auto]">
              <div className="relative">
                <label className="sr-only" htmlFor="pos-search">Scan or search product</label>
                <input
                  id="pos-search"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleScanSubmit();
                    }
                    if (e.key === 'Escape') {
                      setScanInput('');
                    }
                  }}
                  autoFocus
                  placeholder="Search product or scan barcode… (Enter to add)"
                  className="w-full rounded-[1.75rem] border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={handleScanSubmit}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-blue-600 px-4 py-3 text-white shadow hover:bg-blue-700"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={clearSale}
                  className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                >
                  Clear Sale
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Search results</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {searchResults.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => addProductToCart(product)}
                      className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 text-left text-slate-900 transition hover:border-primary"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500">Rs. {product.price} • {product.quantity} in stock</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Add</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${activeCategory === 'all' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-600'}`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => setActiveCategory(category._id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${activeCategory === category._id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-600'}`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.slice(0, 18).map((product) => {
                const isSoldOut = product.quantity === 0;
                return (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() => addProductToCart(product)}
                    disabled={isSoldOut}
                    className={`group relative overflow-hidden rounded-[2rem] border p-4 text-left text-slate-900 transition ${isSoldOut ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 bg-white hover:border-primary hover:shadow-lg'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-slate-100">
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url} alt={product.name} className="h-full w-full rounded-3xl object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</p>
                        <p className="mt-1 text-xs text-slate-500">Rs. {product.price} • {product.quantity} in stock</p>
                      </div>
                    </div>
                    {isSoldOut ? (
                      <span className="mt-4 inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">Sold Out</span>
                    ) : product.quantity <= 3 ? (
                      <span className="mt-4 inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Only {product.quantity} left</span>
                    ) : product.quantity <= LOW_STOCK_THRESHOLD ? (
                      <span className="mt-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Low stock — {product.quantity} left</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl lg:sticky lg:top-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Current Order</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Order summary</h2>
              </div>
              <div className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300">No Delivery</div>
            </div>

            <div className="mt-6 space-y-4">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="w-full rounded-[1.75rem] border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone"
                className="w-full rounded-[1.75rem] border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={discountMode}
                    onChange={(e) => setDiscountMode(e.target.value as 'flat' | 'percent')}
                    className="rounded-full border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="flat">Flat</option>
                    <option value="percent">Percent</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    placeholder={discountMode === 'percent' ? '% off' : 'Discount amount'}
                    className="w-full rounded-[1.75rem] border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Discount reason (optional)"
                  className="w-full rounded-[1.75rem] border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="mt-5 rounded-[1.75rem] bg-slate-900/80 p-5">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Subtotal</span>
                <span>Rs. {subtotal}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                <span>Discount</span>
                <span>- Rs. {discountAmount}</span>
              </div>
              {taxAmount > 0 && (
                <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                  <span>Tax</span>
                  <span>Rs. {taxAmount}</span>
                </div>
              )}
              <div className="mt-4 border-t border-slate-800 pt-4 text-xl font-semibold text-white">
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span>Rs. {total}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[1.75rem] bg-slate-900/80 p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Payment method</p>
                <span className="text-xs uppercase tracking-[0.35em] text-slate-400">{paymentMethod === 'cash' ? 'Cash sale' : 'Cash on delivery'}</span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`rounded-full px-4 py-3 text-sm font-semibold transition ${paymentMethod === 'cash' ? 'bg-blue-600 text-white' : 'border border-slate-800 bg-slate-900 text-slate-300'}`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`rounded-full px-4 py-3 text-sm font-semibold transition ${paymentMethod === 'cod' ? 'bg-blue-600 text-white' : 'border border-slate-800 bg-slate-900 text-slate-300'}`}
                >
                  COD
                </button>
              </div>
              {paymentMethod === 'cash' && (
                <div className="mt-4 space-y-3">
                  <input
                    type="number"
                    min={0}
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(Number(e.target.value))}
                    placeholder="Paid amount"
                    className="w-full rounded-[1.75rem] border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Change due</span>
                    <span>Rs. {Math.max(0, tenderedAmount - total)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {lowStockItems.length > 0 && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Stock Alert</p>
                  <p>{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} are low on stock. Please confirm quantities before payment.</p>
                </div>
              )}
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={confirmPayment}
                  disabled={cart.length === 0}
                  className="inline-flex w-full items-center justify-center rounded-[2rem] bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Pay Rs. {total}
                </button>
              </div>
              <label className="inline-flex items-center gap-3 rounded-[2rem] border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
                <input type="checkbox" checked readOnly className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-primary focus:ring-primary" />
                Print bill after order
              </label>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Order items</p>
            <div className="mt-5 space-y-3">
              {cart.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-slate-500">
                  <p className="text-lg font-semibold">Tap products to add</p>
                  <p className="mt-2 text-sm">or scan a barcode with the camera</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const remainingStock = item.stock - item.quantity;
                    const lowStock = remainingStock <= LOW_STOCK_THRESHOLD && remainingStock >= 0;
                    return (
                      <div key={item.productId} className="rounded-[1.75rem] border border-slate-200 p-4 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="mt-1 text-sm text-slate-500">Rs. {item.price} each</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {remainingStock < 0 ? (
                              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Overstock</span>
                            ) : lowStock ? (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Only {remainingStock} left</span>
                            ) : null}
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{remainingStock} remaining</span>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-0 sm:justify-end">
                          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                            <button type="button" onClick={() => handleQuantityChange(item.productId, item.quantity - 1)} className="text-slate-600">
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              min={1}
                              max={item.stock}
                              onChange={(e) => handleQuantityChange(item.productId, Number(e.target.value))}
                              className="w-14 border-none bg-transparent text-center text-sm text-slate-900 outline-none"
                            />
                            <button type="button" onClick={() => handleQuantityChange(item.productId, item.quantity + 1)} className="text-slate-600">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="min-w-[88px] text-right">
                            <p className="text-sm text-slate-500">Line total</p>
                            <p className="font-semibold">Rs. {item.subtotal}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.productId)}
                            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {paymentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Payment</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Cash Payment</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentOpen(false)}
                  className="rounded-full border border-slate-200 p-3 text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Subtotal</span>
                      <span>Rs. {subtotal}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                      <span>Discount</span>
                      <span>- Rs. {discountAmount}</span>
                    </div>
                    {taxAmount > 0 && (
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                        <span>Tax</span>
                        <span>Rs. {taxAmount}</span>
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-2xl font-semibold text-slate-900">
                      <span>Total</span>
                      <span>Rs. {total}</span>
                    </div>
                  </div>

                  {paymentMethod === 'cash' ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Amount tendered</p>
                      <div className="mt-3 flex gap-2">
                        <input
                          type="number"
                          min={0}
                          value={tenderedAmount}
                          onChange={(e) => setTenderedAmount(Number(e.target.value))}
                          placeholder="Enter cash received"
                          className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                        <span>Change due</span>
                        <span className="font-semibold">Rs. {Math.max(0, tenderedAmount - total)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Confirm transaction</p>
                      <p className="mt-3 text-sm text-slate-600">Verify the payment completed successfully on the external terminal or mobile app, then complete the sale.</p>
                    </div>
                  )}
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Ready to charge</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">Rs. {total}</p>
                  <button
                    type="button"
                    onClick={confirmPayment}
                    className="mt-8 w-full rounded-3xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Confirm Cash Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentOpen(false)}
                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {showReceipt && receiptOrder && (
        <div ref={receiptRef} className="receipt-print">
          <div className="mx-auto w-[320px] rounded-3xl border border-slate-200 bg-white p-6 text-slate-900">
            <div className="text-center">
              <p className="text-xl font-semibold">Mokshya Foods</p>
              <p className="mt-1 text-xs text-slate-500">Tilottama-01, Banbitika, Rupandehi • Lumbini Zone</p>
              <p className="mt-1 text-xs text-slate-500">PAN: 624385631</p>
            </div>
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Bill No.</span>
                <span>{receiptOrder.invoiceNumber || invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date</span>
                <span>{new Date(receiptOrder.createdAt).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier</span>
                <span>{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer</span>
                <span>{receiptOrder.user?.name || 'Walk-in Customer'}</span>
              </div>
              <div className="flex justify-between">
                <span>Contact</span>
                <span>{receiptOrder.user?.phone || '—'}</span>
              </div>
            </div>
            <div className="mt-6 border-t border-slate-200 pt-4 text-sm">
              {receiptOrder.items.map((item: any, index: number) => {
                const productId = item?.product?._id || item?.productId || item?.product?.id || `receipt-item-${index}`;
                const productName = item.name || item.productData?.name || item.product?.name || 'Product';
                return (
                  <div key={productId} className="mb-3 flex justify-between gap-2">
                    <div>
                      <p className="font-medium">{productName}</p>
                      <p className="text-xs text-slate-500">{item.quantity} × Rs. {item.price}</p>
                    </div>
                    <p className="font-semibold">Rs. {item.subtotal}</p>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rs. {receiptOrder.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>- Rs. {receiptOrder.discountAmount}</span>
              </div>
              {receiptOrder.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>Rs. {receiptOrder.taxAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>Rs. {receiptOrder.total}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Payment</span>
                <span>{receiptOrder.paymentMethod}</span>
              </div>
              {receiptOrder.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tendered</span>
                    <span>Rs. {receiptOrder.tenderedAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Change</span>
                    <span>Rs. {receiptOrder.changeDue}</span>
                  </div>
                </>
              )}
            </div>
            <p className="mt-6 text-center text-xs text-slate-500">Thank you for shopping at Mokshya Foods!</p>
          </div>
        </div>
      )}
    </div>
    </>
  );
}