export default function ForbiddenPage() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="card p-6 text-center">
        <div className="text-base font-medium mb-1">You don’t have access</div>
        <div className="text-sm text-[var(--muted-foreground)] mb-3">Request access or switch accounts.</div>
        <button className="px-3 py-2 rounded border border-[var(--border)]">Request access</button>
      </div>
    </div>
  );
}


