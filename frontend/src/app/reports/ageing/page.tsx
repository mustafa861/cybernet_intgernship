"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { AgeingResponse } from "@/types";
import { Search, Users, Building2, Clock } from "lucide-react";

export default function AgeingReportPage() {
  const { ready } = useAuthGuard();
  const [asOf, setAsOf] = useState("");
  const [data, setData] = useState<AgeingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  if (!ready) return null;

  const fetchReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.ageing(asOf || undefined);
      setData(res);
    } catch {}
    setLoading(false);
  };

  const renderTable = (
    items: AgeingResponse["customers"],
    label: string,
    icon: typeof Users,
    color: string,
    total: number,
  ) => {
    const Icon = icon;
    return (
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{label}</h2>
          <span className="ml-auto text-lg font-bold text-gray-900 dark:text-gray-100">
            ${total.toLocaleString()}
          </span>
        </div>
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400 dark:text-gray-500">No {label.toLowerCase()} recorded</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="table-header px-6 py-3">Contact</th>
                  <th className="table-header px-6 py-3 text-right">Total</th>
                  <th className="table-header px-6 py-3 text-right">0-30 days</th>
                  <th className="table-header px-6 py-3 text-right">31-60 days</th>
                  <th className="table-header px-6 py-3 text-right">60+ days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item, i) => (
                  <tr key={i} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{item.contact_name}</td>
                    <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">${item.total.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400">${item.current.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm text-right text-yellow-600">${item.days_31_60.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm text-right text-red-600">${item.days_60_plus.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ageing Report</h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Accounts receivable and payable by overdue period</p>
      </div>

      <form onSubmit={fetchReport} className="card p-5 mb-8 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 dark:text-gray-400">As of Date</label>
          <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="input-field" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
          <Search className="w-4 h-4" /> {loading ? "Loading..." : "Generate"}
        </button>
      </form>

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="stat-card">
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Receivables</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-0.5">
                  ${data.total_receivables.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="stat-card">
              <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Payables</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400 mt-0.5">
                  ${data.total_payables.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {renderTable(data.customers, "Accounts Receivable", Users, "bg-blue-50 dark:bg-blue-900/20 text-blue-600", data.total_receivables)}
          {renderTable(data.vendors, "Accounts Payable", Building2, "bg-orange-50 dark:bg-orange-900/20 text-orange-600", data.total_payables)}
        </div>
      )}
    </div>
  );
}
