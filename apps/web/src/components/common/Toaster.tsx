"use client";

import { useEffect, useState } from "react";

export type Toast = { id: string; title: string; tone?: "success" | "warning" | "error" };

export default function Toaster({ bus }: { bus: EventTarget }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const onShow = (e: Event) => {
      const detail = (e as CustomEvent<Toast>).detail;
      setToasts((prev) => [...prev, detail]);
      setTimeout(() => dismiss(detail.id), 3000);
    };
    bus.addEventListener("toast:show", onShow as EventListener);
    return () => bus.removeEventListener("toast:show", onShow as EventListener);
  }, [bus]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="fixed z-[100] bottom-3 right-3 space-y-2">
      {toasts.map((t) => (
        <div key={t.id} className={`px-3 py-2 rounded-md border text-sm backdrop-blur ${t.tone === "success" ? "border-green-500/30 bg-green-500/10" : t.tone === "warning" ? "border-amber-500/30 bg-amber-500/10" : t.tone === "error" ? "border-red-500/30 bg-red-500/10" : "border-[var(--border)] bg-[var(--muted)]"}`}>
          {t.title}
        </div>
      ))}
    </div>
  );
}


