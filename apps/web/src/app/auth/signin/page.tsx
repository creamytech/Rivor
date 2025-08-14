"use client";
import { signIn } from "next-auth/react";
export default function SignInPage() {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const error = params.get('error');
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
            <button onClick={() => signIn('google')} className="w-full px-4 py-2 rounded-md border border-[var(--border)]">Continue with Google</button>
            <button onClick={() => signIn('azure-ad')} className="w-full px-4 py-2 rounded-md border border-[var(--border)]">Continue with Microsoft</button>
          </div>
        </div>
      </div>
    </div>
  );
}


