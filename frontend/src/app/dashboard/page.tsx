"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { Entry } from "@/types";
import { TrendingUp, TrendingDown, PiggyBank, Plus, Bot } from "lucide-react";

export default function DashboardPage() {
  const { ready } = useAuthGuard();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    api.listEntries().then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }, [ready]);

  if (!ready) return null;

  const totalExpenses = entries
    .filter((e) => e.entry_type === "expense")
    .reduce((s, e) => s + e.amount_minor, 0);
  const totalIncome = entries
    .filter((e) => e.entry_type === "income")
    .reduce((s, e) => s + e.amount_minor, 0);
  const net = totalIncome - totalExpenses;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Your financial overview at a glance</p>
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
          <div className="w-12 h-12 rounded-lg bg-income-light flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-income" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Income</p>
            <p className="text-2xl font-bold text-income-dark mt-0.5">
              ${(totalIncome / 100).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-lg bg-expense-light flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6 text-expense" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-expense mt-0.5">
              ${(totalExpenses / 100).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
            <PiggyBank className={`w-6 h-6 ${net >= 0 ? "text-income" : "text-expense"}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Net</p>
            <p className={`text-2xl font-bold mt-0.5 ${net >= 0 ? "text-income-dark" : "text-expense"}`}>
              ${(net / 100).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Entries</h2>
        </div>
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <p className="text-gray-400">No entries yet. Create your first entry above.</p>
          </div>
        ) : (
          <div>
            {entries.slice(0, 5).map((e, i) => (
              <div
                key={e.id}
                className={`flex items-center justify-between px-6 py-3.5 ${
                  i < entries.slice(0, 5).length - 1 ? "border-b border-gray-50" : ""
                } hover:bg-gray-50 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <span className={e.entry_type === "expense" ? "badge-expense" : "badge-income"}>
                    {e.entry_type}
                  </span>
                  <span className="text-sm text-gray-600">{e.description || e.id.slice(0, 8)}</span>
                </div>
                <span className="font-semibold text-gray-900">
                  ${(e.amount_minor / 100).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
