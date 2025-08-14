"use client";
import AppShell from "@/components/app/AppShell";
import { Loading, Empty, ErrorState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useEffect, useMemo, useState } from "react";
import { 
  Search, 
  MoreVertical, 
  Archive, 
  Star, 
  Reply, 
  Forward, 
  Trash2,
  UserPlus,
  Calendar,
  Bot,
  RefreshCw,
  Clock,
  Paperclip,
  CheckCircle
} from "lucide-react";
import AIDraftModal from "@/components/inbox/AIDraftModal";

type Thread = { 
  id: string; 
  subject: string; 
  date: string; 
  unread?: boolean;
  participants?: string;
  snippet?: string;
  starred?: boolean;
  hasAttachments?: boolean;
  messageCount?: number;
  labels?: string[];
};

export default function InboxPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAIDraft, setShowAIDraft] = useState(false);
  const indexById = useMemo(() => new Map(threads.map((t, i) => [t.id, i])), [threads]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (loading || error) return;
      if (["j","k","e","r","s"].includes(e.key)) e.preventDefault();
      if (e.key === "j") {
        const i = selectedId ? (indexById.get(selectedId) ?? -1) : -1;
        const next = threads[Math.min(i + 1, threads.length - 1)];
        if (next) setSelectedId(next.id);
      } else if (e.key === "k") {
        const i = selectedId ? (indexById.get(selectedId) ?? threads.length) : threads.length;
        const prev = threads[Math.max(i - 1, 0)];
        if (prev) setSelectedId(prev.id);
      } else if (e.key === "e") {
        // archive
        if (selectedId) setThreads((ts) => ts.filter((t) => t.id !== selectedId));
      } else if (e.key === "r") {
        // reply focus placeholder
        const area = document.querySelector<HTMLTextAreaElement>("textarea");
        area?.focus();
      } else if (e.key === "s") {
        // snooze
        // simulate by moving item to end
        if (selectedId) setThreads((ts) => {
          const i = ts.findIndex((t) => t.id === selectedId);
          if (i === -1) return ts;
          const copy = ts.slice();
          const [item] = copy.splice(i, 1);
          copy.push(item);
          return copy;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, error, selectedId, threads, indexById]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/inbox/threads');
        if (!res.ok) throw new Error('load');
        const json = await res.json();
        if (cancelled) return;
        const rows = (json.threads as any[]).map((t) => ({ id: t.id, subject: t.subject || t.participants || '(no subject)', date: new Date(t.updatedAt).toLocaleDateString() }));
        setThreads(rows);
        setLoading(false);
      } catch (e) {
        if (!cancelled) { setError('Failed to load'); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const right = (
    <div className="p-3">
      <div className="text-sm font-medium mb-2">AI Summary</div>
      {loading ? <Loading lines={6} /> : threads.length === 0 ? <Empty title="All clear — let Rivor watch for new deals." /> : (
        <ul className="text-sm list-disc pl-4 space-y-1">
          <li>Key points</li>
          <li>Tasks</li>
          <li>Next steps</li>
        </ul>
      )}
      <div className="mt-4 text-sm font-medium mb-2">Suggested Replies</div>
      <div className="flex gap-2 text-xs">
        <button className="px-2 py-1 rounded border border-[var(--border)]">Short</button>
        <button className="px-2 py-1 rounded border border-[var(--border)]">Neutral</button>
        <button className="px-2 py-1 rounded border border-[var(--border)]">Warm</button>
      </div>
    </div>
  );

  return (
    <AppShell rightDrawer={right}>
      <div className="grid md:grid-cols-[280px_1fr] h-[calc(100vh-56px)]">
        <aside className="border-r border-[var(--border)] p-3 overflow-auto">
          <div className="mb-3 flex gap-1">
            {['All','Unread','Starred','Archived'].map((f) => (
              <Button key={f} variant="ghost" size="sm" className="text-xs">
                {f}
              </Button>
            ))}
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input placeholder="Search messages..." className="pl-9" />
          </div>
          {selectedIds.length > 0 && (
            <div className="mb-3 p-2 bg-[var(--muted)] rounded-md flex items-center gap-2">
              <span className="text-sm font-medium">{selectedIds.length} selected</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { 
                  setThreads((ts)=> ts.filter(t=>!selectedIds.includes(t.id))); 
                  setSelectedIds([]); 
                }}
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                Clear
              </Button>
            </div>
          )}
          {loading && <Loading />}
          {error && <ErrorState title="Unable to load inbox" action={<button className="px-2 py-1 rounded border border-[var(--border)]">Retry</button>} />}
          {!loading && !error && threads.length === 0 && (
            <Empty title="All clear — let Rivor watch for new deals." />
          )}
          {!loading && !error && threads.map((t) => (
            <div key={t.id} className={`group w-full flex items-start gap-3 p-3 rounded-md cursor-pointer hover:bg-[var(--muted)] transition-colors ${selectedId === t.id ? "bg-[var(--muted)] border border-[var(--rivor-teal)]" : "border border-transparent"}`}>
              <input 
                type="checkbox" 
                checked={selectedIds.includes(t.id)} 
                onChange={(e) => {
                  setSelectedIds((ids) => e.target.checked ? [...ids, t.id] : ids.filter((id) => id !== t.id));
                }} 
                className="mt-1 rounded" 
              />
              <button onClick={() => setSelectedId(t.id)} className="flex-1 text-left space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {t.unread && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    {t.starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    <span className={`text-sm ${t.unread ? "font-semibold" : ""}`}>
                      {t.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {t.hasAttachments && <Paperclip className="h-3 w-3 text-[var(--muted-foreground)]" />}
                    <span className="text-xs text-[var(--muted-foreground)]">{t.date}</span>
                  </div>
                </div>
                {t.participants && (
                  <div className="text-xs text-[var(--muted-foreground)] truncate">
                    {t.participants}
                  </div>
                )}
                {t.snippet && (
                  <div className="text-xs text-[var(--muted-foreground)] truncate">
                    {t.snippet}
                  </div>
                )}
                {t.labels && t.labels.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {t.labels.map(label => (
                      <Badge key={label} variant="secondary" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                )}
              </button>
            </div>
          ))}
        </aside>
        <section className="p-3 overflow-auto">
          {loading && <Loading lines={12} />}
          {error && <ErrorState title="Something went wrong" action={<button className="px-2 py-1 rounded border border-[var(--border)]">Reconnect</button>} />}
          {!loading && !error && !selectedId && threads.length > 0 && (
            <Empty title="Select a thread to preview" />
          )}
          {!loading && !error && selectedId && (
            <div className="space-y-4">
              {/* Thread Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h1 className="text-lg font-semibold">Thread Subject</h1>
                  <div className="text-sm text-[var(--muted-foreground)]">3 participants • 5 messages</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Star className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Clock className="mr-2 h-4 w-4" />
                        Snooze
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Convert to Lead
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Create Task
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* AI Summary */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-[var(--rivor-teal)]" />
                      <span className="text-sm font-medium">AI Summary</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Client interested in property viewing. Requesting weekend availability for 123 Main Street. 
                    Follow-up needed on pricing and viewing schedule.
                  </p>
                </CardContent>
              </Card>

              {/* Messages */}
              <div className="space-y-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                          JS
                        </div>
                        <div>
                          <div className="font-medium">John Smith</div>
                          <div className="text-xs text-[var(--muted-foreground)]">john@example.com</div>
                        </div>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">2 hours ago</div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p>Hi there! I'm very interested in the 123 Main Street property. Could we schedule a viewing this weekend?</p>
                      <p>I'm available Saturday morning or Sunday afternoon. Looking forward to hearing from you!</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Reply */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Reply className="h-4 w-4" />
                      Quick Reply
                    </div>
                    <textarea 
                      className="w-full h-24 rounded-md border border-[var(--border)] bg-[var(--background)] p-3 text-sm resize-none focus:ring-2 focus:ring-[var(--focus)] focus:border-transparent" 
                      placeholder="Write a reply..."
                    />
                    <div className="flex items-center justify-between">
                                          <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowAIDraft(true)}>
                        <Bot className="h-4 w-4 mr-1" />
                        AI Draft
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        Schedule
                      </Button>
                    </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Forward className="h-4 w-4 mr-1" />
                          Forward
                        </Button>
                        <Button variant="brand" size="sm">
                          <Reply className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </div>
      
      {/* AI Draft Modal */}
      <AIDraftModal 
        open={showAIDraft} 
        onOpenChange={setShowAIDraft}
        threadContext={selectedId ? {
          subject: "RE: Property Inquiry - 123 Main Street",
          participants: "John Smith, You",
          lastMessage: "Hi there! I'm very interested in the 123 Main Street property..."
        } : undefined}
      />
    </AppShell>
  );
}


