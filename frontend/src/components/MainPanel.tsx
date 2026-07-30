"use client";

import { useAuth } from "@/lib/auth";

export function MainPanel({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  return (
    <main
      className={`flex-1 p-4 sm:p-6 lg:p-8 min-h-screen pt-16 md:pt-0 transition-all duration-200 ${
        isAuthenticated ? "md:ml-64" : ""
      }`}
    >
      {children}
    </main>
  );
}
