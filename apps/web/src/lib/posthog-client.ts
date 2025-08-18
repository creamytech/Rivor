"use client";
import posthog from "posthog-js";

export function initPostHog() {
  // Temporarily disable PostHog to fix initialization error
  // TODO: Re-enable once the '$' initialization error is resolved
  /*
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host) return;
  if (!(posthog as unknown).__loaded) {
    posthog.init(key, { api_host: host });
  }
  */
}
