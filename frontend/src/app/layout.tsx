import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { Sidebar } from "@/components/Sidebar";
import { MainPanel } from "@/components/MainPanel";

export const metadata: Metadata = {
  title: "Accounting AI — Smart Finance Assistant",
  description: "AI-powered accounting & finance assistant",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
        <ThemeProvider>
          <AuthProvider>
            <div className="flex">
              <Sidebar />
              <MainPanel>{children}</MainPanel>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
