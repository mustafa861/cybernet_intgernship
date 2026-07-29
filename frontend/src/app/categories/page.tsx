"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { Category } from "@/types";
import { Plus, Tags } from "lucide-react";

export default function CategoriesPage() {
  const { ready } = useAuthGuard();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    api.listCategories().then(setCategories).catch(() => {});
  }, [ready]);

  if (!ready) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.createCategory(name, type);
      setName("");
      setCategories(await api.listCategories());
    } catch (err: unknown) {
      const e = err as { error?: { message?: string } };
      setError(e?.error?.message || "Failed to create category");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Organize your income and expense types</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="card p-5 mb-8 max-w-lg flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Office Supplies"
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input-field"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <button type="submit" className="btn-primary inline-flex items-center gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="card"><div className="empty-state">No categories yet. Create one above.</div></div>
      ) : (
        <div className="card overflow-hidden max-w-lg">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="table-header px-6 py-4">Name</th>
                <th className="table-header px-6 py-4">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((c, i) => (
                <tr key={c.id} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-primary-50/30 transition-colors`}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4">
                    <span className={c.type === "expense" ? "badge-expense" : "badge-income"}>
                      {c.type}
                    </span>
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
