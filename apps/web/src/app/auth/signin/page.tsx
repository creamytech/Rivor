"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
type Providers = Record<string, { id: string; name: string }>;

export default function SignInPage() {
  const isClient = typeof window !== 'undefined';
  const params = isClient ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const error = isClient ? params.get('error') : null;
  const [providers, setProviders] = useState<Providers | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/providers');
        if (!res.ok) throw new Error('providers');
        const json = await res.json();
        if (!cancelled) setProviders(json);
      } catch {
        if (!cancelled) setProviders({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block wave-gradient" />
      <div className="p-6 md:p-10 grid place-items-center">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
          {error && (
            <div className="mb-3 text-sm text-red-400">Auth error: {error}</div>
          )}
          <div className="space-y-2">
            {loading && <div className="skeleton h-10 w-full rounded" />}
            {!loading && providers && providers.google && (
              <button onClick={() => signIn('google')} className="w-full px-4 py-2 rounded-md border border-[var(--border)]">Continue with Google</button>
            )}
            {!loading && providers && (providers as any)['azure-ad'] && (
              <button onClick={() => signIn('azure-ad')} className="w-full px-4 py-2 rounded-md border border-[var(--border)]">Continue with Microsoft</button>
            )}
            {!loading && providers && Object.keys(providers).length === 0 && (
              <div className="text-sm text-[var(--muted-foreground)]">No auth providers are configured. Please set provider credentials.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


