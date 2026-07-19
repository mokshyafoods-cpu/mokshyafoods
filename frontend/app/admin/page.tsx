 'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardHero from '@/components/admin/DashboardHero';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { AlertTriangle, ArrowUpRight, Clock3, CircleDollarSign, Package, ShoppingBag, Users } from 'lucide-react';

type DashboardData = {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  totalRevenue: number;
  recentOrders: Array<{ orderNumber: string; total: number; orderStatus: string; createdAt: string }>;
};

type AnalyticsData = {
  salesByDate: Record<string, number>;
  topProducts: Array<{ name: string; quantity: number }>;
};

type LowStockItem = {
  name?: string;
  quantity?: number;
  _id?: string;
};

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [dashboardResponse, analyticsResponse, lowStockResponse] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/analytics'),
          api.get('/admin/low-stock'),
        ]);
        const dashboardPayload = dashboardResponse.data;
        const analyticsPayload = analyticsResponse.data;
        const lowStockPayload = lowStockResponse.data;
        setDashboardData((dashboardPayload?.data ?? dashboardPayload) as DashboardData);
        setAnalyticsData((analyticsPayload?.data ?? analyticsPayload) as AnalyticsData);
        setLowStockItems((lowStockPayload?.data ?? lowStockPayload) as LowStockItem[]);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const salesSeries = useMemo(() => {
    const salesByDate = analyticsData?.salesByDate && typeof analyticsData.salesByDate === 'object'
      ? analyticsData.salesByDate
      : {};
    return Object.entries(salesByDate)
      .map(([date, amount]) => ({ date, amount: Number(amount ?? 0) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [analyticsData]);

  const formatCurrency = (value?: number) => `Rs. ${Number(value ?? 0).toLocaleString('en-IN')}`;
  const getStatusBadge = (status: string) => {
    const normalized = status?.toLowerCase() ?? 'pending';
    const base = 'rounded-full border border-white/10 px-3 py-1 text-xs font-semibold';
    if (normalized.includes('complete') || normalized.includes('delivered')) return `${base} bg-emerald-500/10 text-emerald-300`;
    if (normalized.includes('process') || normalized.includes('ship')) return `${base} bg-amber-500/10 text-amber-300`;
    if (normalized.includes('cancel')) return `${base} bg-rose-500/10 text-rose-300`;
    return `${base} bg-slate-800 text-slate-200`;
  };

  if (!user) {
    return null;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="max-w-xl rounded-[2rem] border border-border bg-white p-10 text-center shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Access Denied</p>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">Admin access required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            You do not have permission to access this section. Please sign in with an admin account.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="rounded-[2rem] border border-slate-700/70 bg-slate-950/70 p-10 shadow-[0_24px_80px_rgba(2,6,23,0.4)]">
          <p className="text-lg font-medium text-slate-200">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="rounded-[2rem] border border-rose-400/20 bg-slate-950/70 p-10 shadow-[0_24px_80px_rgba(2,6,23,0.4)]">
          <p className="text-lg font-semibold text-rose-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardHero
        title="Mokshya Business Hub"
        subtitle="Monitor sales velocity, order health, and stock movement in one polished overview built for fast-moving retail operations."
        revenue={dashboardData?.totalRevenue}
        orders={dashboardData?.totalOrders}
        customers={dashboardData?.totalCustomers}
        products={dashboardData?.totalProducts}
        lowStock={dashboardData?.lowStockProducts}
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-700/70 bg-[linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(17,24,39,0.95))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.4)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Sales trend</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Revenue by date</h2>
            </div>
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-sm font-medium text-sky-200">Last {salesSeries.length} days</span>
          </div>
          <div className="mt-6 h-72">
            <LineChart data={salesSeries} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-700/70 bg-[linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(17,24,39,0.95))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.35)] backdrop-blur sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Inventory</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Low stock alerts</h2>
            </div>
            <a href="/admin/low-stock" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300">
              Manage <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-6 space-y-3">
            {lowStockItems.length > 0 ? lowStockItems.slice(0, 4).map((item) => (
              <div key={item._id || item.name} className="flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-100">{item.name || 'Unnamed product'}</p>
                  <p className="text-sm text-slate-400">Qty left: {item.quantity ?? 0}</p>
                </div>
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">Restock</span>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/50 p-6 text-sm text-slate-400">
                No low stock products right now.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-slate-700/70 bg-[linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(17,24,39,0.95))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.35)] backdrop-blur sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Orders</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Recent activity</h2>
            </div>
            <a href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300">
              View all <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-6 space-y-3">
            {(dashboardData?.recentOrders ?? []).slice(0, 5).map((order) => (
              <div key={order.orderNumber} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-4">
                <div>
                  <p className="font-semibold text-slate-100">{order.orderNumber}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                    <Clock3 className="h-4 w-4" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-200">Rs. {order.total}</span>
                  <span className={getStatusBadge(order.orderStatus)}>{order.orderStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-700/70 bg-[linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(17,24,39,0.95))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.35)] backdrop-blur sm:p-8">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Best sellers</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Top products</h2>
          </div>
          <div className="mt-6 space-y-4">
            <BarChart data={analyticsData?.topProducts ?? []} />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, accent, icon: Icon }: { label: string; value: string; accent?: 'emerald' | 'amber' | 'sky' | 'rose'; icon: React.ElementType }) {
  const accentClasses = {
    emerald: 'border-sky-400/20 bg-[linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(17,24,39,0.95))] text-slate-100',
    amber: 'border-amber-400/20 bg-[linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(17,24,39,0.95))] text-slate-100',
    sky: 'border-sky-400/20 bg-[linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(17,24,39,0.95))] text-slate-100',
    rose: 'border-rose-400/20 bg-[linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(17,24,39,0.95))] text-slate-100',
  };

  return (
    <div className={`rounded-[1.75rem] border p-6 shadow-[0_18px_45px_rgba(2,6,23,0.25)] ${accentClasses[accent ?? 'emerald']}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">{label}</p>
          <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3 shadow-sm">
          <Icon className="h-5 w-5 text-sky-200" />
        </div>
      </div>
    </div>
  );
}

function LineChart({ data }: { data: Array<{ date: string; amount: number }> }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No sales data available yet.</p>;
  }

  const width = 360;
  const height = 260;
  const padding = 38;
  const values = data.map((item) => Number(item.amount ?? 0));
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  const points = data.map((item, idx) => {
    const x = data.length === 1
      ? width / 2
      : padding + (idx / (data.length - 1)) * (width - padding * 2);
    const normalized = (Number(item.amount ?? 0) - minValue) / range;
    const y = height - padding - normalized * (height - padding * 2);
    return { x, y, amount: Number(item.amount ?? 0), date: item.date };
  });

  const path = points.map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
  const area = `${path} L ${points[points.length - 1].x.toFixed(2)} ${height - padding} L ${points[0].x.toFixed(2)} ${height - padding} Z`;
  const yTicks = Array.from({ length: 4 }, (_, idx) => {
    const ratio = idx / 3;
    const value = maxValue - ratio * range;
    const y = padding + ratio * (height - padding * 2);
    return { value, y };
  });
  const xTickIndices = [0, Math.floor((data.length - 1) / 2), data.length - 1].filter((idx, position, arr) => arr.indexOf(idx) === position);

  return (
    <div className="relative h-full w-full rounded-[1.5rem] border border-slate-700/70 bg-[linear-gradient(135deg,_rgba(3,10,24,0.95),_rgba(15,23,42,0.9))] p-3 shadow-inner">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible">
        <rect x="0" y="0" width={width} height={height} rx="24" fill="transparent" />
        {yTicks.map((tick) => (
          <g key={tick.value}>
            <line x1={padding} y1={tick.y} x2={width - padding} y2={tick.y} stroke="#334155" strokeDasharray="4 4" />
            <text x="10" y={tick.y + 4} fontSize="10" fill="#94a3b8">{Math.round(tick.value).toLocaleString('en-IN')}</text>
          </g>
        ))}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#38bdf8" strokeWidth="1.6" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#38bdf8" strokeWidth="1.6" />
        <path d={area} fill="rgba(56,189,248,0.18)" />
        <path d={path} fill="none" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <circle key={point.date} cx={point.x} cy={point.y} r="4.2" fill="#38bdf8" stroke="#020617" strokeWidth="2" />
        ))}
        {xTickIndices.map((idx) => {
          const point = points[idx];
          const label = new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <text key={point.date} x={point.x} y={height - 12} fontSize="10" textAnchor="middle" fill="#94a3b8">
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function BarChart({ data }: { data: Array<{ name: string; quantity: number }> }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No product sales data available.</p>;
  }

  const maxValue = Math.max(...data.map((item) => item.quantity));

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.name} className="space-y-2 rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3">
          <div className="flex items-center justify-between text-sm font-medium text-slate-300">
            <span>{item.name}</span>
            <span className="font-semibold text-white">{item.quantity}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-800/80">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,_#38bdf8_0%,_#2563eb_100%)]" style={{ width: `${(item.quantity / maxValue) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
