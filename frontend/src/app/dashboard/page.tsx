"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import type { Entry } from "@/types";

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    api.listEntries().then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const totalExpenses = entries
    .filter((e) => e.entry_type === "expense")
    .reduce((s, e) => s + e.amount_minor, 0);
  const totalIncome = entries
    .filter((e) => e.entry_type === "income")
    .reduce((s, e) => s + e.amount_minor, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Income</p>
          <p className="text-xl font-bold text-green-600">
            {(totalIncome / 100).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-xl font-bold text-red-600">
            {(totalExpenses / 100).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Net</p>
          <p className="text-xl font-bold text-blue-600">
            {((totalIncome - totalExpenses) / 100).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex gap-3 mb-6">
        <Link
          href="/entries/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          New Entry
        </Link>
        <Link
          href="/chat"
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          AI Chat
        </Link>
      </div>
      <h2 className="text-lg font-semibold mb-3">Recent Entries</h2>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-400">No entries yet.</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          {entries.slice(0, 5).map((e) => (
            <div key={e.id} className="flex justify-between px-4 py-3 border-b last:border-0">
              <div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    e.entry_type === "expense"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {e.entry_type}
                </span>
                <span className="ml-2 text-sm text-gray-600">
                  {e.description || e.id.slice(0, 8)}
                </span>
              </div>
              <span className="font-medium">
                {(e.amount_minor / 100).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
