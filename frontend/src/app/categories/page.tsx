"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import type { Category } from "@/types";
import { Plus, Tags, ChevronRight, ChevronDown, FolderOpen, FileText } from "lucide-react";

function flattenCategories(cats: Category[]): Category[] {
  const result: Category[] = [];
  for (const c of cats) {
    result.push(c);
    result.push(...flattenCategories(c.children));
  }
  return result;
}

function CategoryRow({
  cat,
  depth,
  allFlat,
  onSelectParent,
}: {
  cat: Category;
  depth: number;
  allFlat: Category[];
  onSelectParent: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = cat.children.length > 0;

  return (
    <>
      <tr className="bg-white dark:bg-gray-900 hover:bg-primary-50/30 dark:hover:bg-primary-900/20 transition-colors">
        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 20}px` }}>
            {hasChildren ? (
              <button onClick={() => setExpanded(!expanded)} className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-5 inline-block" />
            )}
            {hasChildren ? (
              <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
            )}
            <span>{cat.name}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className={cat.type === "expense" ? "badge-expense" : cat.type === "income" ? "badge-income" : "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}>
            {cat.type}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <button
            onClick={() => onSelectParent(cat.id)}
            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            Add sub
          </button>
        </td>
      </tr>
      {expanded && hasChildren && cat.children.map((child) => (
        <CategoryRow key={child.id} cat={child} depth={depth + 1} allFlat={allFlat} onSelectParent={onSelectParent} />
      ))}
    </>
  );
}

export default function CategoriesPage() {
  const { ready } = useAuthGuard();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [parentId, setParentId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    api.listCategories().then(setCategories).catch(() => {});
  }, [ready]);

  if (!ready) return null;

  const allFlat = flattenCategories(categories);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.createCategory(name, type, parentId || undefined);
      setName("");
      setParentId(null);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chart of Accounts</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Hierarchical chart of accounts — assets, liabilities, equity, income, expenses</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="card p-5 mb-8 max-w-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 dark:text-gray-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cash"
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 dark:text-gray-400">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input-field"
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 dark:text-gray-400">Parent</label>
            <select
              value={parentId || ""}
              onChange={(e) => setParentId(e.target.value || null)}
              className="input-field"
            >
              <option value="">(top-level account)</option>
              {allFlat.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="submit" className="btn-primary inline-flex items-center gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> Add Account
          </button>
          {parentId && (
            <button type="button" onClick={() => setParentId(null)} className="btn-secondary text-xs">
              Clear parent
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="card"><div className="empty-state">No accounts yet. Create your first account above.</div></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <th className="table-header px-6 py-4">Name</th>
                <th className="table-header px-6 py-4">Type</th>
                <th className="table-header px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {categories.map((cat) => (
                <CategoryRow key={cat.id} cat={cat} depth={0} allFlat={allFlat} onSelectParent={(id) => setParentId(id)} />
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
