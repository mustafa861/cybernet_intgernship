import Link from "next/link";

export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <div className="grid grid-cols-3 gap-4">
        <Link
          href="/reports/trial-balance"
          className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Trial Balance</h2>
          <p className="text-sm text-gray-500 mt-1">
            Category totals grouped by type
          </p>
        </Link>
        <Link
          href="/reports/profit-loss"
          className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Profit & Loss</h2>
          <p className="text-sm text-gray-500 mt-1">
            Income, expenses, and net profit for a period
          </p>
        </Link>
        <Link
          href="/reports/balance-sheet"
          className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Balance Sheet</h2>
          <p className="text-sm text-gray-500 mt-1">
            Assets, liabilities, and equity as of a date
          </p>
        </Link>
      </div>
    </div>
  );
}
