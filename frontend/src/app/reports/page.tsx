import Link from "next/link";
import { Scale, ChartPie, FileSpreadsheet, Clock, ArrowRight } from "lucide-react";

const reports = [
  {
    href: "/reports/trial-balance",
    title: "Trial Balance",
    desc: "Category totals grouped by type",
    icon: Scale,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  },
  {
    href: "/reports/profit-loss",
    title: "Profit & Loss",
    desc: "Income, expenses, and net profit for a period",
    icon: ChartPie,
    color: "text-green-600 bg-green-50 dark:bg-green-900/20",
  },
  {
    href: "/reports/balance-sheet",
    title: "Balance Sheet",
    desc: "Assets, liabilities, and equity as of a date",
    icon: FileSpreadsheet,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
  },
  {
    href: "/reports/ageing",
    title: "Ageing Report",
    desc: "AR/AP overdue buckets by customer and vendor",
    icon: Clock,
    color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
  },
];

export default function ReportsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Financial statements and summaries</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.href}
              href={r.href}
              className="card-hover group p-6 block"
            >
              <div className={`w-12 h-12 rounded-lg ${r.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h2 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors dark:text-gray-100 dark:group-hover:text-primary-400">
                {r.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1.5 dark:text-gray-400">{r.desc}</p>
              <div className="flex items-center gap-1 mt-4 text-sm font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity dark:text-primary-400">
                View report <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
