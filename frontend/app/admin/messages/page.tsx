'use client';

import useSWR from 'swr';
import { useMemo, useState } from 'react';
import { contactAPI } from '@/services/api';
import { Search, RefreshCcw } from 'lucide-react';

const statusOptions = ['all', 'new', 'open', 'replied', 'closed'];

export default function AdminMessagesPage() {
  const staticMessages = [
    {
      _id: 'msg-01',
      name: 'Ritu Shrestha',
      email: 'ritu@example.com',
      subject: 'Bulk order for festive season',
      status: 'new',
      createdAt: '2026-07-18T09:00:00.000Z',
    },
    {
      _id: 'msg-02',
      name: 'Bikash Bhandari',
      email: 'bikash@example.com',
      subject: 'Request for custom packaging',
      status: 'replied',
      createdAt: '2026-07-16T11:20:00.000Z',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Contact</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">Customer contact inbox</h1>
        <p className="mt-4 text-sm text-slate-500">
          This panel is kept lightweight with a few example conversations so the contact area feels complete while the store is being finalized.
        </p>
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        <div className="min-w-[720px]">
          <div className="grid gap-0 border-b border-slate-200 bg-slate-100 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <span>From</span>
            <span>Subject</span>
            <span>Status</span>
            <span className="text-right">Date</span>
          </div>
          <div className="divide-y divide-slate-200">
            {staticMessages.map((message: any) => (
              <div key={message._id} className="grid items-center gap-4 px-6 py-5 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
                <div>
                  <p className="font-semibold text-slate-900">{message.name}</p>
                  <p className="text-sm text-slate-500">{message.email}</p>
                </div>
                <div className="text-slate-900">{message.subject}</div>
                <div>
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                    {message.status}
                  </span>
                </div>
                <div className="text-right text-slate-700">{new Date(message.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
