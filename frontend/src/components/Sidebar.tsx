"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Entries", href: "/entries" },
  { label: "Categories", href: "/categories" },
  { label: "Reports", href: "/reports" },
  { label: "Audit", href: "/audit" },
  { label: "Chat", href: "/chat" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
      <Link href="/dashboard" className="text-xl font-bold text-blue-600 mb-8">
        Accounting AI
      </Link>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={logout}
        className="text-sm text-gray-500 hover:text-red-600 text-left mt-4"
      >
        Logout
      </button>
    </aside>
  );
}
