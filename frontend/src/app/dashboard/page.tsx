"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { Entry, Category } from "@/types";
import { TrendingUp, TrendingDown, PiggyBank, Plus, Bot, Percent, Scale, BarChart3 } from "lucide-react";

interface MonthData {
  label: string;
  income: number;
  expense: number;
}

export default function DashboardPage() {
  const { ready } = useAuthGuard();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    Promise.all([
      api.listEntries(),
      api.listCategories(),
    ]).then(([e, c]) => {
      setEntries(e);
      setCategories(c);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [ready]);

  const catTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    const flatten = (cats: Category[]) => {
      for (const c of cats) {
        map[c.id] = c.type;
        flatten(c.children);
      }
    };
    flatten(categories);
    return map;
  }, [categories]);

  const totalIncome = entries
    .filter((e) => e.entry_type === "income")
    .reduce((s, e) => s + e.amount_minor, 0);
  const totalExpenses = entries
    .filter((e) => e.entry_type === "expense")
    .reduce((s, e) => s + e.amount_minor, 0);
  const net = totalIncome - totalExpenses;

  const totalAssets = entries
    .filter((e) => catTypeMap[e.category_id] === "asset")
    .reduce((s, e) => s + e.amount_minor, 0);
  const totalLiabilities = entries
    .filter((e) => catTypeMap[e.category_id] === "liability")
    .reduce((s, e) => s + e.amount_minor, 0);

  const currentRatio = totalLiabilities > 0 ? (totalAssets / totalLiabilities) : 0;
  const netProfitMargin = totalIncome > 0 ? (net / totalIncome) * 100 : 0;

  const monthlyData = useMemo(() => {
    const groups: Record<string, MonthData> = {};
    for (const e of entries) {
      const month = e.entry_date.slice(0, 7);
      if (!groups[month]) groups[month] = { label: month, income: 0, expense: 0 };
      if (e.entry_type === "income") groups[month].income += e.amount_minor;
      else groups[month].expense += e.amount_minor;
    }
    return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
  }, [entries]);

  const maxMoM = Math.max(
    ...monthlyData.map((m) => Math.max(m.income, m.expense)),
    1,
  );

  if (!ready) return null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Your financial overview at a glance</p>
        </div>
        <div className="flex gap-3">
          <Link href="/entries/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Entry
          </Link>
          <Link href="/chat" className="btn-secondary inline-flex items-center gap-2">
            <Bot className="w-4 h-4" /> AI Chat
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="stat-card">
          <div className="w-12 h-12 rounded-lg bg-income-light dark:bg-green-900/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-income dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</p>
            <p className="text-2xl font-bold text-income-dark mt-0.5 dark:text-green-400">
              ${(totalIncome / 100).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-lg bg-expense-light dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6 text-expense dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</p>
            <p className="text-2xl font-bold text-expense mt-0.5 dark:text-red-400">
              ${(totalExpenses / 100).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
            <PiggyBank className={`w-6 h-6 ${net >= 0 ? "text-income dark:text-green-400" : "text-expense dark:text-red-400"}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net</p>
            <p className={`text-2xl font-bold mt-0.5 ${net >= 0 ? "text-income-dark dark:text-green-400" : "text-expense dark:text-red-400"}`}>
              ${(net / 100).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="stat-card">
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Ratio</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-0.5">
              {currentRatio.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {totalAssets > 0 || totalLiabilities > 0
                ? `${(totalAssets / 100).toLocaleString()} / ${(totalLiabilities / 100).toLocaleString()}`
                : "No data"}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Profit Margin</p>
            <p className={`text-2xl font-bold mt-0.5 ${netProfitMargin >= 0 ? "text-income-dark dark:text-green-400" : "text-expense dark:text-red-400"}`}>
              {netProfitMargin.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {totalIncome > 0 ? `${(net / 100).toLocaleString()} / ${(totalIncome / 100).toLocaleString()}` : "No income"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            Month-over-Month
          </h2>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {monthlyData.map((m) => {
                const incomePct = (m.income / maxMoM) * 100;
                const expensePct = (m.expense / maxMoM) * 100;
                return (
                  <div key={m.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{m.label}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ${(m.income / 100).toLocaleString()} / ${(m.expense / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-income dark:text-green-400 w-10 shrink-0">In</span>
                        <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-income dark:bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(incomePct, 1)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-expense dark:text-red-400 w-10 shrink-0">Ex</span>
                        <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-expense dark:bg-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(expensePct, 1)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Entries</h2>
          </div>
          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="empty-state">
              <p className="text-gray-400 dark:text-gray-500">No entries yet. Create your first entry above.</p>
            </div>
          ) : (
            <div>
              {entries.slice(0, 5).map((e, i) => (
                <div
                  key={e.id}
                  className={`flex items-center justify-between px-6 py-3.5 ${
                    i < entries.slice(0, 5).length - 1 ? "border-b border-gray-50 dark:border-gray-800" : ""
                  } hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <span className={e.entry_type === "expense" ? "badge-expense" : "badge-income"}>
                      {e.entry_type}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{e.description || e.id.slice(0, 8)}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    ${(e.amount_minor / 100).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
