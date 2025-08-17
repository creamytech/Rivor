"use client";

import { useEffect, useMemo } from "react";
import { SessionProvider } from "next-auth/react";
import CommandPalette from "@/components/common/CommandPalette";
import Toaster from "@/components/common/Toaster";
import { AnalyticsProvider } from "./AnalyticsProvider";

declare global {
  interface Window { __TOAST_BUS__?: EventTarget }
}

export default function ClientRoot() {
  const bus = useMemo(() => new EventTarget(), []);

  useEffect(() => {
    window.__TOAST_BUS__ = bus;
    return () => { if (window.__TOAST_BUS__ === bus) window.__TOAST_BUS__ = undefined; };
  }, [bus]);

  return (
    <SessionProvider>
      <AnalyticsProvider>
        <CommandPalette />
        <Toaster bus={bus} />
      </AnalyticsProvider>
    </SessionProvider>
  );
}


