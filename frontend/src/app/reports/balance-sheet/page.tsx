"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { BalanceSheetResponse } from "@/types";

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Balance Sheet</h1>
      <form onSubmit={fetchReport} className="flex gap-3 mb-6">
        <input
          type="date"
          value={asOf}
          onChange={(e) => setAsOf(e.target.value)}
          required
          className="border rounded-md px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Generate"}
        </button>
      </form>
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-500">Total Assets</p>
              <p className="text-xl font-bold text-blue-600">{data.total_assets.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-500">Total Liabilities & Equity</p>
              <p className="text-xl font-bold text-blue-600">{data.total_liabilities_and_equity.toLocaleString()}</p>
            </div>
          </div>
          {[
            { label: "Assets", items: data.assets },
            { label: "Liabilities", items: data.liabilities },
            { label: "Equity", items: data.equity },
          ].map((section) =>
            section.items.length > 0 ? (
              <div key={section.label} className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold mb-3">{section.label}</h3>
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>{item.category}</span>
                    <span className="font-medium">{item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
