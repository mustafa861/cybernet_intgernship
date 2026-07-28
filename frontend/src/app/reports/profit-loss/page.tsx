"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import type { ProfitLossResponse } from "@/types";

export default function ProfitLossPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<ProfitLossResponse | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) { router.push("/login"); return null; }

  const fetchReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.profitLoss(startDate, endDate);
      setData(res);
    } catch {}
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profit & Loss</h1>
      <form onSubmit={fetchReport} className="flex gap-3 mb-6">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          className="border rounded-md px-3 py-2"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
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
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-500">Total Income</p>
              <p className="text-xl font-bold text-green-600">{data.total_income.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-xl font-bold text-red-600">{data.total_expenses.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-500">Net Profit</p>
              <p className="text-xl font-bold text-blue-600">{data.net_profit.toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Income</h3>
              {data.income.map((i, idx) => (
                <div key={idx} className="flex justify-between py-1">
                  <span>{i.category}</span>
                  <span className="font-medium">{i.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Expenses</h3>
              {data.expenses.map((e, idx) => (
                <div key={idx} className="flex justify-between py-1">
                  <span>{e.category}</span>
                  <span className="font-medium">{e.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
