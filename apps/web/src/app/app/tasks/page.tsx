"use client";
import AppShell from "@/components/app/AppShell";
import { useState } from "react";

type Task = { id: string; title: string };
const buckets = ["Today", "Upcoming", "Later", "Completed"] as const;

export default function TasksPage() {
  const [tasks, setTasks] = useState<Record<(typeof buckets)[number], Task[]>>({ Today: [], Upcoming: [], Later: [], Completed: [] });
  const [input, setInput] = useState("");

  function addTask() {
    if (!input.trim()) return;
    setTasks((t) => ({ ...t, Today: [{ id: Math.random().toString(36).slice(2), title: input }, ...t.Today] }));
    setInput("");
  }

  return (
    <AppShell>
      <div className="container py-4">
        <div className="flex gap-2 mb-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key==='Enter' && addTask()} placeholder="fri 3pm follow up with Dana" className="flex-1 px-3 py-2 rounded border border-[var(--border)] bg-[var(--muted)]" />
          <button onClick={addTask} className="px-3 py-2 rounded brand-gradient text-white">Add</button>
        </div>
        <div className="grid md:grid-cols-4 gap-3">
          {buckets.map((b) => (
            <div key={b} className="card p-3 min-h-32">
              <div className="text-sm font-medium mb-2">{b}</div>
              {tasks[b].length === 0 ? (
                <div className="text-xs text-[var(--muted-foreground)]">Empty</div>
              ) : (
                <ul className="text-sm space-y-1">
                  {tasks[b].map((t) => (
                    <li key={t.id} className="flex items-center justify-between border border-[var(--border)] rounded px-2 py-1">
                      <span>{t.title}</span>
                      <div className="flex gap-1 text-xs">
                        <button className="px-2 py-1 rounded border border-[var(--border)]">Complete</button>
                        <button className="px-2 py-1 rounded border border-[var(--border)]">Snooze</button>
                        <button className="px-2 py-1 rounded border border-[var(--border)]">Reassign</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}


