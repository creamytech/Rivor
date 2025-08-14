import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import Link from "next/link";
import { getThreadWithMessages, listThreads } from "@/server/email";

export default async function ThreadPage({ params }: { params: { threadId: string } }) {
  const session = await auth();
  if (!session) redirect("/api/auth/signin?callbackUrl=/inbox");
  const orgId = (session as any).orgId as string | undefined;
  const threadId = params.threadId;
  if (!orgId) redirect('/inbox');

  const [threads, { thread, messages }] = await Promise.all([
    listThreads(orgId, 50),
    getThreadWithMessages(orgId, threadId),
  ]);

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
        <ul className="divide-y">
          {threads.map(t => (
            <li key={t.id} className="py-3">
              <Link href={`/inbox/${t.id}`} className={`block ${t.id === threadId ? 'bg-gray-50 rounded p-2' : ''}`}>
                <div className="font-medium truncate">{t.subject || '(no subject)'}</div>
                <div className="text-xs text-gray-500 truncate">{t.participants}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="col-span-6 p-4 overflow-y-auto">
        {!thread && <div className="text-sm text-gray-500">Thread not found</div>}
        {thread && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold">{thread.subject || '(no subject)'}</h1>
              <div className="text-xs text-gray-500">{thread.participants}</div>
            </div>
            <div className="space-y-6">
              {messages.map(m => (
                <article key={m.id} className="border rounded p-3 bg-white/80">
                  <div className="text-xs text-gray-500 mb-1">{m.from} → {m.to} · {m.sentAt.toLocaleString()}</div>
                  <div className="font-medium mb-1">{m.subject}</div>
                  <div className="text-sm whitespace-pre-wrap text-gray-800">{m.snippet}</div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}


