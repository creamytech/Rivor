import MarketingTopBar from "@/components/marketing/TopBar";

export default function SecurityPage() {
  return (
    <div>
      <MarketingTopBar />
      <section className="container py-10 space-y-4">
        <h1 className="text-3xl font-semibold">Security</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-5">
            <div className="text-lg font-medium mb-2">Data encryption</div>
            <p className="text-sm text-[var(--muted-foreground)]">Per-org DEKs via KMS; envelope encryption; in-transit TLS 1.2+.</p>
          </div>
          <div className="card p-5">
            <div className="text-lg font-medium mb-2">Retention / Ephemeral</div>
            <p className="text-sm text-[var(--muted-foreground)]">Configurable retention; ephemeral processing when enabled.</p>
          </div>
          <div className="card p-5">
            <div className="text-lg font-medium mb-2">Audit logging</div>
            <p className="text-sm text-[var(--muted-foreground)]">Actor/action/resource with reasons for decrypt/export.</p>
          </div>
          <div className="card p-5">
            <div className="text-lg font-medium mb-2">Scopes</div>
            <p className="text-sm text-[var(--muted-foreground)]">Least-privilege OAuth scopes for Email/Calendar.</p>
          </div>
        </div>
        <div className="text-sm">Contact <a className="underline" href="mailto:security@rivor.app">security@rivor.app</a></div>
      </section>
    </div>
  );
}


