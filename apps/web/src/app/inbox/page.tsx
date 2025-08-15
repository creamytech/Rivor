export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import Link from "next/link";
import { listThreads } from "@/server/email";
import { searchThreads } from "@/server/search";
import SyncButton from "@/components/inbox/SyncButton";

export default async function InboxPage({ searchParams }: { searchParams?: { q?: string } }) {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/inbox");
  }
  const userEmail = session.user?.email ?? "unknown";
  const orgId = (session as any).orgId ?? "unknown";
  let threads = orgId !== 'unknown' ? await listThreads(orgId, 50) : [];
  const q = searchParams?.q?.trim();
  if (q && orgId !== 'unknown') {
    const ids = await searchThreads(orgId, q);
    const idSet = new Set(ids.map((r: { id: string }) => r.id));
    threads = threads.filter(t => idSet.has(t.id));
  }
  return (
    <main className="h-[calc(100vh-64px)] grid grid-cols-12">
      <aside className="col-span-2 border-r p-4 space-y-4">
        <h2 className="font-semibold">Folders</h2>
        <ul className="text-sm space-y-2">
          <li>Inbox</li>
          <li>Starred</li>
          <li>All Mail</li>
        </ul>
      </aside>
      <section className="col-span-4 border-r p-4 overflow-y-auto">
        <div className="mb-3 text-xs text-gray-500">Signed in as {userEmail} · Org {orgId}</div>
        <SyncButton />
        <form action="/inbox" className="mb-3 flex gap-2">
          <input name="q" defaultValue={q} placeholder="Search" className="border rounded px-2 py-1 text-sm w-full" />
          <button className="border rounded px-3 text-sm">Go</button>
        </form>
        <ul className="divide-y">
          {threads.map(t => (
            <li key={t.id} className="py-3">
              <Link href={`/inbox/${t.id}`} className="block">
                <div className="font-medium truncate">{t.subject || '(no subject)'}</div>
                <div className="text-xs text-gray-500 truncate">{t.participants}</div>
              </Link>
            </li>
          ))}
          {threads.length === 0 && (
            <li className="text-sm text-gray-500">No threads yet.</li>
          )}
        </ul>
      </section>
      <section className="col-span-6 p-4">
        <div className="text-sm text-gray-500">Select a thread to view.</div>
      </section>
    </main>
  );
}