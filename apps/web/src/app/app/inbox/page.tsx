"use client";
import AppShell from "@/components/app/AppShell";
import { Loading, Empty, ErrorState } from "@/components/common/States";
import { useEffect, useMemo, useState } from "react";

type Thread = { id: string; subject: string; date: string; unread?: boolean };

export default function InboxPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const indexById = useMemo(() => new Map(threads.map((t, i) => [t.id, i])), [threads]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (loading || error) return;
      if (["j","k","e","r","s"].includes(e.key)) e.preventDefault();
      if (e.key === "j") {
        const i = selectedId ? (indexById.get(selectedId) ?? -1) : -1;
        const next = threads[Math.min(i + 1, threads.length - 1)];
        if (next) setSelectedId(next.id);
      } else if (e.key === "k") {
        const i = selectedId ? (indexById.get(selectedId) ?? threads.length) : threads.length;
        const prev = threads[Math.max(i - 1, 0)];
        if (prev) setSelectedId(prev.id);
      } else if (e.key === "e") {
        // archive
        if (selectedId) setThreads((ts) => ts.filter((t) => t.id !== selectedId));
      } else if (e.key === "r") {
        // reply focus placeholder
        const area = document.querySelector<HTMLTextAreaElement>("textarea");
        area?.focus();
      } else if (e.key === "s") {
        // snooze
        // simulate by moving item to end
        if (selectedId) setThreads((ts) => {
          const i = ts.findIndex((t) => t.id === selectedId);
          if (i === -1) return ts;
          const copy = ts.slice();
          const [item] = copy.splice(i, 1);
          copy.push(item);
          return copy;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, error, selectedId, threads, indexById]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/inbox/threads');
        if (!res.ok) throw new Error('load');
        const json = await res.json();
        if (cancelled) return;
        const rows = (json.threads as any[]).map((t) => ({ id: t.id, subject: t.subject || t.participants || '(no subject)', date: new Date(t.updatedAt).toLocaleDateString() }));
        setThreads(rows);
        setLoading(false);
      } catch (e) {
        if (!cancelled) { setError('Failed to load'); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const right = (
    <div className="p-3">
      <div className="text-sm font-medium mb-2">AI Summary</div>
      {loading ? <Loading lines={6} /> : threads.length === 0 ? <Empty title="All clear — let Rivor watch for new deals." /> : (
        <ul className="text-sm list-disc pl-4 space-y-1">
          <li>Key points</li>
          <li>Tasks</li>
          <li>Next steps</li>
        </ul>
      )}
      <div className="mt-4 text-sm font-medium mb-2">Suggested Replies</div>
      <div className="flex gap-2 text-xs">
        <button className="px-2 py-1 rounded border border-[var(--border)]">Short</button>
        <button className="px-2 py-1 rounded border border-[var(--border)]">Neutral</button>
        <button className="px-2 py-1 rounded border border-[var(--border)]">Warm</button>
      </div>
    </div>
  );

  return (
    <AppShell rightDrawer={right}>
      <div className="grid md:grid-cols-[280px_1fr] h-[calc(100vh-56px)]">
        <aside className="border-r border-[var(--border)] p-3 overflow-auto">
          <div className="mb-2 flex gap-2 text-sm">
            {['All','Unread','Action Needed','Waiting','FYI'].map((f) => (
              <button key={f} className="px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--muted)]">{f}</button>
            ))}
          </div>
          <input placeholder="Search" className="w-full mb-2 px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--muted)] text-sm" />
          {selectedIds.length > 0 && (
            <div className="mb-2 flex items-center gap-2 text-xs">
              <div>{selectedIds.length} selected</div>
              <button onClick={() => { setThreads((ts)=> ts.filter(t=>!selectedIds.includes(t.id))); setSelectedIds([]); }} className="px-2 py-1 rounded border border-[var(--border)]">Archive</button>
              <button onClick={() => setSelectedIds([])} className="px-2 py-1 rounded border border-[var(--border)]">Clear</button>
            </div>
          )}
          {loading && <Loading />}
          {error && <ErrorState title="Unable to load inbox" action={<button className="px-2 py-1 rounded border border-[var(--border)]">Retry</button>} />}
          {!loading && !error && threads.length === 0 && (
            <Empty title="All clear — let Rivor watch for new deals." />
          )}
          {!loading && !error && threads.map((t) => (
            <label key={t.id} className={`group w-full flex items-start gap-2 px-3 py-2 rounded hover:bg-[var(--background)] ${selectedId === t.id ? "bg-[var(--background)]" : ""}`}>
              <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={(e) => {
                setSelectedIds((ids) => e.target.checked ? [...ids, t.id] : ids.filter((id) => id !== t.id));
              }} className="mt-1" />
              <button onClick={() => setSelectedId(t.id)} className="flex-1 text-left">
                <div className="text-sm">{t.subject}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{t.date}</div>
              </button>
            </label>
          ))}
        </aside>
        <section className="p-3 overflow-auto">
          {loading && <Loading lines={12} />}
          {error && <ErrorState title="Something went wrong" action={<button className="px-2 py-1 rounded border border-[var(--border)]">Reconnect</button>} />}
          {!loading && !error && !selectedId && threads.length > 0 && (
            <Empty title="Select a thread to preview" />
          )}
          {!loading && !error && selectedId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-medium">Thread Subject</div>
                  <div className="text-xs text-[var(--muted-foreground)]">Participants…</div>
                </div>
                <div className="flex gap-2 text-sm">
                  {['Archive','Snooze','Add to Pipeline','Create Task','Draft Reply'].map((a) => (
                    <button key={a} className="px-2 py-1 rounded border border-[var(--border)]">{a}</button>
                  ))}
                </div>
              </div>
              <div className="border border-[var(--border)] rounded p-3 min-h-64">Messages list (collapsed quotes)…</div>
              <div className="border border-[var(--border)] rounded p-3">
                <div className="text-sm mb-2">Inline reply</div>
                <textarea className="w-full h-24 rounded border border-[var(--border)] bg-[var(--muted)] p-2 text-sm" placeholder="Write a reply…" />
                <div className="mt-2 flex gap-2 text-sm">
                  <button className="px-2 py-1 rounded border border-[var(--border)]">Insert AI reply</button>
                  <select className="px-2 py-1 rounded border border-[var(--border)] bg-transparent">
                    <option>Short</option>
                    <option>Neutral</option>
                    <option>Warm</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}


