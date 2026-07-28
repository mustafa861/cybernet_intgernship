"use client";

import { useEffect, useState } from "react";
import { useAuthGuard } from "@/lib/auth";
import { ChatWidget } from "@/components/ChatWidget";
import { ChatHistory } from "@/components/ChatHistory";
import type { ConversationSummary } from "@/types";
import { api } from "@/lib/api";

export default function ChatPage() {
  const { ready } = useAuthGuard();
  const [convId, setConvId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!ready) return null;

  const handleNewChat = () => {
    setConvId(null);
    setSidebarOpen(false);
  };

  const handleSelectChat = (c: ConversationSummary) => {
    setConvId(c.id);
    setSidebarOpen(false);
  };

  const handleChatUpdate = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4">
      <div className="hidden md:block w-72 shrink-0">
        <ChatHistory
          activeId={convId}
          onNew={handleNewChat}
          onSelect={handleSelectChat}
          refreshKey={refreshKey}
        />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-lg">
            <ChatHistory
              activeId={convId}
              onNew={handleNewChat}
              onSelect={handleSelectChat}
              refreshKey={refreshKey}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">AI Assistant</h1>
        </div>
        <h1 className="text-2xl font-bold mb-4 hidden md:block">AI Assistant</h1>
        <ChatWidget
          key={convId || "new"}
          conversationId={convId}
          onUpdate={handleChatUpdate}
        />
      </div>
    </div>
  );
}
