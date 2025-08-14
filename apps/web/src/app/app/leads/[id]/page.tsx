import AppShell from "@/components/app/AppShell";

export default function LeadDetailPage() {
  const right = (
    <div className="p-3">
      <div className="text-sm font-medium mb-2">AI Recap</div>
      <div className="text-sm text-[var(--muted-foreground)]">Summary of lead context and next steps.</div>
    </div>
  );

  return (
    <AppShell rightDrawer={right}>
      <div className="container py-4">
        <header className="flex flex-wrap items-center gap-2 justify-between mb-3">
          <div>
            <div className="text-xl font-semibold">Lead Name</div>
            <div className="text-xs text-[var(--muted-foreground)]">Stage • Owner • Value • Tags</div>
          </div>
          <div className="flex gap-2 text-sm">
            <select className="px-2 py-1 rounded border border-[var(--border)] bg-transparent"><option>Stage</option></select>
            <span className="px-2 py-1 rounded border border-[var(--border)]">Owner</span>
            <span className="px-2 py-1 rounded border border-[var(--border)]">$ Value</span>
          </div>
        </header>
        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
          <div className="card p-3">
            <nav className="flex gap-3 text-sm border-b border-[var(--border)] mb-3 pb-2">
              {['Overview','Emails','Tasks','Notes','Files'].map((t) => (
                <button key={t} className="px-2 py-1 rounded hover:bg-[var(--background)]">{t}</button>
              ))}
            </nav>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="border border-[var(--border)] rounded p-2">Contact & property</div>
              <div className="border border-[var(--border)] rounded p-2">Activity timeline</div>
            </div>
          </div>
          <aside className="card p-3">
            <div className="text-sm font-medium mb-2">Linked items</div>
            <div className="text-sm text-[var(--muted-foreground)]">Threads, tasks, files…</div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}


