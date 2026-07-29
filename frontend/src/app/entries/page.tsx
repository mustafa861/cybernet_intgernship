"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { Entry } from "@/types";
import { Plus, Pencil, Trash2, ArrowRightLeft } from "lucide-react";

export default function EntriesPage() {
  const { ready } = useAuthGuard();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    api.listEntries().then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }, [ready]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await api.deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  if (!ready) return null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entries</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your income and expense records</p>
        </div>
        <Link href="/entries/new" className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> New Entry
        </Link>
      </div>

      {loading ? (
        <div className="card"><div className="empty-state">Loading...</div></div>
      ) : entries.length === 0 ? (
        <div className="card"><div className="empty-state">No entries yet.</div></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="table-header px-6 py-4">Type</th>
                  <th className="table-header px-6 py-4">Amount</th>
                  <th className="table-header px-6 py-4">Date</th>
                  <th className="table-header px-6 py-4">Description</th>
                  <th className="table-header px-6 py-4">Source</th>
                  <th className="table-header px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e, i) => (
                  <tr key={e.id} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-primary-50/30 transition-colors`}>
                    <td className="px-6 py-4">
                      <span className={e.entry_type === "expense" ? "badge-expense" : "badge-income"}>
                        {e.entry_type === "expense" ? "Expense" : "Income"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ${(e.amount_minor / 100).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{e.entry_date}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{e.description || <span className="text-gray-300">&mdash;</span>}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {e.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/entries/${e.id}/edit`}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
