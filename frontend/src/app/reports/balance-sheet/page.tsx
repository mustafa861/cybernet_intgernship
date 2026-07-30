"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { BalanceSheetResponse } from "@/types";
import { Search, Building2, CreditCard, Landmark } from "lucide-react";

export default function BalanceSheetPage() {
  const { ready } = useAuthGuard();
  const [asOf, setAsOf] = useState("");
  const [data, setData] = useState<BalanceSheetResponse | null>(null);
  const [loading, setLoading] = useState(false);

  if (!ready) return null;

  const fetchReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.balanceSheet(asOf);
      setData(res);
    } catch {}
    setLoading(false);
  };

  const sectionIcons: Record<string, typeof Building2> = {
    Assets: Building2, Liabilities: CreditCard, Equity: Landmark,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Balance Sheet</h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Assets, liabilities, and equity as of a date</p>
      </div>

      <form onSubmit={fetchReport} className="card p-5 mb-8 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 dark:text-gray-400">As of Date</label>
          <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} required className="input-field" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
          <Search className="w-4 h-4" /> {loading ? "Loading..." : "Generate"}
        </button>
      </form>

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="stat-card">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Assets</p>
            <p className="text-2xl font-bold text-blue-700 mt-0.5 dark:text-blue-400">${data.total_assets.toLocaleString()}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Landmark className="w-6 h-6 text-purple-600" />
              </div>
              <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Liabilities & Equity</p>
            <p className="text-2xl font-bold text-purple-700 mt-0.5 dark:text-purple-400">${data.total_liabilities_and_equity.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {[
            { label: "Assets", items: data.assets },
            { label: "Liabilities", items: data.liabilities },
            { label: "Equity", items: data.equity },
          ].map((section) =>
            section.items.length > 0 ? (
              <div key={section.label} className="card p-5">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  {(() => { const Icon = sectionIcons[section.label] || Building2; return <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />; })()}
                  {section.label}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.category}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">${item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
