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
        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Audit</h1>
          <p className="text-sm text-gray-500 mt-1">Review entries for anomalies and suspicious activity</p>
        </div>
      </div>

      <form onSubmit={runAudit} className="card p-5 mb-8 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Month</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} required className="input-field" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
          <SearchCheck className="w-4 h-4" /> {loading ? "Running..." : "Run Audit"}
        </button>
      </form>

      {data && (
        <div>
          <div className="flex items-center gap-2 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <SearchCheck className="w-5 h-5 text-gray-500" />
            <p className="text-sm text-gray-600">
              Reviewed <strong>{data.entries_reviewed}</strong> entries &middot; Found <strong>{data.flags.length}</strong> flag{data.flags.length !== 1 ? "s" : ""}
            </p>
          </div>

          {data.flags.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-income mx-auto mb-3" />
              <p className="text-gray-700 font-medium">No anomalies found</p>
              <p className="text-sm text-gray-400 mt-1">This month looks clean.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.flags.map((flag, i) => {
                const severityStyles = {
                  high: "bg-red-50 border-red-200",
                  medium: "bg-yellow-50 border-yellow-200",
                  low: "bg-gray-50 border-gray-200",
                };
                const badgeStyles = {
                  high: "bg-red-200 text-red-800",
                  medium: "bg-yellow-200 text-yellow-800",
                  low: "bg-gray-200 text-gray-800",
                };
                return (
                  <div key={i} className={`rounded-lg border p-4 ${severityStyles[flag.severity]}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeStyles[flag.severity]}`}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {flag.severity}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">Entry: {flag.entry_id.slice(0, 8)}...</span>
                    </div>
                    <p className="text-sm text-gray-700">{flag.reason}</p>
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
