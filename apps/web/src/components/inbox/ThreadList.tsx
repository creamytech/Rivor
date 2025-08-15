"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FlowCard from '@/components/river/FlowCard';
import PillFilter from '@/components/river/PillFilter';
import SkeletonFlow from '@/components/river/SkeletonFlow';
import DataEmpty from '@/components/river/DataEmpty';
import StatusBadge from '@/components/river/StatusBadge';
import { 
  Mail, 
  MailOpen, 
  Star, 
  Archive, 
  Trash2, 
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EmailThread {
  id: string;
  subject: string;
  snippet: string;
  participants: Array<{
    name?: string;
    email: string;
  }>;
  messageCount: number;
  unread: boolean;
  starred: boolean;
  hasAttachments: boolean;
  labels: string[];
  lastMessageAt: string;
  updatedAt: string;
}

interface ThreadListProps {
  className?: string;
}

export default function ThreadList({ className }: ThreadListProps) {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const filters = [
    { id: 'all', label: 'All', count: threads.length },
    { id: 'unread', label: 'Unread', count: threads.filter(t => t.unread).length },
    { id: 'starred', label: 'Starred', count: threads.filter(t => t.starred).length },
    { id: 'attachments', label: 'Has Attachments', count: threads.filter(t => t.hasAttachments).length }
  ];

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/inbox/threads');
      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads || []);
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      fetchThreads();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/inbox/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThreadAction = async (threadId: string, action: 'star' | 'unstar' | 'archive' | 'delete') => {
    try {
      const response = await fetch(`/api/inbox/threads/${threadId}/${action}`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        // Optimistic update
        setThreads(prev => prev.map(thread => {
          if (thread.id === threadId) {
            switch (action) {
              case 'star':
                return { ...thread, starred: true };
              case 'unstar':
                return { ...thread, starred: false };
              case 'archive':
                return { ...thread, labels: [...thread.labels.filter(l => l !== 'inbox'), 'archived'] };
              case 'delete':
                return thread; // Will be filtered out
            }
          }
          return thread;
        }));

        if (action === 'delete' || action === 'archive') {
          setThreads(prev => prev.filter(t => t.id !== threadId));
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} thread:`, error);
    }
  };

  const filteredThreads = threads.filter(thread => {
    switch (currentFilter) {
      case 'unread':
        return thread.unread;
      case 'starred':
        return thread.starred;
      case 'attachments':
        return thread.hasAttachments;
      default:
        return true;
    }
  });

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPrimaryParticipant = (participants: EmailThread['participants']) => {
    return participants.find(p => p.name) || participants[0] || { email: 'Unknown', name: null };
  };

  if (loading && threads.length === 0) {
    return (
      <FlowCard className={className}>
        <div className="p-6">
          <SkeletonFlow variant="list" lines={8} />
        </div>
      </FlowCard>
    );
  }

  return (
    <FlowCard className={className}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Inbox
            </h2>
            <Button
              onClick={fetchThreads}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          {/* Search */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={() => handleSearch(searchQuery)}
              size="sm"
            >
              Search
            </Button>
          </div>

          {/* Filters */}
          <PillFilter
            options={filters}
            value={currentFilter}
            onChange={setCurrentFilter}
          />
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-auto">
          {filteredThreads.length === 0 ? (
            <DataEmpty
              icon={<Mail className="h-12 w-12" />}
              title={searchQuery ? 'No threads found' : 'All clear!'}
              description={
                searchQuery 
                  ? `No threads match "${searchQuery}". Try a different search term.`
                  : 'No threads in your inbox. All caught up!'
              }
              action={searchQuery ? {
                label: 'Clear search',
                onClick: () => {
                  setSearchQuery('');
                  fetchThreads();
                }
              } : undefined}
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence>
                {filteredThreads.map((thread, index) => {
                  const participant = getPrimaryParticipant(thread.participants);
                  const isSelected = selectedThreads.has(thread.id);

                  return (
                    <motion.div
                      key={thread.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors',
                        thread.unread && 'bg-blue-50/50 dark:bg-blue-950/20',
                        isSelected && 'bg-teal-50 dark:bg-teal-950/30'
                      )}
                      onClick={() => window.location.href = `/app/inbox/${thread.id}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-azure-400 flex items-center justify-center text-white font-medium text-sm">
                          {participant.name ? participant.name.charAt(0).toUpperCase() : participant.email.charAt(0).toUpperCase()}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'font-medium truncate',
                                thread.unread 
                                  ? 'text-slate-900 dark:text-slate-100' 
                                  : 'text-slate-600 dark:text-slate-400'
                              )}>
                                {participant.name || participant.email}
                              </span>
                              {thread.messageCount > 1 && (
                                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                                  {thread.messageCount}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {thread.hasAttachments && (
                                <Paperclip className="h-4 w-4 text-slate-400" />
                              )}
                              <span className="text-xs text-slate-500">
                                {formatRelativeTime(thread.lastMessageAt)}
                              </span>
                            </div>
                          </div>

                          <div className="mb-2">
                            <h3 className={cn(
                              'text-sm truncate',
                              thread.unread 
                                ? 'font-semibold text-slate-900 dark:text-slate-100' 
                                : 'font-medium text-slate-700 dark:text-slate-300'
                            )}>
                              {thread.subject || '(No subject)'}
                            </h3>
                          </div>

                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {thread.snippet}
                          </p>

                          {/* Labels */}
                          {thread.labels.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              {thread.labels.slice(0, 3).map((label) => (
                                <StatusBadge
                                  key={label}
                                  status="connected"
                                  label={label}
                                  size="sm"
                                  showIcon={false}
                                />
                              ))}
                              {thread.labels.length > 3 && (
                                <span className="text-xs text-slate-500">
                                  +{thread.labels.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleThreadAction(thread.id, thread.starred ? 'unstar' : 'star');
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Star className={cn(
                              'h-4 w-4',
                              thread.starred ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'
                            )} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleThreadAction(thread.id, 'archive');
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Archive className="h-4 w-4 text-slate-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleThreadAction(thread.id, 'delete');
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-slate-400" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </FlowCard>
  );
}
