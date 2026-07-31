"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { Entry } from "@/types";
import { Plus, Pencil, Trash2, ArrowRightLeft, RefreshCw, Paperclip } from "lucide-react";

export default function EntriesPage() {
  const { ready } = useAuthGuard();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processMsg, setProcessMsg] = useState("");

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Entries</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Manage your income and expense records</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href="/entries/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Entry
          </Link>
          <button
            onClick={async () => {
              setProcessing(true);
              setProcessMsg("");
              try {
                const res = await api.processRecurringEntries();
                if (res.entries_created > 0) {
                  setProcessMsg(`Created ${res.entries_created} recurring entry/entries`);
                  setEntries(await api.listEntries());
                } else {
                  setProcessMsg("No recurring entries due");
                }
              } catch {}
              setProcessing(false);
            }}
            disabled={processing}
            className="btn-secondary inline-flex items-center gap-1.5 text-sm"
            title="Process due recurring entries"
          >
            <RefreshCw className={`w-4 h-4 ${processing ? "animate-spin" : ""}`} />
            Recurring
          </button>
        </div>
      </div>

      {processMsg && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
          {processMsg}
        </div>
      )}

      {loading ? (
        <div className="card"><div className="empty-state">Loading...</div></div>
      ) : entries.length === 0 ? (
        <div className="card"><div className="empty-state">No entries yet.</div></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
                  <th className="table-header px-6 py-4">Type</th>
                  <th className="table-header px-6 py-4">Amount</th>
                  <th className="table-header px-6 py-4">Date</th>
                  <th className="table-header px-6 py-4">Description</th>
                  <th className="table-header px-6 py-4">Contact</th>
                  <th className="table-header px-6 py-4">Source</th>
                  <th className="table-header px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {entries.map((e, i) => (
                  <tr key={e.id} className={`${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"} hover:bg-primary-50/30 dark:hover:bg-primary-900/20 transition-colors`}>
                    <td className="px-6 py-4">
                      <span className={e.entry_type === "expense" ? "badge-expense" : e.entry_type === "income" ? "badge-income" : "badge-neutral"}>
                        {e.entry_type.charAt(0).toUpperCase() + e.entry_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                      ${(e.amount_minor / 100).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{e.entry_date}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        {e.attachment_url && (
                          <a href={e.attachment_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300" title="View attachment">
                            <Paperclip className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <span>{e.description || <span className="text-gray-300 dark:text-gray-600">&mdash;</span>}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {e.contact_name ? (
                        <span className="inline-flex items-center gap-1">
                          {e.contact_name}
                          {e.contact_type && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              e.contact_type === "customer" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                            }`}>
                              {e.contact_type}
                            </span>
                          )}
                        </span>
                      ) : <span className="text-gray-300 dark:text-gray-600">&mdash;</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
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
