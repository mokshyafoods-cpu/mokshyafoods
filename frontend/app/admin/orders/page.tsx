'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { orderAPI, paymentLedgerAPI } from '@/services/api';
import { Download, Search, RefreshCcw, BookOpenCheck, Pencil, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { downloadExcel } from '@/lib/excel';

const statusOptions = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const soldByOptions = ['all', 'Bishal', 'Krishna', 'Ukesh'];
const transactionTypeOptions = ['all', 'customer_sale', 'partner_product_taken', 'partner_sale'];

const paymentMethodOptions = [
  { value: 'cash4', label: 'Cash' },
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'fonepay', label: 'FonePay' },
  { value: 'esewa', label: 'eSewa' },
];

const formatPaymentMethod = (method: string) => {
  const normalized = String(method || '').trim().toLowerCase();
  const option = paymentMethodOptions.find((item) => item.value === normalized);
  if (normalized === 'cash') return 'Cash';
  return option?.label || method || 'N/A';
};

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('all');
  const [soldBy, setSoldBy] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'customer' | 'pos'>('customer');
  const [page, setPage] = useState(1);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerForm, setLedgerForm] = useState<any>({});
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<Record<string, any>>({});
  const [ledgerOrderIds, setLedgerOrderIds] = useState<Record<string, boolean>>({});
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [orderEditForm, setOrderEditForm] = useState<any>({ status: 'pending', soldBy: '', paymentMethod: 'cash4', notes: '' });
  const [showPOSReceipt, setShowPOSReceipt] = useState(false);
  const [posReceiptOrder, setPOSReceiptOrder] = useState<any>(null);
  const PAGE_SIZE = 8;

  const queryParams = useMemo(() => ({
    status: status === 'all' ? undefined : status,
    soldBy: soldBy === 'all' ? undefined : soldBy,
    transactionType: transactionType === 'all' ? undefined : transactionType,
    search: search.trim() || undefined,
    limit: 200,
  }), [status, soldBy, transactionType, search]);

  const { data, error, isLoading, mutate } = useSWR(
    ['admin-orders', queryParams],
    () => orderAPI.getAll(queryParams).then((response) => response.data)
  );

  const orders = Array.isArray(data?.data) ? data.data : [];
  const totalOrders = Number(data?.pagination?.total ?? orders.length ?? 0);
  const filteredOrders = useMemo(() => {
    const normalized = (search || '').trim().toLowerCase();
    const source = orders.filter((order: any) => {
      const orderStatus = (order.orderStatus || order.status || 'pending').toString().toLowerCase();
      const matchesStatus = status === 'all' || orderStatus === status;
      const matchesSoldBy = soldBy === 'all' || (order.soldBy || 'Not Recorded') === soldBy;

      const searchable = [
        order.orderNumber || '',
        order._id || '',
        order.user?.name || '',
        order.user?.email || '',
        order.user?.phone || '',
        order.shippingAddress?.name || '',
        order.shippingAddress?.phone || '',
        order.shippingAddress?.city || '',
        order.soldBy || '',
        order.paymentMethod || '',
        order.transactionType || '',
        order.customerName || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !normalized || searchable.includes(normalized);
      return matchesStatus && matchesSoldBy && matchesSearch;
    });
    return source.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [orders, search, status, soldBy, page]);

  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE));

  const errorInfo = (() => {
    const status = error?.response?.status;

    if (status === 401) {
      return {
        title: 'Please sign in again',
        description: 'Your session may have expired. Sign in again to view orders.',
      };
    }

    if (status === 403) {
      return {
        title: 'Admin access required',
        description: 'Only administrators can view the full order list.',
      };
    }

    if (error?.message) {
      return {
        title: 'Unable to load orders',
        description: error.message,
      };
    }

    return {
      title: 'Unable to load orders',
      description: 'Please try again in a moment.',
    };
  })();

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await orderAPI.update(orderId, { orderStatus: newStatus });
    await mutate();
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Delete this order? This action cannot be undone.')) return;
    try {
      await orderAPI.delete(orderId);
      toast.success('Order deleted');
      await mutate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete order');
    }
  };

  const syncLedgerStatusMap = async () => {
    try {
      const response = await paymentLedgerAPI.getAll({ page: 1, limit: 1000 });
      const ledgerRows = Array.isArray(response?.data?.data) ? response.data.data : [];
      const nextStatusMap: Record<string, boolean> = {};
      ledgerRows.forEach((entry: any) => {
        const rawOrderId = entry?.orderId || entry?.order?._id || entry?.orderIdString || '';
        if (rawOrderId) nextStatusMap[String(rawOrderId)] = true;
      });
      setLedgerOrderIds(nextStatusMap);
    } catch (error) {
      setLedgerOrderIds({});
    }
  };

  const openLedger = async (order: any) => {
    const orderId = order?._id;
    if (!orderId) return;
    const existing = ledgerEntries[orderId] || (ledgerOrderIds[orderId] ? { _id: orderId } : null);
    const initialForm = {
      orderId,
      orderNumber: order.orderNumber || order._id,
      customerName: order.user?.name || order.shippingAddress?.name || 'Guest',
      customerContact: order.shippingAddress?.phone || order.user?.phone || '',
      address: order.shippingAddress ? `${order.shippingAddress.street || ''} ${order.shippingAddress.city || ''} ${order.shippingAddress.state || ''}`.trim() : '',
      products: (order.items || []).map((item: any) => `${item.name || item.productData?.name || 'Product'} x${item.quantity || 1}`).join(', '),
      items: Array.isArray(order.items) ? order.items : [],
      amount: order.total || 0,
      paymentMethod: order.paymentMethod || 'cash4',
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: '',
      _id: existing?._id || '',
    };
    setLedgerForm(initialForm);
    setLedgerOpen(true);
    if (!existing) {
      try {
        setLedgerLoading(true);
        const response = await paymentLedgerAPI.getByOrderId(orderId);
        const entry = response?.data?.data;
        if (entry) {
          setLedgerEntries((prev) => ({ ...prev, [orderId]: entry }));
          setLedgerForm({ ...initialForm, ...entry, _id: entry._id || '' });
        }
      } catch (error) {
        // Ignore lookup errors and allow create mode.
      } finally {
        setLedgerLoading(false);
      }
    }
  };

  const openEditOrder = (order: any) => {
    setEditingOrder(order);
    setOrderEditForm({
      status: order.orderStatus || order.status || 'pending',
      soldBy: order.soldBy || '',
      paymentMethod: order.paymentMethod || 'cash4',
      notes: order.notes || '',
    });
  };

  const handlePrintPOSInvoice = (order: any) => {
    if (!order) {
      toast.error('Order not found');
      return;
    }
    setPOSReceiptOrder(order);
    setShowPOSReceipt(true);
  };

  const saveEditedOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingOrder?._id) return;
    try {
      await orderAPI.update(editingOrder._id, {
        orderStatus: orderEditForm.status,
        soldBy: orderEditForm.soldBy,
        paymentMethod: orderEditForm.paymentMethod,
        notes: orderEditForm.notes,
      });
      toast.success('Order updated');
      setEditingOrder(null);
      await mutate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update order');
    }
  };

  const exportOrdersExcel = async () => {
    if (!orders.length) return;
    await downloadExcel('orders.xlsx', [
      {
        name: 'Orders',
        data: [
          ['Order #', 'Customer', 'Sold By', 'Status', 'Payment Method', 'Total', 'Date'],
          ...orders.map((order: any) => [
            order.orderNumber || order._id || 'N/A',
            order.user?.name || order.shippingAddress?.name || 'Guest',
            order.soldBy || 'N/A',
            order.orderStatus || order.status || 'N/A',
            formatPaymentMethod(order.paymentMethod || 'cash4'),
            Number(order.total || 0),
            order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
          ]),
        ],
      },
    ]);
  };

  const saveLedger = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        ...ledgerForm,
        amount: Number(ledgerForm.amount || 0),
        items: Array.isArray(ledgerForm.items) ? ledgerForm.items : [],
        products: ledgerForm.products || (Array.isArray(ledgerForm.items) ? ledgerForm.items.map((item: any) => `${item.name || item.productData?.name || 'Product'} x${item.quantity || 1}`).join(', ') : ''),
      };
      const response = await paymentLedgerAPI.createOrUpdate(payload);
      const savedEntry = response?.data?.data;
      if (savedEntry) {
        setLedgerEntries((prev) => ({ ...prev, [savedEntry.orderId]: savedEntry }));
        setLedgerOrderIds((prev) => ({ ...prev, [savedEntry.orderId]: true }));
      }
      toast.success('Payment ledger saved');
      setLedgerOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save payment ledger');
    }
  };

  useEffect(() => {
    setPage(1);
  }, [status, search, viewMode]);

  useEffect(() => {
    void syncLedgerStatusMap();
  }, [orders]);

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Orders</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Order Management</h1>
            <p className="mt-2 text-sm text-slate-500">Review, search, and manage all orders with payment and fulfillment status.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 border border-sky-200">{totalOrders} total orders</span>
            <button type="button" onClick={exportOrdersExcel} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl">
        <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,180px)_minmax(0,180px)_minmax(0,180px)_1fr] lg:grid-cols-[minmax(0,140px)_minmax(0,140px)_minmax(0,140px)_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Filter status</label>
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>{option === 'all' ? 'All statuses' : option}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Filter sold by</label>
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary"
              value={soldBy}
              onChange={(e) => setSoldBy(e.target.value)}
            >
              {soldByOptions.map((option) => (
                <option key={option} value={option}>{option === 'all' ? 'All partners' : option}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Filter type</label>
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
            >
              {transactionTypeOptions.map((option) => (
                <option key={option} value={option}>{option === 'all' ? 'All types' : option.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Search orders</label>
            <div className="mt-2 flex items-center gap-2 rounded-2xl bg-white px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                placeholder="Order #, name, phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('customer')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${viewMode === 'customer' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Customer Orders
          </button>
          <button
            type="button"
            onClick={() => setViewMode('pos')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${viewMode === 'pos' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            POS Orders
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        {viewMode === 'pos' ? (
          <div className="p-6">
            {isLoading ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                Loading POS orders...
              </div>
            ) : error ? (
              <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700">
                <p className="font-semibold">{errorInfo.title}</p>
                <p className="mt-2">{errorInfo.description}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                No POS orders available yet.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredOrders.map((order: any) => (
                  <div key={order._id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{order.orderNumber || order._id}</p>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">POS</span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>Customer: {order.user?.name || order.shippingAddress?.name || 'Guest'}</p>
                      <p>Type: {order.transactionType === 'partner_product_taken' ? 'Partner Product Taken' : order.transactionType === 'partner_sale' ? 'Partner Sale' : 'Customer Sale'}</p>
                      <p>Sold By: {order.soldBy || 'Not Recorded'}</p>
                      <p>Status: {order.orderStatus || order.status}</p>
                      <p>Payment: {formatPaymentMethod(order.paymentMethod || 'cash4')}</p>
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-900">RS {order.total?.toFixed?.(0) ?? order.total ?? 0}</p>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrintPOSInvoice(order)}
                        className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Print Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="min-w-[840px]">
            <div className="grid gap-0 border-b border-slate-200 bg-slate-100 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 sm:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr]">
              <span>Order</span>
              <span>Customer</span>
              <span>Sold By</span>
              <span>Status</span>
              <span>Payment</span>
              <span>Ledger</span>
              <span className="text-right">Total</span>
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-slate-500">Loading orders...</div>
            ) : error ? (
              <div className="p-10 text-center text-red-700">
                <p className="font-semibold">{errorInfo.title}</p>
                <p className="mt-2 text-sm">{errorInfo.description}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No orders match your filters.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredOrders.map((order: any) => (
                  <div key={order._id} className="grid items-center gap-4 px-6 py-5 sm:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr]">
                    <div>
                      <p className="font-semibold text-slate-900">{order.orderNumber || order._id}</p>
                      <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-slate-900">
                      {order.user?.name || order.shippingAddress?.name || 'Guest'}
                    </div>
                    <div className="text-slate-900">
                      {order.soldBy || 'Not Recorded'}
                    </div>
                    <div>
                      <select
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary"
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      >
                        {statusOptions.filter((option) => option !== 'all').map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-slate-900">
                      <div>{formatPaymentMethod(order.paymentMethod || 'cash4')}</div>
                      <div className="mt-1 text-xs text-slate-500">{order.paymentStatus || 'Pending'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openLedger(order)}
                        disabled={Boolean(ledgerEntries[order._id]?._id || ledgerOrderIds[order._id])}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${ledgerEntries[order._id]?._id || ledgerOrderIds[order._id] ? 'cursor-not-allowed border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                        title={ledgerEntries[order._id]?._id || ledgerOrderIds[order._id] ? 'Ledger already created for this order' : 'Create payment ledger entry'}
                      >
                        {ledgerEntries[order._id]?._id || ledgerOrderIds[order._id] ? <BookOpenCheck className="h-4 w-4 text-emerald-600" /> : <BookOpenCheck className="h-4 w-4 text-slate-700" />}
                        <span>{ledgerEntries[order._id]?._id || ledgerOrderIds[order._id] ? 'Done' : 'Ledger'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditOrder(order)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(order._id)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="text-right font-semibold text-slate-900">RS {order.total?.toFixed?.(0) ?? order.total ?? 0}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {ledgerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 py-6">
          <div className="w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Payment ledger</p>
                <h2 className="text-xl font-semibold text-slate-900">{ledgerForm._id ? 'Edit payment ledger entry' : 'Create payment ledger entry'}</h2>
              </div>
              <button type="button" onClick={() => setLedgerOpen(false)} className="rounded-full border border-slate-200 p-2 text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={saveLedger} className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Order #</label>
                  <input value={ledgerForm.orderNumber || ''} onChange={(e) => setLedgerForm({ ...ledgerForm, orderNumber: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Customer</label>
                  <input value={ledgerForm.customerName || ''} onChange={(e) => setLedgerForm({ ...ledgerForm, customerName: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Contact</label>
                  <input value={ledgerForm.customerContact || ''} onChange={(e) => setLedgerForm({ ...ledgerForm, customerContact: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Amount</label>
                  <input type="number" min="0" value={ledgerForm.amount || 0} onChange={(e) => setLedgerForm({ ...ledgerForm, amount: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Payment method</label>
                  <select value={ledgerForm.paymentMethod || 'cash4'} onChange={(e) => setLedgerForm({ ...ledgerForm, paymentMethod: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                    {paymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Date</label>
                  <input type="date" value={ledgerForm.paymentDate || ''} onChange={(e) => setLedgerForm({ ...ledgerForm, paymentDate: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Products</label>
                <textarea value={ledgerForm.products || ''} onChange={(e) => setLedgerForm({ ...ledgerForm, products: e.target.value })} className="min-h-[100px] w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Notes</label>
                <textarea value={ledgerForm.notes || ''} onChange={(e) => setLedgerForm({ ...ledgerForm, notes: e.target.value })} className="min-h-[100px] w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" onClick={() => setLedgerOpen(false)} className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">Cancel</button>
                <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">
                  <Save className="h-4 w-4" /> Save ledger entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-6">
          <div className="w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Edit order</p>
                <h2 className="text-xl font-semibold text-slate-900">Update order details</h2>
              </div>
              <button type="button" onClick={() => setEditingOrder(null)} className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={saveEditedOrder} className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Order status</span>
                  <select value={orderEditForm.status} onChange={(e) => setOrderEditForm({ ...orderEditForm, status: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                    {statusOptions.filter((option) => option !== 'all').map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Sold by</span>
                  <input value={orderEditForm.soldBy} onChange={(e) => setOrderEditForm({ ...orderEditForm, soldBy: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Payment method</span>
                  <select value={orderEditForm.paymentMethod} onChange={(e) => setOrderEditForm({ ...orderEditForm, paymentMethod: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                    {paymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Notes</span>
                  <textarea value={orderEditForm.notes} onChange={(e) => setOrderEditForm({ ...orderEditForm, notes: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 min-h-[120px]" />
                </label>
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" onClick={() => setEditingOrder(null)} className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">Cancel</button>
                <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"><Save className="h-4 w-4" /> Save changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-500">
        <div>{totalOrders} orders displayed.</div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 disabled:opacity-50">Previous</button>
          <span className="text-sm font-semibold text-slate-700">Page {page} / {totalPages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 disabled:opacity-50">Next</button>
          <button
            type="button"
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh list
          </button>
        </div>
      </div>

      {showPOSReceipt && posReceiptOrder && (
        <div className="receipt-print">
          <div className="receipt-content">
            <div className="receipt-header">
              <p className="brand-name">Mokshya Foods</p>
              <p className="business-details">Tilottama-01, Banbitika, Rupandehi • Lumbini Zone</p>
              <p className="business-details">PAN: 624385631</p>
            </div>

            <div className="receipt-section">
              <div className="receipt-row">
                <span className="receipt-key">Bill No.</span>
                <span className="receipt-value">{posReceiptOrder.invoiceNumber || posReceiptOrder.orderNumber}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-key">Date</span>
                <span className="receipt-value">{new Date(posReceiptOrder.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-key">Customer</span>
                <span className="receipt-value">{posReceiptOrder.user?.name || posReceiptOrder.shippingAddress?.name || 'Walk-in Customer'}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-key">Contact</span>
                <span className="receipt-value">{posReceiptOrder.user?.phone || posReceiptOrder.shippingAddress?.phone || '—'}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-key">Transaction Type</span>
                <span className="receipt-value">{posReceiptOrder.transactionType === 'partner_product_taken' ? 'Partner Product Taken' : posReceiptOrder.transactionType === 'partner_sale' ? 'Partner Sale' : 'Customer Sale'}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-key">Sold By</span>
                <span className="receipt-value">{posReceiptOrder.soldBy || 'Not Recorded'}</span>
              </div>
            </div>

            <div className="receipt-section receipt-items">
              {Array.isArray(posReceiptOrder.items) && posReceiptOrder.items.map((item: any, index: number) => (
                <div key={index} className="item">
                  <div>
                    <p className="item-name">{item.name || 'Product'}</p>
                    <p className="item-meta">{item.quantity} × Rs {Number(item.price).toLocaleString('en-IN')}</p>
                  </div>
                  <p className="item-total">Rs {Number(item.subtotal).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>

            <div className="receipt-section totals">
              <div className="total-row">
                <span className="total-label">Subtotal</span>
                <span className="total-value">Rs {Number(posReceiptOrder.subtotal).toLocaleString('en-IN')}</span>
              </div>
              {Number(posReceiptOrder.discountAmount || 0) > 0 && (
                <>
                  <div className="total-row discount-row">
                    <span className="total-label">Discount</span>
                    <span className="total-value discount-value">- Rs {Number(posReceiptOrder.discountAmount).toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
              <div className="total-row grand-total">
                <span className="total-label">TOTAL</span>
                <span className="total-value">Rs {Number(posReceiptOrder.total).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="receipt-section receipt-payment">
              <div className="receipt-row">
                <span className="receipt-key">Payment Method</span>
                <span className="receipt-value">{formatPaymentMethod(posReceiptOrder.paymentMethod || 'cash')}</span>
              </div>
              {posReceiptOrder.paymentMethod === 'cash' && (
                <>
                  <div className="receipt-row">
                    <span className="receipt-key">Tendered</span>
                    <span className="receipt-value">Rs {Number(posReceiptOrder.tenderedAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-key">Change</span>
                    <span className="receipt-value">Rs {Number(posReceiptOrder.changeDue).toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
            </div>

            <p className="footer">Thank you for shopping with Mokshya Foods!</p>
          </div>

          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 print:hidden">
            <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-900">Invoice #{posReceiptOrder.invoiceNumber || posReceiptOrder.orderNumber}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowPOSReceipt(false);
                    setPOSReceiptOrder(null);
                  }}
                  className="rounded-full border border-slate-200 p-3 text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPOSReceipt(false);
                    setPOSReceiptOrder(null);
                  }}
                  className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

