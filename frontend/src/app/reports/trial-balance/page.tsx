"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { TrialBalanceItem } from "@/types";

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
      <h1 className="text-2xl font-bold mb-6">Trial Balance</h1>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-gray-400">No data.</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-right px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {item.total.toLocaleString()}
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
