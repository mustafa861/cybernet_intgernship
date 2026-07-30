"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { TrialBalanceItem } from "@/types";
import { Scale } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";

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
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Scale className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trial Balance</h1>
            <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Category totals grouped by type</p>
          </div>
        </div>
        {data.length > 0 && (
          <ExportButtons
            filename="trial-balance"
            title="Trial Balance"
            columns={[
              { header: "Category", key: "category" },
              { header: "Type", key: "type" },
              { header: "Total", key: "total" },
            ]}
            rows={data.map((r) => ({ ...r, total: `$${r.total.toLocaleString()}` }))}
          />
        )}
      </div>

      {loading ? (
        <div className="card"><div className="empty-state">Loading...</div></div>
      ) : data.length === 0 ? (
        <div className="card"><div className="empty-state">No data available.</div></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <th className="table-header px-6 py-4">Category</th>
                <th className="table-header px-6 py-4">Type</th>
                <th className="table-header px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.map((item, i) => (
                <tr key={i} className={`${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"} hover:bg-primary-50/30 dark:hover:bg-primary-900/20 transition-colors`}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{item.category}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                    ${item.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
