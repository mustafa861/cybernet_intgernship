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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select
          value={entryType}
          onChange={(e) => setEntryType(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Select category</option>
          {filtered.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Amount</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Entry"}
      </button>
    </form>
  );
}
