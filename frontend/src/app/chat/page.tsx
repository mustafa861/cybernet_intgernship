"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { ChatWidget } from "@/components/ChatWidget";

export default function ChatPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) { router.push("/login"); return null; }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">AI Assistant</h1>
      <ChatWidget />
    </div>
  );
}
