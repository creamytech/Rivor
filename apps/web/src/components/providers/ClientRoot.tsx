"use client";

import { useEffect, useMemo } from "react";
import CommandPalette from "@/components/common/CommandPalette";
import Toaster from "@/components/common/Toaster";

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
    <>
      <CommandPalette />
      <Toaster bus={bus} />
    </>
  );
}


