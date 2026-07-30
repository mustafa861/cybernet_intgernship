"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/auth";
import { EntryForm } from "@/components/EntryForm";
import type { Category, Entry, EntryCreate } from "@/types";

export default function EditEntryPage() {
  const { ready } = useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    api.listCategories().then(setCategories).catch(() => {});
    api.listEntries().then((entries) => {
      const found = entries.find((e) => e.id === params.id);
      if (found) setEntry(found);
    }).catch(() => {});
  }, [ready, params.id]);

  const handleSubmit = async (data: {
    entry_type: string;
    category_id: string;
    amount: number;
    entry_date: string;
    description: string;
  }) => {
    setLoading(true);
    await api.updateEntry(params.id as string, data as Partial<EntryCreate>);
    router.push("/entries");
  };

  if (!ready || !entry) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Entry</h1>
        <p className="text-sm text-gray-500 mt-1">Update this transaction record</p>
      </div>
      <EntryForm
        categories={categories}
        onSubmit={handleSubmit}
        initial={{
          entry_type: entry.entry_type,
          category_id: entry.category_id,
          amount: entry.amount_minor / 100,
          entry_date: entry.entry_date,
          description: entry.description || "",
          contact_name: entry.contact_name,
          contact_type: entry.contact_type,
        }}
        loading={loading}
      />
    </div>
  );
}
