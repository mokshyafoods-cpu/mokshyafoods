import React from 'react';
import { ArrowUpRight, CircleDollarSign, Package, ShoppingBag, Users } from 'lucide-react';

export default function DashboardHero({ title, subtitle, revenue, orders, customers, products, lowStock }: any) {
  const formatCurrency = (value?: number) => `Rs. ${Number(value ?? 0).toLocaleString('en-IN')}`;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-700/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] p-6 text-slate-50 shadow-[0_24px_90px_rgba(2,6,23,0.45)] sm:p-8 lg:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(125,211,252,0.16),_transparent_28%)]" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.38em] text-sky-300">Operations overview</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">{subtitle}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 backdrop-blur">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-sky-300" />
          Live business pulse
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>

      <div className="relative mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricPill label="Revenue" value={formatCurrency(revenue)} icon={CircleDollarSign} />
          <MetricPill label="Orders" value={orders ?? 0} icon={ShoppingBag} />
          <MetricPill label="Customers" value={customers ?? 0} icon={Users} />
          <MetricPill label="Products" value={products ?? 0} icon={Package} />
        </div>
        <div className="rounded-[1.75rem] border border-sky-400/20 bg-slate-950/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Watchlist</p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-semibold text-white">{lowStock ?? 0}</p>
              <p className="mt-1 text-sm text-slate-300">items need restock attention</p>
            </div>
            <div className="rounded-2xl border border-sky-400/20 bg-sky-400/15 p-3">
              <ArrowUpRight className="h-5 w-5 text-sky-200" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricPill({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-700/70 bg-slate-950/45 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400">{label}</p>
        <div className="rounded-xl border border-sky-400/20 bg-sky-400/10 p-1.5">
          <Icon className="h-3.5 w-3.5 text-sky-200" />
        </div>
      </div>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
