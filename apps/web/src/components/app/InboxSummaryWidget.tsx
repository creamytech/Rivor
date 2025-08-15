import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink } from "lucide-react";
import Link from "next/link";
import { UiEmailThread } from "@/server/email";
import { EmptyState } from "@/components/ui/empty-state";

interface InboxSummaryProps {
  unreadCount: number;
  recentThreads: UiEmailThread[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export default function InboxSummaryWidget({ 
  unreadCount, 
  recentThreads, 
  loading, 
  error,
  onRetry 
}: InboxSummaryProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Inbox Summary</CardTitle>
          </div>
          <CardDescription>Latest email activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Inbox Summary</CardTitle>
          </div>
          <CardDescription>Latest email activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-sm text-gray-500 mb-4">
              Unable to load inbox data
            </div>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentThreads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Inbox Summary</CardTitle>
          </div>
          <CardDescription>Latest email activity</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Mail className="h-12 w-12" />}
            title="No email threads yet"
            description="Connect your email account to see messages here"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-flow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            <CardTitle>Email Stream</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild className="ripple-effect focus-flow">
            <Link href="/app/inbox" className="flex items-center gap-1">
              View Stream
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        <CardDescription>
          {unreadCount > 0 ? `${unreadCount} flowing in` : 'Stream is clear'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentThreads.slice(0, 5).map((thread, index) => (
            <Link 
              key={thread.id} 
              href={`/app/inbox/${thread.id}`}
              className={`cascade-item block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus-flow`}
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              aria-label={`Open email thread: ${thread.subject}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {thread.subject || '(no subject)'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {thread.participants}
                  </div>
                </div>
                <div className="text-xs text-gray-400 ml-2">
                  {new Date(thread.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {unreadCount > 0 && (
          <div className="pt-4 mt-4 border-t">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/app/inbox">
                View {unreadCount} Unread Messages
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
