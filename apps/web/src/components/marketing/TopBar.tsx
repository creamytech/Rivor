"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/branding/Logo";

export default function MarketingTopBar() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`w-full sticky top-0 z-40 transition-colors ${solid ? "backdrop-blur bg-[color-mix(in_oklab,var(--background)95%,transparent)] border-b border-[var(--border)]" : "bg-transparent"}`}>
      <div className="container h-14 flex items-center justify-between">
        <Logo />
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <Link href="/pricing" className="hover:opacity-80">Pricing</Link>
          <Link href="/demo" className="hover:opacity-80">Demo</Link>
          <Link href="/security" className="hover:opacity-80">Security</Link>
          <Link href="/docs" className="hover:opacity-80">Docs</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth/signin" className="px-3 py-1.5 rounded-md border border-[var(--border)] hover:bg-[var(--muted)]">Get Started</Link>
          <Link href="/demo" className="px-3 py-1.5 rounded-md brand-gradient text-white">See Demo</Link>
        </div>
      </div>
    </div>
  );
}


