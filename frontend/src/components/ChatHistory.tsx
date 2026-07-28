"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ConversationSummary } from "@/types";

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
    } catch {
      // silently fail
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 p-3">
      <button
        onClick={onNew}
        className="w-full mb-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm font-medium"
      >
        + New Chat
      </button>

      <div className="flex-1 overflow-y-auto space-y-1">
        {conversations.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-8">No conversations yet</p>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c)}
            className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm ${
              activeId === c.id
                ? "bg-blue-100 text-blue-800"
                : "hover:bg-gray-100 text-gray-800"
            }`}
          >
            <span className="truncate flex-1">{c.title}</span>
            <button
              onClick={(e) => handleDelete(c.id, e)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
