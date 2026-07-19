'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { orderAPI, reviewAPI, wishlistAPI } from '@/services/api';
import { ArrowRight, Box, Heart, Truck, ListChecks, Star } from 'lucide-react';

export default function AccountDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [reviewsError, setReviewsError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setWishlistCount(0);
      setOrders([]);
      setReviews([]);
      setIsLoadingOrders(false);
      setIsLoadingReviews(false);
      return;
    }

    const loadDashboardData = async () => {
      setIsLoadingOrders(true);
      setIsLoadingReviews(true);
      setOrdersError('');
      setReviewsError('');

      try {
        const [wishlistResponse, ordersResponse, reviewsResponse] = await Promise.all([
          wishlistAPI.getWishlist().catch((err) => {
            console.error('Failed to load wishlist count:', err);
            return null;
          }),
          orderAPI.getAll().catch((err) => {
            console.error('Failed to load orders:', err);
            throw err;
          }),
          reviewAPI.getUserReviews().catch((err) => {
            console.error('Failed to load reviews:', err);
            throw err;
          }),
        ]);

        const wishlistBody = wishlistResponse?.data ?? wishlistResponse;
        const wishlistPayload = Array.isArray(wishlistBody?.data) ? wishlistBody.data : Array.isArray(wishlistBody) ? wishlistBody : [];
        setWishlistCount(Array.isArray(wishlistPayload) ? wishlistPayload.length : 0);

        const ordersBody = ordersResponse?.data ?? ordersResponse;
        const ordersPayload = Array.isArray(ordersBody?.data) ? ordersBody.data : Array.isArray(ordersBody) ? ordersBody : [];
        setOrders(Array.isArray(ordersPayload) ? ordersPayload : []);

        const reviewsBody = reviewsResponse?.data ?? reviewsResponse;
        const reviewsPayload = Array.isArray(reviewsBody?.data) ? reviewsBody.data : Array.isArray(reviewsBody) ? reviewsBody : [];
        setReviews(Array.isArray(reviewsPayload) ? reviewsPayload : []);
      } catch (err: any) {
        setOrdersError('Unable to load your order history right now.');
        setReviewsError('Unable to load your reviews right now.');
      } finally {
        setIsLoadingOrders(false);
        setIsLoadingReviews(false);
      }
    };

    loadDashboardData();
  }, [isAuthenticated]);

  const firstName = user?.name?.split(' ')[0] || 'Customer';
  const totalOrders = orders.length;
  const activeOrders = orders.filter((order) => !['delivered', 'cancelled'].includes(order.orderStatus?.toLowerCase())).length;
  const totalReviews = reviews.length;
  const recentOrders = orders.slice(0, 3);
  const recentReviews = reviews.slice(0, 3);

  const summaryItems = [
    { label: 'Total Orders', value: totalOrders, icon: Box, color: 'bg-amber-100 text-amber-700' },
    { label: 'Active Orders', value: activeOrders, icon: Truck, color: 'bg-sky-100 text-sky-700' },
    { label: 'Wishlist Items', value: wishlistCount, icon: Heart, color: 'bg-rose-100 text-rose-700' },
    { label: 'My Reviews', value: totalReviews, icon: Star, color: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <section className="space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-0">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-secondary">Welcome back</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Hi, {firstName}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Your account overview shows your latest orders, saved favorites, and current activity. Keep exploring premium snacks from Mokshya.
            </p>
          </div>
          <Link href="/account/orders" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90">
            View All Orders <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-bold text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Recent Orders</h2>
            <p className="mt-1 text-sm text-slate-600">Review the latest orders from your account activity feed.</p>
          </div>
          <Link href="/account/orders" className="text-sm font-semibold text-primary hover:text-secondary">
            View all orders
          </Link>
        </div>

        {isLoadingOrders ? (
          <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">Loading your recent orders…</div>
        ) : ordersError ? (
          <div className="mt-6 rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">{ordersError}</div>
        ) : recentOrders.length === 0 ? (
          <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
            No recent orders yet. Start shopping to see your order history here.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/account/orders/${order._id}`}
                className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 p-5 transition hover:border-primary/50 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-500">Order {order.orderNumber || order._id}</p>
                  <h3 className="text-lg font-semibold text-slate-950">{new Date(order.createdAt).toLocaleDateString()}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {Array.isArray(order.items) && order.items.length > 0
                      ? order.items.map((item: any) => item?.name || item?.product?.name || 'Item').join(', ')
                      : 'No item details available yet'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span>Rs. {order.total ?? order.subtotal ?? 0}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                    {(order.orderStatus || order.status || 'pending').toString().charAt(0).toUpperCase() + (order.orderStatus || order.status || 'pending').toString().slice(1)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
