import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Accounting AI — Smart Finance Assistant",
  description: "AI-powered accounting & finance assistant",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans">
        <AuthProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 md:ml-64 min-h-screen pt-16 md:pt-0">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
