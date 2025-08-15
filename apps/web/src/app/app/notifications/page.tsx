"use client";
import AppShell from "@/components/app/AppShell";

function showToast(title: string) {
  const bus = (window as unknown).__TOAST_BUS__ as EventTarget | undefined;
  if (bus) bus.dispatchEvent(new CustomEvent("toast:show", { detail: { id: Math.random().toString(36).slice(2), title, tone: "success" } }));
}

export default function NotificationsPage() {
  return (
    <AppShell>
      <div className="container py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-base font-medium">Notifications</div>
          <button onClick={() => showToast('All notifications marked as read')} className="ml-auto px-2 py-1 rounded border border-[var(--border)] text-sm">Mark all read</button>
        </div>
        <div className="space-y-2">
          {["summary ready","reply suggestion","calendar conflict","payment status"].map((t, i) => (
            <div key={i} className="card p-3 flex items-center justify-between">
              <div className="text-sm">{t}</div>
              <div className="flex gap-2 text-xs">
                <button className="px-2 py-1 rounded border border-[var(--border)]">Open</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}


