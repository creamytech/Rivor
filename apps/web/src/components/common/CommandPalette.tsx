"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Action = { id: string; title: string; hint?: string; run: () => void };

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac && e.metaKey && e.key.toLowerCase() === "k") || (!isMac && e.ctrlKey && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const actions: Action[] = useMemo(() => [
    { id: "summarize", title: "Summarize thread", run: () => router.push("/app/inbox") },
    { id: "lead", title: "Create Lead from thread", run: () => router.push("/app/pipeline") },
    { id: "reply", title: "Propose reply", run: () => router.push("/app/inbox") },
    { id: "task", title: "Create task", run: () => router.push("/app/tasks") },
    { id: "meeting", title: "Propose meeting times", run: () => router.push("/app/calendar") },
    { id: "goto", title: "Go to …", hint: "/app/inbox, /pricing", run: () => {} },
  ], [router]);

  const filtered = actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm grid place-items-start p-4">
      <div className="w-full max-w-xl mx-auto card">
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a command or search…" className="w-full px-4 py-3 bg-transparent border-b border-[var(--border)]" />
        <div className="max-h-[50vh] overflow-auto">
          {filtered.length === 0 && <div className="p-4 text-sm text-[var(--muted-foreground)]">No results</div>}
          {filtered.map((a) => (
            <button key={a.id} onClick={() => { a.run(); setOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-[var(--background)]">
              <div className="text-sm">{a.title}</div>
              {a.hint && <div className="text-xs text-[var(--muted-foreground)]">{a.hint}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


