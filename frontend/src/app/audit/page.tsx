"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { MonthlyAuditResponse } from "@/types";

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
      <h1 className="text-2xl font-bold mb-6">Monthly Audit</h1>
      <form onSubmit={runAudit} className="flex gap-3 mb-6">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          required
          className="border rounded-md px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Running..." : "Run Audit"}
        </button>
      </form>
      {data && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Reviewed {data.entries_reviewed} entries · Found {data.flags.length} flag{data.flags.length !== 1 ? "s" : ""}
          </p>
          {data.flags.length === 0 ? (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4">
              No anomalies found — this month looks clean.
            </div>
          ) : (
            <div className="space-y-3">
              {data.flags.map((flag, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-4 ${
                    flag.severity === "high"
                      ? "bg-red-50 border-red-200"
                      : flag.severity === "medium"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        flag.severity === "high"
                          ? "bg-red-200 text-red-800"
                          : flag.severity === "medium"
                          ? "bg-yellow-200 text-yellow-800"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {flag.severity}
                    </span>
                    <span className="text-xs text-gray-400">Entry: {flag.entry_id.slice(0, 8)}</span>
                  </div>
                  <p className="text-sm">{flag.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
