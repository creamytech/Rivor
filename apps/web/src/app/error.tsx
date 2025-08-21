"use client";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="card p-6 text-center">
        <div className="text-base font-medium mb-1">Something went wrong</div>
        <div className="text-sm text-[var(--muted-foreground)] mb-3">Please try again.</div>
        <button onClick={reset} className="px-3 py-2 rounded border border-[var(--border)]">Retry</button>
      </div>
    </div>
  );
}


