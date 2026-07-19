'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { orderAPI } from '@/services/api';
import { Search, RefreshCcw } from 'lucide-react';

const statusOptions = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'customer' | 'pos'>('customer');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const queryParams = useMemo(() => ({
    status: status === 'all' ? undefined : status,
    search: search.trim() || undefined,
    limit: 30,
  }), [status, search]);

  const { data, error, isLoading, mutate } = useSWR(
    ['admin-orders', queryParams],
    () => orderAPI.getAll(queryParams).then((response) => response.data)
  );

  const orders = Array.isArray(data?.data) ? data.data : [];
  const filteredOrders = useMemo(() => {
    const normalized = (search || '').trim().toLowerCase();
    const source = orders.filter((order: any) => {
      const orderStatus = (order.orderStatus || order.status || 'pending').toString().toLowerCase();
      const matchesStatus = status === 'all' || orderStatus === status;
      const searchable = `${order.orderNumber || ''} ${order.user?.name || ''} ${order.shippingAddress?.name || ''} ${order.shippingAddress?.phone || ''}`.toLowerCase();
      const matchesSearch = !normalized || searchable.includes(normalized);
      return matchesStatus && matchesSearch;
    });
    return source.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [orders, search, status, page]);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));

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

  useEffect(() => {
    setPage(1);
  }, [status, search, viewMode]);

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Orders</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">Order overview</h1>
            <p className="mt-4 text-sm text-slate-500">
              Review the current order queue, update delivery status, and keep fulfillment moving smoothly.
            </p>
          </div>

          <div className="grid gap-3 w-full sm:grid-cols-[220px_auto]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
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

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
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
                      <p>Status: {order.orderStatus}</p>
                      <p>Payment: {order.paymentMethod || 'N/A'}</p>
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-900">Rs. {order.total?.toFixed?.(0) ?? order.total ?? 0}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="min-w-[840px]">
            <div className="grid gap-0 border-b border-slate-200 bg-slate-100 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
              <span>Order</span>
              <span>Customer</span>
              <span>Status</span>
              <span>Payment</span>
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
                  <div key={order._id} className="grid items-center gap-4 px-6 py-5 sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
                    <div>
                      <p className="font-semibold text-slate-900">{order.orderNumber || order._id}</p>
                      <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-slate-900">
                      {order.user?.name || order.shippingAddress?.name || 'Guest'}
                    </div>
                    <div>
                      <select
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary"
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      >
                        {statusOptions.filter((option) => option !== 'all').map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-slate-900">{order.paymentMethod || 'N/A'}</div>
                    <div className="text-right font-semibold text-slate-900">Rs. {order.total?.toFixed?.(0) ?? order.total ?? 0}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-500">
        <div>{orders.length} orders displayed.</div>
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
    </div>
  );
}
