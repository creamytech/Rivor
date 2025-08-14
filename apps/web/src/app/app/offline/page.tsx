export default function OfflinePage() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="card p-6 text-center">
        <div className="text-base font-medium mb-1">You’re offline</div>
        <div className="text-sm text-[var(--muted-foreground)] mb-3">Showing cached items. Reconnect to sync.</div>
        <button className="px-3 py-2 rounded border border-[var(--border)]">Retry</button>
      </div>
    </div>
  );
}


