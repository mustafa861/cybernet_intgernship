"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";

interface Props {
  conversationId?: string | null;
  onUpdate?: () => void;
}

export function ChatWidget({ conversationId, onUpdate }: Props) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(conversationId || null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      setConvId(conversationId);
      api.getConversation(conversationId).then((data) => {
        setMessages(data.messages.map((m) => ({ role: m.role, content: m.content })));
      }).catch(() => {});
    } else {
      setConvId(null);
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const msg = input;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: msg },
      { role: "assistant", content: "" },
    ]);
    setLoading(true);
    api.chatStream(
      msg,
      convId,
      (token) => {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: last.content + token };
          }
          return copy;
        });
      },
      (newConvId) => setConvId(newConvId),
      () => {
        setLoading(false);
        onUpdate?.();
      },
    );
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm">
            Ask me anything about your finances — add an entry, generate a report, run an audit.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-blue-600 text-white ml-auto"
                : "bg-gray-100 text-gray-900"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="text-gray-400 text-sm">Thinking...</div>}
        <div ref={bottomRef} />
      </div>
      <div className="border-t p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
          className="flex-1 border rounded-md px-3 py-2 text-sm"
        />
        <button
          onClick={send}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
