"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Send, Bot, User, Loader2 } from "lucide-react";

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
      msg, convId,
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
      () => { setLoading(false); onUpdate?.(); },
    );
  };

  return (
    <div className="flex flex-col h-[600px] card overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-12 h-12 text-primary-200 mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm max-w-sm">
              Ask me anything about your finances &mdash; add an entry, generate a report, run an audit.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              m.role === "user" ? "bg-primary-100 dark:bg-primary-900/30" : "bg-gray-100 dark:bg-gray-800"
            }`}>
              {m.role === "user"
                ? <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                : <Bot className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              }
            </div>
            <div className={`rounded-xl px-4 py-2.5 max-w-[75%] whitespace-pre-wrap text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-primary-600 text-white rounded-tr-sm"
                : "bg-gray-100 text-gray-800 rounded-tl-sm dark:bg-gray-800 dark:text-gray-200"
            }`}>
              {m.content || (loading && i === messages.length - 1 ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : null)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-900">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type your message..."
            className="input-field flex-1"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="btn-primary !px-3 inline-flex items-center justify-center disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
