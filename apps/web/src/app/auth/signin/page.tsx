export default function SignInPage() {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block wave-gradient" />
      <div className="p-6 md:p-10 grid place-items-center">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 rounded-md border border-[var(--border)]">Continue with Google</button>
            <button className="w-full px-4 py-2 rounded-md border border-[var(--border)]">Continue with Microsoft</button>
          </div>
        </div>
      </div>
    </div>
  );
}


