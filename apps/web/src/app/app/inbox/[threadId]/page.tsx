import AppShell from "@/components/app/AppShell";

export default function ThreadPage() {
  const right = (
    <div className="p-3">
      <div className="text-sm font-medium mb-2">AI Summary</div>
      <ul className="text-sm list-disc pl-4 space-y-1">
        <li>Key points</li>
        <li>Tasks</li>
        <li>Next steps</li>
      </ul>
    </div>
  );
  return (
    <AppShell rightDrawer={right}>
      <div className="container py-4">
        <div className="text-xs mb-2">Inbox / Thread</div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-base font-medium">Thread Subject</div>
            <div className="text-xs text-[var(--muted-foreground)]">Stage • Priority • Owner • Next Step</div>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="px-2 py-1 rounded border border-[var(--border)]">Stage</span>
            <span className="px-2 py-1 rounded border border-[var(--border)]">Priority</span>
            <span className="px-2 py-1 rounded border border-[var(--border)]">Owner</span>
            <span className="px-2 py-1 rounded border border-[var(--border)]">Next Step</span>
          </div>
        </div>
        <div className="border border-[var(--border)] rounded p-3 min-h-80">Thread content…</div>
      </div>
    </AppShell>
  );
}


