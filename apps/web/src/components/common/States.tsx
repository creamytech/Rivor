import React from "react";

export function Loading({ lines = 5 }: { lines?: number }) {
  return (
    <div className="p-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-4 w-full mb-3 rounded" />
      ))}
    </div>
  );
}

export function Empty({ title, cta }: { title: string; cta?: React.ReactNode }) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto w-24 h-24 rounded-full wave-gradient opacity-70 mb-4" />
      <div className="text-base font-medium mb-2">{title}</div>
      {cta}
    </div>
  );
}

export function ErrorState({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="p-4 border border-[var(--border)] rounded-md bg-[color-mix(in_oklab,var(--rivor-indigo)8%,transparent)]">
      <div className="font-medium mb-2">{title}</div>
      {action}
    </div>
  );
}


