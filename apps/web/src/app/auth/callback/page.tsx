export default function AuthCallbackPage() {
  return (
    <div className="glass-theme-black min-h-screen grid place-items-center" data-glass-theme="black">
      <div className="card p-6 w-full max-w-sm text-center">
        <div className="skeleton h-5 w-2/3 mx-auto mb-3" />
        <div className="text-sm text-[var(--muted-foreground)]">Completing sign-in…</div>
      </div>
    </div>
  );
}


