"use client";
import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host) return;
  if (!(posthog as any).__loaded) {
    posthog.init(key, { api_host: host });
  }
}
