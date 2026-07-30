"use client";

import { Download, FileText } from "lucide-react";

interface Column {
  header: string;
  key: string;
}

interface Props {
  filename: string;
  title: string;
  columns: Column[];
  rows: Record<string, string | number | null | undefined>[];
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes("\"") || val.includes("\n")) {
    return `"${val.replace(/"/g, "\"\"")}"`;
  }
  return val;
}

function downloadCSV(filename: string, columns: Column[], rows: Record<string, string | number | null | undefined>[]) {
  const header = columns.map((c) => csvEscape(c.header)).join(",");
  const data = rows.map((r) =>
    columns.map((c) => csvEscape(String(r[c.key] ?? ""))).join(",")
  );
  const csv = [header, ...data].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(title: string, columns: Column[], rows: Record<string, string | number | null | undefined>[]) {
  const rowsHtml = rows
    .map(
      (r) =>
        `<tr>${columns.map((c) => `<td>${String(r[c.key] ?? "")}</td>`).join("")}</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #111; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; border-bottom: 2px solid #e5e7eb; }
    td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    tr:last-child td { border-bottom: none; }
    .total-row td { font-weight: 700; border-top: 2px solid #111; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="subtitle">Generated on ${new Date().toLocaleDateString()}</p>
  <table>
    <thead><tr>${columns.map((c) => `<th>${c.header}</th>`).join("")}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

export function ExportButtons({ filename, title, columns, rows }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => downloadCSV(filename, columns, rows)}
        className="btn-secondary inline-flex items-center gap-1.5 text-sm"
      >
        <Download className="w-4 h-4" /> CSV
      </button>
      <button
        onClick={() => downloadPDF(title, columns, rows)}
        className="btn-secondary inline-flex items-center gap-1.5 text-sm"
      >
        <FileText className="w-4 h-4" /> PDF
      </button>
    </div>
  );
}
