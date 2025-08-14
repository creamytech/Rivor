"use client";
import { useState } from "react";
import AppShell from "@/components/app/AppShell";

const steps = [
  "Create or join org",
  "Connect Email",
  "Connect Calendar (optional)",
  "Pick pipeline template",
  "Invite teammates",
  "Done",
];

export default function OnboardingPage() {
  const [idx, setIdx] = useState(0);
  const next = () => setIdx((i) => Math.min(i + 1, steps.length - 1));

  return (
    <AppShell>
      <div className="container py-6">
        <div className="card p-4 mb-4">
          <div className="text-sm font-medium">Onboarding</div>
          <div className="text-xs text-[var(--muted-foreground)]">Step {idx + 1} of {steps.length}: {steps[idx]}</div>
        </div>

        <div className="grid md:grid-cols-[1fr_280px] gap-4">
          <div className="card p-4 min-h-64">
            <div className="text-base font-medium mb-2">{steps[idx]}</div>
            <div className="text-sm text-[var(--muted-foreground)] mb-4">Form placeholder</div>
            <button onClick={next} className="px-4 py-2 rounded-md brand-gradient text-white">Continue</button>
          </div>
          <aside className="card p-4">
            <div className="text-sm font-medium mb-2">Help</div>
            <p className="text-sm text-[var(--muted-foreground)]">Contextual guidance about this step.</p>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}


