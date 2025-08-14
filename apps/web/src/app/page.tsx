import MarketingTopBar from "@/components/marketing/TopBar";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <MarketingTopBar />
      <section className="container pt-16 pb-12 grid gap-8 md:gap-12 md:grid-cols-2 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">Where Deals Flow Seamlessly</h1>
          <p className="text-base text-[var(--muted-foreground)] mb-6">Rivor turns inbox chaos into action—AI summaries, pipeline, calendar, and analytics, all in one secure workspace.</p>
          <div className="flex gap-3">
            <Link href="/auth/signin" className="px-4 py-2 rounded-md brand-gradient text-white">Get Started</Link>
            <Link href="/demo" className="px-4 py-2 rounded-md border border-[var(--border)]">See Demo</Link>
          </div>
        </div>
        <div className="relative aspect-[16/11] rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--muted)]">
          <div className="absolute inset-0 wave-gradient opacity-60" />
          <div className="absolute inset-0 grid place-items-center text-sm text-[var(--muted-foreground)]">emails → pipeline → calendar</div>
        </div>
      </section>

      <section className="container py-10">
        <div className="opacity-80 text-xs mb-3">Trusted by teams</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 opacity-70">
          <div className="h-10 rounded-md bg-[var(--muted)] border border-[var(--border)]" />
          <div className="h-10 rounded-md bg-[var(--muted)] border border-[var(--border)]" />
          <div className="h-10 rounded-md bg-[var(--muted)] border border-[var(--border)]" />
          <div className="h-10 rounded-md bg-[var(--muted)] border border-[var(--border)]" />
        </div>
      </section>

      <section className="container py-12 grid gap-6 md:grid-cols-3">
        {["Connect", "Summarize", "Close"].map((step) => (
          <div key={step} className="card p-5">
            <div className="text-lg font-medium mb-1">{step}</div>
            <p className="text-sm text-[var(--muted-foreground)]">{step === "Connect" ? "Link Gmail/Outlook and Calendar with least-privilege scopes." : step === "Summarize" ? "AI distills threads to key points and next steps." : "Move deals through pipeline with clarity."}</p>
          </div>
        ))}
      </section>

      <section className="container py-12 grid gap-4 md:grid-cols-3">
        {["Inbox AI", "Calendar AI", "Pipeline", "Tasks", "Analytics"].map((feat) => (
          <div key={feat} className="card p-5">
            <div className="text-base font-medium mb-1">{feat}</div>
            <p className="text-sm text-[var(--muted-foreground)]">Short description of {feat.toLowerCase()}.</p>
          </div>
        ))}
      </section>

      <section className="container py-12">
        <div className="card p-5 grid gap-2 sm:grid-cols-3">
          <div>
            <div className="text-sm font-medium">KMS Encryption</div>
            <p className="text-sm text-[var(--muted-foreground)]">Per-org DEKs, rotated with a managed KMS.</p>
          </div>
          <div>
            <div className="text-sm font-medium">Least-Privilege Scopes</div>
            <p className="text-sm text-[var(--muted-foreground)]">Only what’s required to deliver features.</p>
          </div>
          <div>
            <div className="text-sm font-medium">SOC2-Ready</div>
            <p className="text-sm text-[var(--muted-foreground)]">Controls and auditability built-in.</p>
          </div>
        </div>
      </section>

      <section className="py-16 wave-gradient">
        <div className="container text-center">
          <div className="text-2xl font-semibold mb-3">Start closing more deals with Rivor</div>
          <Link href="/auth/signin" className="inline-block px-4 py-2 rounded-md bg-white text-black">Sign up</Link>
        </div>
      </section>
    </div>
  );
}
