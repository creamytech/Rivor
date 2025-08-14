import MarketingTopBar from "@/components/marketing/TopBar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <MarketingTopBar />
      <div className="container py-8 grid gap-4 md:grid-cols-[240px_1fr]">
        <aside className="card p-3 sticky top-16 h-max">
          <nav className="text-sm space-y-1">
            {['Setup','OAuth Scopes','KMS','Webhooks','Limits','Changelog'].map((s) => (
              <a key={s} className="block px-2 py-1 rounded hover:bg-[var(--background)]" href={`#${s.toLowerCase().replace(/\s+/g,'-')}`}>{s}</a>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}


