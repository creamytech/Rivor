import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="card p-6 text-center">
        <div className="text-base font-medium mb-1">Page not found</div>
        <div className="text-sm text-[var(--muted-foreground)] mb-3">Let’s get you back on track.</div>
        <Link href="/" className="px-3 py-2 rounded border border-[var(--border)]">Go home</Link>
      </div>
    </div>
  );
}


