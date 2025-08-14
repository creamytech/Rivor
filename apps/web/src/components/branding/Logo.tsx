"use client";

import Link from "next/link";

type LogoProps = {
  href?: string;
  variant?: "mark" | "full";
  className?: string;
};

export default function Logo({ href = "/", variant = "full", className }: LogoProps) {
  const mark = (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--rivor-indigo)" />
          <stop offset="100%" stopColor="var(--rivor-teal)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="24" height="24" rx="6" fill="url(#g)" />
      <path d="M7 17c3-1.5 5-5 7-5s3 3 7 4" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const word = (
    <span className="ml-2 font-semibold tracking-tight" style={{ letterSpacing: "-0.02em" }}>Rivor</span>
  );

  const content = (
    <div className={`inline-flex items-center ${className ?? ""}`}>
      {mark}
      {variant === "full" ? word : null}
    </div>
  );

  return href ? (
    <Link href={href} aria-label="Rivor Home">
      {content}
    </Link>
  ) : (
    content
  );
}


