"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import { EntryForm } from "@/components/EntryForm";
import type { Category } from "@/types";

export default function NewEntryPage() {
  const { ready } = useAuthGuard();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    api.listCategories().then(setCategories).catch(() => {});
  }, [ready]);

  const handleSubmit = async (data: {
    entry_type: string;
    category_id: string;
    amount: number;
    entry_date: string;
    description: string;
    contact_name?: string | null;
    contact_type?: string | null;
    recurring?: boolean;
    recurring_frequency?: string;
    recurring_end_date?: string;
  }) => {
    setLoading(true);
    await api.createEntry(data);
    if (data.recurring) {
      await api.createRecurringEntry({
        category_id: data.category_id,
        entry_type: data.entry_type,
        amount: data.amount,
        description: data.description || null,
        frequency: data.recurring_frequency || "monthly",
        end_date: data.recurring_end_date || null,
        next_run_date: data.entry_date,
      });
    }
    router.push("/entries");
  };

  if (!ready) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New Entry</h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Record a new income or expense transaction</p>
      </div>
      <EntryForm categories={categories} onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
