"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ConversationSummary } from "@/types";
import { MessageSquare, Plus, Trash2, History } from "lucide-react";

interface Props {
  activeId: string | null;
  onNew: () => void;
  onSelect: (c: ConversationSummary) => void;
  refreshKey: number;
}

export function ChatHistory({ activeId, onNew, onSelect, refreshKey }: Props) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  useEffect(() => {
    api.listConversations().then(setConversations).catch(() => {});
  }, [refreshKey]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={onNew}
          className="w-full btn-primary inline-flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Chat
        </button>
      </div>

      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 dark:text-gray-500">
          <History className="w-3.5 h-3.5" /> History
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center mt-8">No conversations yet</p>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors ${
              activeId === c.id
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            <MessageSquare className={`w-4 h-4 shrink-0 ${activeId === c.id ? "text-primary-500 dark:text-primary-400" : "text-gray-400 dark:text-gray-500"}`} />
            <span className="truncate flex-1">{c.title}</span>
            <button
              onClick={(e) => handleDelete(c.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
