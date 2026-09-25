import React from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  FileCheck,
  AlertCircle,
  FileText,
  CreditCard,
  Building,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/Button';

interface TreasurerDashboardViewProps {
  user: any;
  pendingRequestsCount?: number;
}

export function TreasurerDashboardView({
  user,
  pendingRequestsCount = 0,
}: TreasurerDashboardViewProps) {
  const firstName = user?.full_name?.split(/\s+/)[0] || 'Treasurer';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900 uppercase tracking-wider">
            <DollarSign size={14} className="text-emerald-700" /> Treasury & Stewardship
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Treasurer Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Welcome, {firstName}. Manage TUMCU finances, budget allocations, requisitions, and audit trails.
          </p>
        </div>

        {/* 4 Treasurer KPIs */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
              Semester Collections
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-900">KSh 0</span>
            </div>
            <p className="text-[10px] text-emerald-700 mt-0.5">Offerings, tithes & pledges</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Disbursed Expenses
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900">KSh 0</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">0% of budget utilized</p>
          </div>

          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
              Pending Requisitions
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-900">{pendingRequestsCount}</span>
              <span className="text-[10px] font-bold text-amber-700">need review</span>
            </div>
            <p className="text-[10px] text-amber-700 mt-0.5">Ministry requests</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Awaiting Audit Signatures
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">0</span>
              <span className="text-[10px] font-bold text-slate-500">resolutions</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Ready for Chairperson/Patron</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Finance Controls</span>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/dashboard/finance"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-bold transition shadow-xs"
          >
            <FileCheck size={14} /> Review Requisitions ({pendingRequestsCount})
          </Link>
          <Link
            to="/dashboard/finance"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 text-xs font-bold transition"
          >
            <CreditCard size={14} className="text-emerald-700" /> Record Offering / Payment
          </Link>
          <Link
            to="/dashboard/admin?tab=finance"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 text-xs font-bold transition"
          >
            <FileText size={14} className="text-emerald-700" /> Sign Resolutions
          </Link>
          <Link
            to="/dashboard/more"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 text-xs font-bold transition"
          >
            <TrendingUp size={14} className="text-emerald-700" /> Financial Audit Report
          </Link>
        </div>
      </div>

      {/* Financial Resolutions Activity */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Recent Ministry Requisitions</h3>
          <Link to="/dashboard/finance" className="text-xs font-bold text-[#006633] hover:underline">
            View All →
          </Link>
        </div>

        <div className="py-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <CreditCard size={24} className="mx-auto text-slate-300 mb-1.5" />
          <p className="text-xs font-bold text-slate-700">No ministry requisitions submitted yet.</p>
          <p className="text-[11px] text-slate-400">
            Financial requests and budget expenditure requisitions from departments will appear here for verification and authorization.
          </p>
        </div>
      </div>
    </div>
  );
}
