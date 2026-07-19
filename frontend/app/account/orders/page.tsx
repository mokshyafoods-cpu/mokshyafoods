'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/services/api';
import { Search, Filter, Package } from 'lucide-react';

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-sky-100 text-sky-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const loadOrders = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await orderAPI.getAll();
        const body = response?.data ?? response;
        const payload = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
        setOrders(Array.isArray(payload) ? payload : []);
      } catch (err: any) {
        console.error('Failed to load orders:', err);
        setError('Unable to load your orders right now.');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderStatus = (order.orderStatus || order.status || 'pending').toString().toLowerCase();
      const normalizedStatus = orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1);
      const matchesStatus = statusFilter === 'All' || normalizedStatus === statusFilter;
      const matchesSearch = (order.orderNumber || order._id || '')
        .toString()
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  if (!isAuthenticated) {
    return (
      <div className="rounded-[2rem] border border-border bg-white p-10 shadow-sm text-center">
        <p className="text-lg text-slate-600">Please sign in to see your orders.</p>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-secondary">My Orders</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Order History</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <Filter className="h-4 w-4" /> Sorted by recent
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order number"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
          >
            {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p>Loading orders...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center text-rose-700">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-slate-50 border border-border rounded-3xl p-12 text-center text-slate-600">
            <Package className="mx-auto mb-4 h-16 w-16 text-slate-400" />
            <p className="text-lg font-semibold">No orders yet</p>
            <p className="mt-2">Start shopping to see your order history here.</p>
            <Link href="/products" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {filteredOrders.map((order) => {
              const orderStatus = (order.orderStatus || order.status || 'pending').toString().toLowerCase();
              return (
                <Link
                  key={order._id}
                  href={`/account/orders/${order._id}`}
                  className="grid gap-4 rounded-[1.75rem] border border-slate-200 p-5 transition hover:border-primary/50 hover:bg-slate-50 lg:grid-cols-[1.4fr_1fr_0.8fr] lg:items-center"
                >
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">Order {order.orderNumber || order._id}</p>
                    <h2 className="text-xl font-semibold text-slate-950">{new Date(order.createdAt).toLocaleDateString()}</h2>
                    <p className="text-sm text-slate-600">{order.items?.length ?? 0} items</p>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div>
                      <p className="text-slate-500">Total</p>
                      <p className="font-semibold text-slate-950">Rs. {order.total}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Payment</p>
                      <p className="font-semibold text-slate-950">{order.paymentMethod?.toUpperCase() || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start justify-between gap-3 sm:items-end">
                    <span className={`rounded-full px-3 py-1 text-sm ${statusStyles[orderStatus]}`}>
                      {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                    </span>
                    <span className="rounded-full border border-primary bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
                      View Details
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </section>
  );
}
