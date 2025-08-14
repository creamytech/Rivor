import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function InboxPage() {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/inbox");
  }
  const userEmail = session.user?.email ?? "unknown";
  const orgId = (session as any).orgId ?? "unknown";
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Inbox (stub)</h1>
      <p className="text-sm text-gray-600">Signed in as {userEmail}</p>
      <p className="text-sm text-gray-600">Org: {orgId}</p>
      <div className="mt-4">
        <a className="text-blue-600 underline" href="/api/auth/signout?callbackUrl=/">Sign out</a>
      </div>
      <div className="mt-8 rounded border p-4 bg-white/50">
        <p>This is a placeholder. Next steps: connect Gmail/Outlook, show 3-pane inbox, and AI summary.</p>
      </div>
    </main>
  );
}