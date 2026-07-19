'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { orderAPI } from '@/services/api';
import Link from 'next/link';
import { Package, Calendar, DollarSign, Truck } from 'lucide-react';

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { data: ordersResponse, isLoading, error } = useSWR(isAuthenticated ? '/api/orders' : null, async () => {
    const response = await orderAPI.getAll();
    return response?.data ?? response;
  });

  const orders = Array.isArray((ordersResponse as any)?.data?.data)
    ? (ordersResponse as any).data.data
    : Array.isArray((ordersResponse as any)?.data)
      ? (ordersResponse as any).data
      : Array.isArray(ordersResponse)
        ? ordersResponse
        : [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-grow flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-primary">Please Log In</h1>
            <Link href="/auth/login" className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition font-semibold">
              Go to Login
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />

      <main className="flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Order history</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">My Orders</h1>
              </div>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <p className="text-lg font-medium text-slate-700">Loading orders...</p>
            </div>
          ) : error || orders.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-12">
              <Package className="mx-auto mb-4 h-16 w-16 text-slate-400" />
              <p className="text-lg font-semibold text-slate-900">No orders yet</p>
              <p className="mt-2 text-sm text-slate-600">Start shopping to see your recent orders here.</p>
              <Link href="/products" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Order</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {orders.map((order: any) => {
                      const status = typeof order?.orderStatus === 'string' && order.orderStatus.trim()
                        ? order.orderStatus.toLowerCase()
                        : typeof order?.status === 'string' && order.status.trim()
                          ? order.status.toLowerCase()
                          : 'pending';

                      return (
                        <tr key={order._id} className="align-middle">
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-900">{order.orderNumber}</div>
                            <div className="mt-1 text-xs text-slate-500">{order.items?.length || 0} item{(order.items?.length || 0) === 1 ? '' : 's'}</div>
                          </td>
                          <td className="px-4 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(status)}`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-900">Rs. {order.total}</td>
                          <td className="px-4 py-4">
                            <Link href={`/orders/${order._id}`} className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90">
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {orders.map((order: any) => {
                  const status = typeof order?.orderStatus === 'string' && order.orderStatus.trim()
                    ? order.orderStatus.toLowerCase()
                    : typeof order?.status === 'string' && order.status.trim()
                      ? order.status.toLowerCase()
                      : 'pending';

                  return (
                    <div key={order._id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Order</p>
                          <p className="mt-1 font-semibold text-slate-900">{order.orderNumber}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(status)}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Date</p>
                          <p className="mt-1 font-medium text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Total</p>
                          <p className="mt-1 font-medium text-slate-900">Rs. {order.total}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Link href={`/orders/${order._id}`} className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90">
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
