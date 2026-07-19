'use client';

import useSWR from 'swr';
import { useMemo, useState } from 'react';
import { userAPI } from '@/services/api';
import { Search, RefreshCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [customerToDelete, setCustomerToDelete] = useState<any | null>(null);

  const queryParams = useMemo(() => ({
    page,
    limit: 20,
  }), [page]);

  const { data, error, isLoading, mutate } = useSWR(
    ['admin-customers', queryParams],
    () => userAPI.getAll(queryParams)
  );

  // `data` is the axios response; the backend body is in `data.data`
  const body = data?.data;
  const users = body?.data || [];
  const pagination = body?.pagination;
  const totalPages = Math.max(1, Math.ceil((pagination?.total ?? users.length) / (pagination?.limit ?? 20)));
  const shownRangeStart = Math.min((page - 1) * (pagination?.limit ?? 20) + 1, pagination?.total ?? users.length);
  const shownRangeEnd = Math.min(page * (pagination?.limit ?? 20), pagination?.total ?? users.length);

  const handleRoleChange = async (userId: string, role: string) => {
    await userAPI.updateRole(userId, { role });
    await mutate();
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      await userAPI.delete(customerToDelete._id);
      toast.success('Customer deleted');
      setCustomerToDelete(null);
      await mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Customers</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">Customer directory</h1>
            <p className="mt-4 text-sm text-slate-500">
              Keep track of your regular customers and their account roles in a simple, searchable list.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        <div className="min-w-[820px]">
          <div className="grid gap-0 border-b border-slate-200 bg-slate-100 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 sm:grid-cols-[2fr_1.2fr_1fr_1fr]">
            <span>Customer</span>
            <span>Email</span>
            <span>Role</span>
            <span className="text-right">Joined</span>
          </div>

        {isLoading ? (
          <div className="p-10 text-center text-slate-500">Loading customers...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-700">Unable to load customers.</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No customers found.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {users
              .filter((user: any) => {
                if (!search.trim()) return true;
                const term = search.trim().toLowerCase();
                return user.name?.toLowerCase().includes(term)
                  || user.email?.toLowerCase().includes(term)
                  || user.phone?.toLowerCase().includes(term);
              })
              .map((customer: any) => (
                <div key={customer._id} className="grid items-center gap-4 px-6 py-5 sm:grid-cols-[2fr_1.2fr_1fr_1fr]">
                  <div>
                    <p className="font-semibold text-slate-900">{customer.name}</p>
                    <p className="text-sm text-slate-500">{customer.phone || 'No phone'}</p>
                    <button type="button" onClick={() => setCustomerToDelete(customer)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                  <div className="text-slate-900">{customer.email}</div>
                  <div>
                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary"
                      value={customer.role}
                      onChange={(e) => handleRoleChange(customer._id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="cashier">Cashier</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="text-right text-slate-700">{new Date(customer.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>

      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {pagination?.total ? `Showing ${shownRangeStart}-${shownRangeEnd} of ${pagination.total} records` : `${users.length} customer records displayed.`}
        </div>
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

      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Confirm delete</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Delete {customerToDelete.name}?</h2>
            <p className="mt-3 text-sm text-slate-600">This action removes the customer record from the admin directory and cannot be undone.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setCustomerToDelete(null)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="button" onClick={handleDelete} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Delete customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
