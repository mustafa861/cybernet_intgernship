"use client";

import { useEffect, useState } from "react";
import { useAuthGuard } from "@/lib/auth";
import { ChatWidget } from "@/components/ChatWidget";
import { ChatHistory } from "@/components/ChatHistory";
import type { ConversationSummary } from "@/types";
import { api } from "@/lib/api";
import { Menu, MessageSquareText } from "lucide-react";

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
    <div className="flex h-[calc(100vh-4rem)] gap-0 -m-8">
      <div className="hidden md:block w-72 shrink-0 border-r border-gray-200">
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
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            <ChatHistory
              activeId={convId}
              onNew={handleNewChat}
              onSelect={handleSelectChat}
              refreshKey={refreshKey}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-primary-600" />
            <h1 className="text-lg font-bold text-gray-900">AI Assistant</h1>
          </div>
        </div>
        <div className="flex-1 p-6">
          <ChatWidget
            key={convId || "new"}
            conversationId={convId}
            onUpdate={handleChatUpdate}
          />
        </div>
      </div>
    </div>
  );
}
