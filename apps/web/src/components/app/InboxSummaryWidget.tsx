import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink, MessageSquare, Zap } from "lucide-react";
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
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg animate-pulse">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5" />
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
          </div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-6"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Email Stream</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Latest email activity</p>
          <div className="text-center py-8">
            <div className="text-sm text-slate-500 mb-4">
              Unable to load inbox data
            </div>
            <Button variant="outline" size="sm" onClick={onRetry} className="bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 dark:hover:bg-teal-900/30 border-teal-200 dark:border-teal-700">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (recentThreads.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-teal-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Email Stream</h3>
            </div>
            <Button variant="ghost" size="sm" asChild className="hover:bg-teal-50 dark:hover:bg-teal-900/20">
              <Link href="/app/inbox" className="flex items-center gap-1">
                View Stream
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Latest email activity</p>
          
          <div className="text-center py-8">
            <div className="mb-4">
              <MessageSquare className="h-12 w-12 text-teal-400 mx-auto animate-pulse" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Start Your Email Flow
            </h4>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Connect your email account to see messages and start flowing through your inbox.
            </p>
            <Button className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all duration-300" asChild>
              <Link href="/app/inbox">
                <Zap className="h-4 w-4 mr-2" />
                Connect Email
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-teal-500" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Email Stream</h3>
            {unreadCount > 0 && (
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
            )}
          </div>
          <Button variant="ghost" size="sm" asChild className="hover:bg-teal-50 dark:hover:bg-teal-900/20">
            <Link href="/app/inbox" className="flex items-center gap-1">
              View Stream
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {unreadCount > 0 ? `${unreadCount} flowing in` : 'Stream is clear'}
        </p>
        
        <div className="space-y-3">
          {recentThreads.slice(0, 5).map((thread, index) => (
            <Link 
              key={thread.id} 
              href={`/app/inbox/${thread.id}`}
              className={`block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group`}
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              aria-label={`Open email thread: ${thread.subject}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {thread.subject || '(no subject)'}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {thread.participants}
                  </div>
                </div>
                <div className="text-xs text-slate-400 ml-2 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                  {new Date(thread.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {unreadCount > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" className="w-full bg-gradient-to-r from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 dark:from-teal-900/20 dark:to-teal-900/30 dark:hover:from-teal-900/30 dark:hover:to-teal-900/40 border-teal-200 dark:border-teal-700" asChild>
              <Link href="/app/inbox">
                <Mail className="h-4 w-4 mr-2" />
                View {unreadCount} Unread Messages
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
