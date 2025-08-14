"use client";
import AppShell from "@/components/app/AppShell";
import { useMemo, useState } from "react";

type Card = { id: string; name: string; value: string };
const initial: Record<string, Card[]> = {
  "New Lead": [{ id: "a", name: "Dana P.", value: "$500k" }],
  "Qualified": [],
  "Showing": [],
  "Offer": [],
  "Under Contract": [],
  "Closed": [],
};

export default function PipelinePage() {
  const [columns, setColumns] = useState<Record<string, Card[]>>(initial);
  const [selected, setSelected] = useState<Card | null>(null);

  function moveCard(card: Card, from: string, to: string) {
    if (from === to) return;
    setColumns((cols) => {
      const next = { ...cols };
      next[from] = next[from].filter((c) => c.id !== card.id);
      next[to] = [card, ...next[to]];
      return next;
    });
  }

  const right = selected ? (
    <div className="p-3">
      <div className="text-sm font-medium mb-2">Lead details</div>
      <div className="text-sm">{selected.name}</div>
      <div className="text-xs text-[var(--muted-foreground)]">{selected.value}</div>
      <div className="mt-3 text-sm">Related emails, tasks, timeline, notes…</div>
    </div>
  ) : undefined;

  const stages = useMemo(() => Object.keys(columns), [columns]);

  return (
    <AppShell rightDrawer={right}>
      <div className="p-3 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 min-w-[900px]">
          {Object.entries(columns).map(([stage, cards]) => (
            <div key={stage} className="card p-3"
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={(e) => {
                   const id = e.dataTransfer.getData("card/id");
                   const from = e.dataTransfer.getData("card/from");
                   const payload = columns[from].find((c) => c.id === id);
                   if (payload) moveCard(payload, from, stage);
                 }}
            >
              <div className="text-sm font-medium mb-2">{stage}</div>
              <div className="space-y-2 min-h-24">
                {cards.length === 0 && <div className="text-xs text-[var(--muted-foreground)]">Empty — Create first lead</div>}
                {cards.map((c) => (
                  <div key={c.id} draggable onDragStart={(e) => { e.dataTransfer.setData("card/id", c.id); e.dataTransfer.setData("card/from", stage); }} className="border border-[var(--border)] rounded p-2 cursor-move hover:bg-[var(--background)]" onClick={() => setSelected(c)}>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{c.value}</div>
                    <div className="mt-2 flex gap-2 text-xs">
                      {stages.map((target) => target !== stage && (
                        <button key={target} onClick={(e) => { e.stopPropagation(); moveCard(c, stage, target); }} className="px-2 py-1 rounded border border-[var(--border)]">Move → {target.replace(/ .*/, '')}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}


