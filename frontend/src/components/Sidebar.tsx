"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, ArrowRightLeft, Tags, FileBarChart, ShieldCheck,
  MessageSquareText, LogOut, ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Entries", href: "/entries", icon: ArrowRightLeft },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Reports", href: "/reports", icon: FileBarChart },
  { label: "Audit", href: "/audit", icon: ShieldCheck },
  { label: "Chat", href: "/chat", icon: MessageSquareText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-30">
      <div className="p-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="text-lg font-bold text-gray-900">Accounting AI</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-primary-50 text-primary-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-primary-600" : "text-gray-400"}`} />
              <span>{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 ml-auto text-primary-400" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
