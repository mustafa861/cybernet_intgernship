"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { TrialBalanceItem } from "@/types";
import { Scale } from "lucide-react";

export default function TrialBalancePage() {
  const { ready } = useAuthGuard();
  const [data, setData] = useState<TrialBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    api.trialBalance().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [ready]);

  if (!ready) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <Scale className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trial Balance</h1>
          <p className="text-sm text-gray-500 mt-1">Category totals grouped by type</p>
        </div>
      </div>

      {loading ? (
        <div className="card"><div className="empty-state">Loading...</div></div>
      ) : data.length === 0 ? (
        <div className="card"><div className="empty-state">No data available.</div></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="table-header px-6 py-4">Category</th>
                <th className="table-header px-6 py-4">Type</th>
                <th className="table-header px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, i) => (
                <tr key={i} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-primary-50/30 transition-colors`}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.category}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    ${item.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
