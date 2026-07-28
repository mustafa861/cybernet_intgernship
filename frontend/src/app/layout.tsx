import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Accounting Assistant",
  description: "AI-powered accounting & finance assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-6 ml-64">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
