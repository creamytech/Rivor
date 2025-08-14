import AppShell from "@/components/app/AppShell";

export default function HelpPage() {
  return (
    <AppShell>
      <div className="container py-4 grid gap-3 md:grid-cols-[1fr_360px]">
        <section className="card p-3">
          <div className="text-base font-medium mb-2">Knowledge base</div>
          <ul className="text-sm list-disc pl-4 space-y-1">
            <li>Connect Email</li>
            <li>Pipeline templates</li>
            <li>Security and Encryption</li>
          </ul>
        </section>
        <aside className="card p-3">
          <div className="text-base font-medium mb-2">Contact</div>
          <form className="space-y-2">
            <input placeholder="Email" className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--muted)]" />
            <textarea placeholder="Message" className="w-full h-24 px-3 py-2 rounded border border-[var(--border)] bg-[var(--muted)]" />
            <button className="px-3 py-2 rounded brand-gradient text-white">Send</button>
          </form>
          <div className="mt-4 text-sm font-medium">What’s new</div>
          <div className="text-sm text-[var(--muted-foreground)]">Changelog feed…</div>
        </aside>
      </div>
    </AppShell>
  );
}


