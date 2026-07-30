"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { ProfitLossResponse } from "@/types";
import { TrendingUp, TrendingDown, Calculator, Search } from "lucide-react";

export default function ProfitLossPage() {
  const { ready } = useAuthGuard();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<ProfitLossResponse | null>(null);
  const [loading, setLoading] = useState(false);

  if (!ready) return null;

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profit & Loss</h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Income, expenses, and net profit for a period</p>
      </div>

      <form onSubmit={fetchReport} className="card p-5 mb-8 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 dark:text-gray-400">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 dark:text-gray-400">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="input-field" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
          <Search className="w-4 h-4" /> {loading ? "Loading..." : "Generate"}
        </button>
      </form>

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="stat-card">
              <div className="w-12 h-12 rounded-lg bg-income-light flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-income" />
              </div>
              <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</p>
            <p className="text-2xl font-bold text-income-dark mt-0.5 dark:text-green-400">${data.total_income.toLocaleString()}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="w-12 h-12 rounded-lg bg-expense-light flex items-center justify-center shrink-0">
                <TrendingDown className="w-6 h-6 text-expense" />
              </div>
              <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</p>
            <p className="text-2xl font-bold text-expense mt-0.5 dark:text-red-400">${data.total_expenses.toLocaleString()}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                <Calculator className={`w-6 h-6 ${data.net_profit >= 0 ? "text-income" : "text-expense"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Profit</p>
                <p className={`text-2xl font-bold mt-0.5 ${data.net_profit >= 0 ? "text-income-dark" : "text-expense"}`}>
                  ${data.net_profit.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-income" /> Income
              </h3>
              {data.income.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">No income recorded</p>
              ) : (
                <div className="space-y-2">
                  {data.income.map((i, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{i.category}</span>
                      <span className="font-semibold text-income-dark dark:text-green-400">${i.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-expense" /> Expenses
              </h3>
              {data.expenses.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">No expenses recorded</p>
              ) : (
                <div className="space-y-2">
                  {data.expenses.map((e, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{e.category}</span>
                      <span className="font-semibold text-expense dark:text-red-400">${e.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
