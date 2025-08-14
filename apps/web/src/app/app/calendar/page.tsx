"use client";
import AppShell from "@/components/app/AppShell";
import { useState } from "react";

type View = "month" | "week" | "day" | "agenda";

export default function CalendarPage() {
  const [view, setView] = useState<View>("week");
  const [open, setOpen] = useState(false);
  return (
    <AppShell>
      <div className="p-3 grid gap-3 md:grid-cols-[1fr_280px]">
        <section className="card p-3">
          <div className="flex items-center gap-2 mb-2 text-sm">
            {(["month","week","day","agenda"] as View[]).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-2 py-1 rounded border border-[var(--border)] ${view===v? 'bg-[var(--background)]':''}`}>{v}</button>
            ))}
            <button onClick={() => setOpen(true)} className="ml-auto px-2 py-1 rounded border border-[var(--border)]">Create event</button>
          </div>
          <div className="border border-[var(--border)] rounded h-[520px] grid place-items-center text-sm text-[var(--muted-foreground)]">{view} view</div>
        </section>
        <aside className="card p-3">
          <div className="text-sm font-medium mb-2">Upcoming</div>
          <div className="text-sm text-[var(--muted-foreground)]">Smart slots, suggestions…</div>
        </aside>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
          <div className="w-full max-w-md card p-4">
            <div className="text-base font-medium mb-2">Create event</div>
            <div className="space-y-2">
              <input className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--muted)]" placeholder="Title" />
              <input className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--muted)]" placeholder="Attendees" />
              <input className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--muted)]" placeholder="Location" />
              <textarea className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--muted)]" placeholder="Notes" />
              <div className="text-xs text-[var(--muted-foreground)]">AI can propose a title/description.</div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-2 rounded border border-[var(--border)]">Cancel</button>
              <button className="px-3 py-2 rounded brand-gradient text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}


