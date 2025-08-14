import MarketingTopBar from "@/components/marketing/TopBar";

export default function TermsPage() {
  return (
    <div>
      <MarketingTopBar />
      <div className="container py-8 grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="card p-3 sticky top-16 h-max">
          <nav className="text-sm space-y-1">
            {['Terms','Acceptable Use','Liability','Governing Law'].map((s) => (
              <a key={s} className="block px-2 py-1 rounded hover:bg-[var(--background)]" href={`#${s.toLowerCase().replace(/\s+/g,'-')}`}>{s}</a>
            ))}
          </nav>
        </aside>
        <article className="prose prose-invert max-w-none">
          <h1>Terms of Service</h1>
          <p>Standard two-column legal layout with jump links.</p>
        </article>
      </div>
    </div>
  );
}


