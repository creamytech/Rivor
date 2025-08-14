"use client";
import MarketingTopBar from "@/components/marketing/TopBar";
import { useState } from "react";

export default function DemoPage() {
  const [step, setStep] = useState(0);
  const advance = () => setStep((s) => (s + 1) % 4);
  return (
    <div>
      <MarketingTopBar />
      <div className="container py-4">
        <div className="mb-3 text-xs text-[var(--muted-foreground)] card p-3">Sandbox data — no email access</div>
        <div className="grid md:grid-cols-[200px_1fr_360px] gap-3">
          <aside className="card p-3 space-y-2">
            {['Inbox','Calendar','Pipeline'].map((i) => (
              <button key={i} className="w-full text-left px-3 py-2 rounded hover:bg-[var(--background)]">{i}</button>
            ))}
          </aside>
          <section className="card p-3">
            <div className="text-sm mb-2">Inbox Preview</div>
            <div className="grid md:grid-cols-2 gap-2">
              <div className="border border-[var(--border)] rounded p-2 h-48">Threads list (fake)</div>
              <div className="border border-[var(--border)] rounded p-2 h-48">Thread content (fake)</div>
            </div>
            <button onClick={advance} className="mt-3 px-3 py-2 rounded-md brand-gradient text-white">Generate Summary</button>
            <div className="mt-3 text-sm text-[var(--muted-foreground)]">{["Thinking…", "Key points…", "Tasks…", "Next steps…"][step]}</div>
          </section>
          <aside className="card p-3">
            <div className="text-sm font-medium mb-2">AI Summary</div>
            <ul className="text-sm list-disc pl-4 space-y-1">
              <li>Key points</li>
              <li>Tasks</li>
              <li>Next steps</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}


