"use client";
import AppShell from "@/components/app/AppShell";

function exportCsv() {
  const data = [
    ["metric","value"],
    ["emails_sent","42"],
    ["replies","18"],
  ];
  const csv = data.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rivor-analytics.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  return (
    <AppShell>
      <div className="container py-4">
        <div className="flex flex-wrap gap-2 text-sm mb-3">
          <select className="px-2 py-1 rounded border border-[var(--border)] bg-transparent"><option>Last 7 days</option></select>
          <select className="px-2 py-1 rounded border border-[var(--border)] bg-transparent"><option>Owner: All</option></select>
          <select className="px-2 py-1 rounded border border-[var(--border)] bg-transparent"><option>Source: All</option></select>
          <button onClick={exportCsv} className="ml-auto px-2 py-1 rounded border border-[var(--border)]">Export CSV</button>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="card p-3">
            <div className="text-sm font-medium mb-2">Weekly activity</div>
            <div className="h-40 border border-[var(--border)] rounded grid place-items-center text-xs text-[var(--muted-foreground)]">Chart</div>
          </div>
          <div className="card p-3">
            <div className="text-sm font-medium mb-2">Lead sources</div>
            <div className="h-40 border border-[var(--border)] rounded grid place-items-center text-xs text-[var(--muted-foreground)]">Chart</div>
          </div>
          <div className="card p-3">
            <div className="text-sm font-medium mb-2">Response time</div>
            <div className="h-40 border border-[var(--border)] rounded grid place-items-center text-xs text-[var(--muted-foreground)]">Chart</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}


