"use client";
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink, Inbox, MessageSquare, Clock } from "lucide-react";
import Link from "next/link";

interface InboxSummaryWidgetProps {
  unreadCount: number;
  recentThreads: any[];
}

export default function InboxSummaryWidget({ unreadCount, recentThreads }: InboxSummaryWidgetProps) {
  const hasEmails = recentThreads && recentThreads.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Email Stream</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">Latest email activity</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/inbox" className="flex items-center gap-2">
                <span>View Stream</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Unread Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Unread Messages</span>
            </div>
            <Badge variant={unreadCount > 0 ? "destructive" : "secondary"} className="text-sm">
              {unreadCount}
            </Badge>
          </div>

          {/* Recent Threads */}
          {hasEmails ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Recent Threads</h4>
              <div className="space-y-2">
                {recentThreads?.slice(0, 5).map((thread, index) => (
                  <motion.div
                    key={thread.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {thread.subject || 'No Subject'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {thread.participants || 'No participants'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Clock className="h-3 w-3 text-slate-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Start Your Email Flow
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Connect your email account to see messages and start flowing through your inbox.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Mail className="h-4 w-4 mr-2" />
                  Connect Email
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
