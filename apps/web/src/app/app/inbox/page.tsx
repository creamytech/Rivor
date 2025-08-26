"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import AppShell from "@/components/app/AppShell";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  Mail, 
  Star, 
  Archive, 
  Trash2, 
  Reply, 
  ReplyAll, 
  Forward, 
  Search,
  Filter,
  CheckCircle,
  Circle,
  Bot,
  Sparkles,
  TrendingUp,
  Clock,
  MapPin,
  DollarSign,
  Home,
  Users,
  Calendar,
  AlertCircle,
  Check,
  X,
  Edit,
  Send,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAutoSync } from '@/hooks/useAutoSync';
import { SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator';

// Types for real email data
interface EmailThread {
  id: string;
  subject: string;
  snippet: string;
  participants: Array<{ name: string; email: string }>;
  messageCount: number;
  unread: boolean;
  starred: boolean;
  hasAttachments: boolean;
  labels: string[];
  lastMessageAt: string;
  updatedAt: string;
}

interface ThreadsResponse {
  threads: EmailThread[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function InboxPage() {
  const { theme } = useTheme();
  const { toast } = useToast();
  
  // Setup auto-sync with refresh on new content
  const autoSync = useAutoSync({
    interval: 5, // Sync every 5 minutes for inbox
    enabled: true,
    showToasts: true,
    onSyncComplete: (result) => {
      // Refresh inbox if new messages/threads were found
      if (result.email.newMessages || result.email.newThreads) {
        fetchThreads(pagination.page, activeFilter, searchQuery);
      }
    }
  });
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [activeThread, setActiveThread] = useState<EmailThread | null>(null);
  const [selectedThreads, setSelectedThreads] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Fetch threads from API
  const fetchThreads = async (page = 1, filter = activeFilter, search = searchQuery) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        filter,
        ...(search && { search })
      });
      
      const response = await fetch(`/api/inbox/threads?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch threads');
      }
      
      const data: ThreadsResponse = await response.json();
      setThreads(data.threads);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast({
        title: "Error",
        description: "Failed to load inbox threads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load threads on component mount and filter changes
  useEffect(() => {
    fetchThreads(1, activeFilter, searchQuery);
  }, [activeFilter]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        fetchThreads(1, activeFilter, searchQuery);
      } else {
        fetchThreads(1, activeFilter, '');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle thread selection
  const handleThreadSelect = async (thread: EmailThread) => {
    setActiveThread(thread);
    
    // Mark as read if unread
    if (thread.unread) {
      await toggleReadStatus(thread.id, false);
    }
  };

  // Toggle star status
  const toggleStarStatus = async (threadId: string, currentStarred: boolean) => {
    try {
      setActionLoading(`star-${threadId}`);
      const response = await fetch(`/api/inbox/threads/${threadId}/star`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !currentStarred })
      });

      if (!response.ok) {
        throw new Error('Failed to update star status');
      }

      // Update local state
      setThreads(prev => prev.map(t => 
        t.id === threadId ? { ...t, starred: !currentStarred } : t
      ));

      if (activeThread?.id === threadId) {
        setActiveThread(prev => prev ? { ...prev, starred: !currentStarred } : null);
      }

      toast({
        title: currentStarred ? "Unstarred" : "Starred",
        description: `Thread ${currentStarred ? 'removed from' : 'added to'} starred`,
      });
    } catch (error) {
      console.error('Error toggling star:', error);
      toast({
        title: "Error",
        description: "Failed to update star status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle read status
  const toggleReadStatus = async (threadId: string, currentUnread: boolean) => {
    try {
      setActionLoading(`read-${threadId}`);
      const response = await fetch(`/api/inbox/threads/${threadId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unread: !currentUnread })
      });

      if (!response.ok) {
        throw new Error('Failed to update read status');
      }

      // Update local state
      setThreads(prev => prev.map(t => 
        t.id === threadId ? { ...t, unread: !currentUnread } : t
      ));

      if (activeThread?.id === threadId) {
        setActiveThread(prev => prev ? { ...prev, unread: !currentUnread } : null);
      }
    } catch (error) {
      console.error('Error toggling read:', error);
      toast({
        title: "Error",
        description: "Failed to update read status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Archive thread
  const archiveThread = async (threadId: string) => {
    try {
      setActionLoading(`archive-${threadId}`);
      const response = await fetch(`/api/inbox/threads/${threadId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true })
      });

      if (!response.ok) {
        throw new Error('Failed to archive thread');
      }

      // Remove from local state
      setThreads(prev => prev.filter(t => t.id !== threadId));
      
      if (activeThread?.id === threadId) {
        setActiveThread(null);
      }

      toast({
        title: "Archived",
        description: "Thread has been archived",
      });
    } catch (error) {
      console.error('Error archiving:', error);
      toast({
        title: "Error",
        description: "Failed to archive thread",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Delete thread
  const deleteThread = async (threadId: string) => {
    if (!confirm('Are you sure you want to delete this thread?')) {
      return;
    }

    try {
      setActionLoading(`delete-${threadId}`);
      const response = await fetch(`/api/inbox/threads/${threadId}/delete`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete thread');
      }

      // Remove from local state
      setThreads(prev => prev.filter(t => t.id !== threadId));
      
      if (activeThread?.id === threadId) {
        setActiveThread(null);
      }

      toast({
        title: "Deleted",
        description: "Thread has been deleted",
      });
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: "Error",
        description: "Failed to delete thread",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header */}
          <motion.div 
            className={`p-6 border-b ${theme === 'black' ? 'border-white/10' : 'border-black/10'}`}
            style={{
              background: theme === 'black' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(20px) saturate(1.3)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.3)'
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                  <Mail className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${theme === 'black' ? 'text-white' : 'text-black'}`}>
                    Inbox
                  </h1>
                  <p className={`text-sm ${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>
                    {pagination.total} threads • {threads.filter(t => t.unread).length} unread
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <SyncStatusIndicator 
                  variant="compact" 
                  className="mr-2"
                />
                <Button 
                  variant="liquid" 
                  size="sm"
                  onClick={() => {
                    fetchThreads(pagination.page, activeFilter, searchQuery);
                    autoSync.triggerSync();
                  }}
                  disabled={loading || autoSync.isRunning}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading || autoSync.isRunning ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="liquid" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Compose
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${theme === 'black' ? 'text-white/40' : 'text-black/40'}`} />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl ${theme === 'black' ? 'bg-white/10 border-white/20 text-white placeholder-white/40' : 'bg-black/10 border-black/20 text-black placeholder-black/40'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  style={{
                    backdropFilter: 'blur(20px) saturate(1.3)',
                    WebkitBackdropFilter: 'blur(20px) saturate(1.3)'
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                {[
                  { key: 'all', label: 'All', icon: Mail },
                  { key: 'unread', label: 'Unread', icon: Circle },
                  { key: 'starred', label: 'Starred', icon: Star },
                ].map(filter => (
                  <Button
                    key={filter.key}
                    variant={activeFilter === filter.key ? "liquid" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter.key)}
                    className="text-xs"
                  >
                    <filter.icon className="h-3 w-3 mr-1" />
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Thread List Panel */}
            <motion.div 
              className={`w-96 border-r ${theme === 'black' ? 'border-white/10' : 'border-black/10'} flex flex-col`}
              style={{
                background: theme === 'black' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(20px) saturate(1.3)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.3)'
              }}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence>
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                      <p className={`${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>Loading inbox...</p>
                    </div>
                  ) : threads.length === 0 ? (
                    <div className="p-8 text-center">
                      <Mail className={`h-12 w-12 ${theme === 'black' ? 'text-white/40' : 'text-black/40'} mx-auto mb-4`} />
                      <p className={`${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>No emails found</p>
                    </div>
                  ) : (
                    threads.map((thread, index) => (
                      <motion.div
                        key={thread.id}
                        className={`p-4 border-b ${theme === 'black' ? 'border-white/5 hover:bg-white/5' : 'border-black/5 hover:bg-black/5'} cursor-pointer transition-all duration-300 ${
                          activeThread?.id === thread.id ? (theme === 'black' ? 'bg-white/10' : 'bg-black/10') : ''
                        }`}
                        onClick={() => handleThreadSelect(thread)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Actions */}
                          <div className="flex flex-col gap-1 mt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStarStatus(thread.id, thread.starred);
                              }}
                              disabled={actionLoading === `star-${thread.id}`}
                              className={`p-1 rounded hover:bg-white/10 ${thread.starred ? 'text-yellow-400' : (theme === 'black' ? 'text-white/40' : 'text-black/40')}`}
                            >
                              <Star className={`h-3 w-3 ${thread.starred ? 'fill-current' : ''}`} />
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className={`font-medium ${theme === 'black' ? 'text-white' : 'text-black'} truncate`}>
                                {thread.participants[0]?.name || thread.participants[0]?.email || 'Unknown'}
                              </div>
                              <div className="flex items-center gap-1">
                                {thread.hasAttachments && (
                                  <div className={`w-2 h-2 rounded-full bg-blue-500`} />
                                )}
                                {thread.unread && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                              </div>
                            </div>

                            <div className={`text-sm font-medium ${theme === 'black' ? 'text-white/90' : 'text-black/90'} truncate mb-1`}>
                              {thread.subject}
                            </div>

                            <div className={`text-xs ${theme === 'black' ? 'text-white/60' : 'text-black/60'} truncate mb-2`}>
                              {thread.snippet}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className={`text-xs ${theme === 'black' ? 'text-white/40' : 'text-black/40'}`}>
                                {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
                              </div>
                              
                              <div className={`text-xs ${theme === 'black' ? 'text-white/40' : 'text-black/40'}`}>
                                {new Date(thread.lastMessageAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Thread Detail Panel */}
            <motion.div 
              className="flex-1 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {activeThread ? (
                <>
                  {/* Thread Header */}
                  <div 
                    className={`p-6 border-b ${theme === 'black' ? 'border-white/10' : 'border-black/10'}`}
                    style={{
                      background: theme === 'black' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(20px) saturate(1.3)',
                      WebkitBackdropFilter: 'blur(20px) saturate(1.3)'
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className={`text-xl font-bold ${theme === 'black' ? 'text-white' : 'text-black'} mb-2`}>
                          {activeThread.subject}
                        </h2>
                        <div className={`flex items-center gap-4 text-sm ${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>
                          <div>From: {activeThread.participants[0]?.name} &lt;{activeThread.participants[0]?.email}&gt;</div>
                          <div>{new Date(activeThread.lastMessageAt).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="liquid" 
                          size="sm"
                          onClick={() => {
                            // TODO: Implement reply functionality
                            toast({
                              title: "Reply",
                              description: "Reply functionality coming soon!",
                            });
                          }}
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                        <Button variant="outline" size="sm">
                          <Forward className="h-4 w-4 mr-1" />
                          Forward
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => archiveThread(activeThread.id)}
                          disabled={actionLoading === `archive-${activeThread.id}`}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteThread(activeThread.id)}
                          disabled={actionLoading === `delete-${activeThread.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Thread Content */}
                  <div className="flex-1 p-6 overflow-y-auto">
                    <motion.div 
                      className="prose prose-invert max-w-none"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className={`${theme === 'black' ? 'text-white/90' : 'text-black/90'} leading-relaxed`}>
                        <p className="mb-4">
                          This is a real email thread from your inbox. 
                          Thread ID: {activeThread.id}
                        </p>
                        <p className="mb-4">
                          Messages: {activeThread.messageCount}
                        </p>
                        <p className="mb-4">
                          Status: {activeThread.unread ? 'Unread' : 'Read'} | 
                          {activeThread.starred ? ' Starred' : ' Not starred'}
                        </p>
                        <p className="text-sm opacity-60">
                          Full message content decryption and display coming soon...
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Mail className={`h-16 w-16 ${theme === 'black' ? 'text-white/40' : 'text-black/40'} mx-auto mb-4`} />
                    <h3 className={`text-xl font-medium ${theme === 'black' ? 'text-white/60' : 'text-black/60'} mb-2`}>Select an email</h3>
                    <p className={`${theme === 'black' ? 'text-white/40' : 'text-black/40'}`}>Choose an email thread from the list to view its content</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </AppShell>
    </div>
  );
}