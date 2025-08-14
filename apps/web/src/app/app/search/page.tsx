"use client";
import AppShell from "@/components/app/AppShell";
import { useState } from "react";

export default function SearchPage() {
  const [q, setQ] = useState("");
  return (
    <AppShell>
      <div className="container py-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search everything" className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--muted)]" />
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          {['Threads','Leads','Tasks','Events'].map((seg) => (
            <div key={seg} className="card p-3">
              <div className="text-sm font-medium mb-1">{seg}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Results with redacted snippets and sanitized tokens.</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}


