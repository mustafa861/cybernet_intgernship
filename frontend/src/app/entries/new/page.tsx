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
  }) => {
    setLoading(true);
    await api.createEntry(data);
    router.push("/entries");
  };

  if (!ready) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Entry</h1>
      <EntryForm categories={categories} onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
