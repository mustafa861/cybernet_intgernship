"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { MonthlyAuditResponse } from "@/types";
import { ShieldCheck, AlertTriangle, SearchCheck, CheckCircle2 } from "lucide-react";

export default function AuditPage() {
  const { ready } = useAuthGuard();
  const [month, setMonth] = useState("");
  const [data, setData] = useState<MonthlyAuditResponse | null>(null);
  const [loading, setLoading] = useState(false);

  if (!ready) return null;

  const runAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.monthlyAudit(month + "-01");
      setData(res);
    } catch {}
    setLoading(false);
  };

  return (
    <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Monthly Audit</h1>
            <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Review entries for anomalies and suspicious activity</p>
          </div>
        </div>

        <form onSubmit={runAudit} className="card p-5 mb-8 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 dark:text-gray-400">Month</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} required className="input-field" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
          <SearchCheck className="w-4 h-4" /> {loading ? "Running..." : "Run Audit"}
        </button>
      </form>

      {data && (
        <div>
          <div className="flex items-center gap-2 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <SearchCheck className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Reviewed <strong>{data.entries_reviewed}</strong> entries &middot; Found <strong>{data.flags.length}</strong> flag{data.flags.length !== 1 ? "s" : ""}
            </p>
          </div>

          {data.flags.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-income dark:text-green-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium dark:text-gray-300">No anomalies found</p>
              <p className="text-sm text-gray-400 mt-1 dark:text-gray-500">This month looks clean.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.flags.map((flag, i) => {
                const severityStyles = {
                  high: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
                  medium: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
                  low: "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700",
                };
                const badgeStyles = {
                  high: "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300",
                  medium: "bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
                  low: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
                };
                return (
                  <div key={i} className={`rounded-lg border p-4 ${severityStyles[flag.severity]}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeStyles[flag.severity]}`}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {flag.severity}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">Entry: {flag.entry_id.slice(0, 8)}...</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{flag.reason}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
