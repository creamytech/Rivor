"use client";
import AppShell from "@/components/app/AppShell";
import { useState } from "react";

const tabs = ["Profile","Organization","Team","Integrations","Security & Privacy","Billing","Audit Log","Help"] as const;

export default function SettingsPage() {
  const [active, setActive] = useState<(typeof tabs)[number]>("Profile");
  return (
    <AppShell>
      <div className="container py-4">
        <nav className="flex gap-2 flex-wrap mb-3 text-sm">
          {tabs.map((t) => (
            <button key={t} onClick={() => setActive(t)} className={`px-2 py-1 rounded border border-[var(--border)] ${active===t?'bg-[var(--background)]':''}`}>{t}</button>
          ))}
        </nav>
        <div className="card p-4">
          {active === "Profile" && <div className="space-y-2"><input placeholder="Name" className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--muted)]" /><input placeholder="Timezone" className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--muted)]" /></div>}
          {active === "Organization" && <div className="space-y-2"><input placeholder="Org name" className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--muted)]" /></div>}
          {active === "Team" && <div className="space-y-2 text-sm">Members list, roles, invites, SSO readiness.</div>}
          {active === "Integrations" && <div className="space-y-2 text-sm">Email/Calendar/Webhooks scope explainer and reconnect buttons.</div>}
          {active === "Security & Privacy" && (
            <div className="space-y-3">
              <div className="border border-[var(--border)] rounded p-3">
                <div className="text-sm font-medium mb-1">Encryption</div>
                <div className="text-xs text-[var(--muted-foreground)] mb-2">KMS provider, per-org DEK status, last rotation.</div>
                <button className="px-2 py-1 rounded border border-[var(--border)] text-sm">Rotate key…</button>
              </div>
              <div className="border border-[var(--border)] rounded p-3">
                <div className="text-sm font-medium mb-1">Ephemeral mode</div>
                <button className="px-2 py-1 rounded border border-[var(--border)] text-sm">Enable…</button>
              </div>
              <div className="border border-[var(--border)] rounded p-3">
                <div className="text-sm font-medium mb-1">Retention</div>
                <select className="px-2 py-1 rounded border border-[var(--border)] bg-transparent"><option>30</option><option>90</option><option>365</option><option>custom</option></select>
                <div className="text-xs text-[var(--muted-foreground)]">Next purge date…</div>
              </div>
              <a href="/app/audit-log" className="text-sm underline">Audit log</a>
            </div>
          )}
          {active === "Billing" && <div className="text-sm">Plan, seats, usage, invoices, payment method.</div>}
          {active === "Audit Log" && <div className="text-sm">Quick link to audit log page.</div>}
          {active === "Help" && <div className="text-sm">Links to docs.</div>}
        </div>
      </div>
    </AppShell>
  );
}


