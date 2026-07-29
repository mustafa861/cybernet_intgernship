"use client";

import { useState } from "react";
import type { Category } from "@/types";

interface Props {
  categories: Category[];
  onSubmit: (data: {
    entry_type: string;
    category_id: string;
    amount: number;
    entry_date: string;
    description: string;
  }) => Promise<void>;
  initial?: {
    entry_type: string;
    category_id: string;
    amount: number;
    entry_date: string;
    description: string;
  };
  loading?: boolean;
}

export function EntryForm({ categories, onSubmit, initial, loading }: Props) {
  const [entryType, setEntryType] = useState(initial?.entry_type || "expense");
  const [categoryId, setCategoryId] = useState(initial?.category_id || "");
  const [amount, setAmount] = useState(initial?.amount?.toString() || "");
  const [entryDate, setEntryDate] = useState(initial?.entry_date || "");
  const [description, setDescription] = useState(initial?.description || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      entry_type: entryType,
      category_id: categoryId,
      amount: parseFloat(amount),
      entry_date: entryDate,
      description,
    });
  };

  const filtered = categories.filter((c) => {
    if (entryType === "expense") return c.type === "expense";
    if (entryType === "income") return c.type === "income";
    return true;
  });

  return (
    <form onSubmit={handleSubmit} className="card p-6 max-w-lg space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => setEntryType("expense")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                entryType === "expense"
                  ? "bg-expense text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setEntryType("income")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                entryType === "income"
                  ? "bg-income text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Income
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="input-field pl-7"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="input-field"
        >
          <option value="">Select a category</option>
          {filtered.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            placeholder="Optional note"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : "Save Entry"}
        </button>
        <button type="button" onClick={() => window.history.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
