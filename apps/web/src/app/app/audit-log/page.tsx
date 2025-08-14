import AppShell from "@/components/app/AppShell";

export default function AuditLogPage() {
  return (
    <AppShell>
      <div className="container py-4">
        <div className="flex flex-wrap gap-2 text-sm mb-3">
          <input placeholder="Actor" className="px-2 py-1 rounded border border-[var(--border)] bg-[var(--muted)]" />
          <input placeholder="Action" className="px-2 py-1 rounded border border-[var(--border)] bg-[var(--muted)]" />
          <input placeholder="Date" className="px-2 py-1 rounded border border-[var(--border)] bg-[var(--muted)]" />
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr>
                {['timestamp','actor','action','resource','org/user id','reason','outcome','trace id'].map((h) => (
                  <th key={h} className="px-2 py-2 border-b border-[var(--border)] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  {['2024-01-01 12:00','user@org','decrypt','lead:123','org1/user1','export','allow','#trace'].map((c, j) => (
                    <td key={j} className="px-2 py-2">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}


