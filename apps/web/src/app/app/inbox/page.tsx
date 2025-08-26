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
import { AIReplyModal } from '@/components/inbox/AIReplyModal';

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
  const [aiAnalyzing, setAiAnalyzing] = useState<string | null>(null);
  const [showAiReplyModal, setShowAiReplyModal] = useState(false);
  const [aiReply, setAiReply] = useState<any>(null);
  const [threadAnalyses, setThreadAnalyses] = useState<Map<string, any>>(new Map());
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
      
      // Fetch AI analyses for threads
      if (data.threads.length > 0) {
        fetchAIAnalyses(data.threads.map(t => t.id));
      }
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

  // Fetch AI analyses for threads
  const fetchAIAnalyses = async (threadIds: string[]) => {
    try {
      const response = await fetch(`/api/inbox/ai-analysis?threadIds=${threadIds.join(',')}`);
      if (response.ok) {
        const data = await response.json();
        const newAnalyses = new Map(threadAnalyses);
        data.analyses?.forEach((analysis: any) => {
          newAnalyses.set(analysis.threadId, analysis);
        });
        setThreadAnalyses(newAnalyses);
      }
    } catch (error) {
      console.error('Error fetching AI analyses:', error);
    }
  };

  // Trigger AI analysis for a thread
  const analyzeThread = async (threadId: string) => {
    try {
      setAiAnalyzing(threadId);
      const response = await fetch('/api/inbox/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, force: true })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze thread');
      }

      const data = await response.json();
      if (data.success && data.results[0]?.analysis) {
        const newAnalyses = new Map(threadAnalyses);
        newAnalyses.set(threadId, data.results[0].analysis);
        setThreadAnalyses(newAnalyses);

        toast({
          title: "AI Analysis Complete",
          description: `Category: ${data.results[0].analysis.category} | Lead Score: ${data.results[0].analysis.leadScore}/100`,
        });
      }
    } catch (error) {
      console.error('Error analyzing thread:', error);
      toast({
        title: "Error",
        description: "Failed to analyze email with AI",
        variant: "destructive",
      });
    } finally {
      setAiAnalyzing(null);
    }
  };

  // Generate AI reply
  const generateAIReply = async (threadId: string) => {
    try {
      setActionLoading(`ai-reply-${threadId}`);
      
      // Get thread details for proper context
      const thread = activeThread || threads.find(t => t.id === threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }

      const response = await fetch('/api/inbox/ai-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailId: threadId,
          threadId,
          fromName: thread.participants[0]?.name || 'Unknown',
          fromEmail: thread.participants[0]?.email || 'unknown@example.com',
          subject: thread.subject,
          body: thread.snippet || 'No preview available',
          agentName: 'Real Estate Agent',
          brokerage: 'Rivor Realty'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI reply');
      }

      const data = await response.json();
      setAiReply(data.reply);
      setShowAiReplyModal(true);

    } catch (error) {
      console.error('Error generating AI reply:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI reply",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // AI Reply approval workflow functions
  const handleApproveReply = async (replyId: string, modifiedContent?: string) => {
    try {
      const response = await fetch('/api/inbox/ai-reply', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          replyId,
          status: 'approved',
          userModifications: modifiedContent,
          feedbackType: 'positive'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve reply');
      }

      toast({
        title: "Success",
        description: "AI reply approved and sent",
      });

      // Refresh thread data to show sent status
      if (activeThread) {
        fetchThreadDetails(activeThread.id);
      }

    } catch (error) {
      console.error('Error approving reply:', error);
      toast({
        title: "Error",
        description: "Failed to approve reply",
        variant: "destructive",
      });
    }
  };

  const handleRejectReply = async (replyId: string, reason?: string) => {
    try {
      const response = await fetch('/api/inbox/ai-reply', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          replyId,
          status: 'rejected',
          feedbackType: 'negative',
          comments: reason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject reply');
      }

      toast({
        title: "Reply Rejected",
        description: "AI reply has been rejected. Feedback will improve future suggestions.",
      });

    } catch (error) {
      console.error('Error rejecting reply:', error);
      toast({
        title: "Error",
        description: "Failed to reject reply",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateReply = async () => {
    if (activeThread) {
      // Clear current reply and generate new one
      setAiReply(null);
      await generateAIReply(activeThread.id);
    }
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hot_lead': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'showing_request': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'price_inquiry': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'seller_lead': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'buyer_lead': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'follow_up_required': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'contract_legal': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'marketing': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Get urgency indicator
  const getUrgencyIndicator = (urgency: string, leadScore: number) => {
    if (urgency === 'critical' || leadScore >= 90) {
      return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
    } else if (urgency === 'high' || leadScore >= 70) {
      return <div className="w-2 h-2 bg-orange-500 rounded-full" />;
    } else if (urgency === 'medium' || leadScore >= 50) {
      return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
    }
    return null;
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
                    threads.map((thread, index) => {
                      const analysis = threadAnalyses.get(thread.id);
                      return (
                        <motion.div
                          key={thread.id}
                          className={`p-4 border-b ${theme === 'black' ? 'border-white/5 hover:bg-white/5' : 'border-black/5 hover:bg-black/5'} cursor-pointer transition-all duration-300 ${
                            activeThread?.id === thread.id ? (theme === 'black' ? 'bg-white/10' : 'bg-black/10') : ''
                          } ${analysis?.urgency === 'critical' || (analysis?.leadScore >= 90) ? 'ring-1 ring-red-400/50' : ''}`}
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
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className={`font-medium ${theme === 'black' ? 'text-white' : 'text-black'} truncate`}>
                                    {thread.participants[0]?.name || thread.participants[0]?.email || 'Unknown'}
                                  </div>
                                  {analysis && getUrgencyIndicator(analysis.urgency, analysis.leadScore)}
                                </div>
                                <div className="flex items-center gap-1">
                                  {analysis && (
                                    <div className={`text-xs px-1.5 py-0.5 rounded border ${getCategoryColor(analysis.category)} font-medium`}>
                                      {analysis.leadScore}
                                    </div>
                                  )}
                                  {thread.hasAttachments && (
                                    <div className={`w-2 h-2 rounded-full bg-blue-500`} />
                                  )}
                                  {thread.unread && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                  )}
                                </div>
                              </div>

                              {/* AI Category Badge */}
                              {analysis?.category && (
                                <div className="mb-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(analysis.category)}`}>
                                    {analysis.category.replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                              )}

                              <div className={`text-sm font-medium ${theme === 'black' ? 'text-white/90' : 'text-black/90'} truncate mb-1`}>
                                {thread.subject}
                              </div>

                              <div className={`text-xs ${theme === 'black' ? 'text-white/60' : 'text-black/60'} truncate mb-2`}>
                                {analysis?.summary || thread.snippet}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`text-xs ${theme === 'black' ? 'text-white/40' : 'text-black/40'}`}>
                                    {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
                                  </div>
                                  {analysis && (
                                    <div className={`text-xs ${theme === 'black' ? 'text-white/40' : 'text-black/40'}`}>
                                      {analysis.contactIntent}
                                    </div>
                                  )}
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
                      );
                    })
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
                          onClick={() => generateAIReply(activeThread.id)}
                          disabled={actionLoading === `ai-reply-${activeThread.id}`}
                        >
                          <Bot className="h-4 w-4 mr-1" />
                          AI Reply
                        </Button>
                        <Button variant="outline" size="sm">
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
                          onClick={() => analyzeThread(activeThread.id)}
                          disabled={aiAnalyzing === activeThread.id}
                        >
                          <Sparkles className={`h-4 w-4 ${aiAnalyzing === activeThread.id ? 'animate-spin' : ''}`} />
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

                  {/* AI Analysis Panel */}
                  {threadAnalyses.get(activeThread.id) && (
                    <motion.div 
                      className={`p-4 border-b ${theme === 'black' ? 'border-white/10' : 'border-black/10'}`}
                      style={{
                        background: theme === 'black' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                        backdropFilter: 'blur(20px) saturate(1.3)',
                        WebkitBackdropFilter: 'blur(20px) saturate(1.3)'
                      }}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Bot className="h-4 w-4 text-purple-400" />
                        <span className={`font-semibold text-sm ${theme === 'black' ? 'text-white' : 'text-black'}`}>
                          AI Analysis
                        </span>
                      </div>
                      
                      {(() => {
                        const analysis = threadAnalyses.get(activeThread.id);
                        return (
                          <div className="grid grid-cols-4 gap-4 mb-3">
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${theme === 'black' ? 'text-white' : 'text-black'}`}>
                                {analysis.leadScore}/100
                              </div>
                              <div className={`text-xs ${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>Lead Score</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-sm font-bold ${
                                analysis.urgency === 'critical' ? 'text-red-400' :
                                analysis.urgency === 'high' ? 'text-orange-400' :
                                analysis.urgency === 'medium' ? 'text-yellow-400' : 'text-green-400'
                              }`}>
                                {analysis.urgency?.toUpperCase()}
                              </div>
                              <div className={`text-xs ${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>Urgency</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-sm font-bold ${theme === 'black' ? 'text-white' : 'text-black'}`}>
                                {analysis.contactIntent?.replace('_', ' ')}
                              </div>
                              <div className={`text-xs ${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>Intent</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-sm font-bold ${
                                analysis.sentiment === 'positive' ? 'text-green-400' :
                                analysis.sentiment === 'negative' ? 'text-red-400' : 'text-blue-400'
                              }`}>
                                {analysis.sentiment?.toUpperCase()}
                              </div>
                              <div className={`text-xs ${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>Sentiment</div>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="mb-3">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(threadAnalyses.get(activeThread.id).category)}`}>
                          {threadAnalyses.get(activeThread.id).category?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className={`text-sm ${theme === 'black' ? 'text-white/80' : 'text-black/80'} mb-2`}>
                        {threadAnalyses.get(activeThread.id).summary}
                      </div>

                      {threadAnalyses.get(activeThread.id).keyPoints && (
                        <div>
                          <div className={`text-xs font-semibold ${theme === 'black' ? 'text-white/60' : 'text-black/60'} mb-1`}>
                            Key Points:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {threadAnalyses.get(activeThread.id).keyPoints.map((point: string, i: number) => (
                              <span key={i} className={`text-xs px-2 py-0.5 rounded ${theme === 'black' ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'}`}>
                                {point}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {threadAnalyses.get(activeThread.id).propertyDetails && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className={`text-xs font-semibold ${theme === 'black' ? 'text-white/60' : 'text-black/60'} mb-2`}>
                            Property Information:
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {threadAnalyses.get(activeThread.id).propertyDetails.address && (
                              <div>
                                <span className="font-medium">Address:</span> {threadAnalyses.get(activeThread.id).propertyDetails.address}
                              </div>
                            )}
                            {threadAnalyses.get(activeThread.id).propertyDetails.priceRange && (
                              <div>
                                <span className="font-medium">Price:</span> {threadAnalyses.get(activeThread.id).propertyDetails.priceRange}
                              </div>
                            )}
                            {threadAnalyses.get(activeThread.id).propertyDetails.propertyType && (
                              <div>
                                <span className="font-medium">Type:</span> {threadAnalyses.get(activeThread.id).propertyDetails.propertyType}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

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

      {/* AI Reply Modal */}
      <AIReplyModal
        isOpen={showAiReplyModal}
        onClose={() => {
          setShowAiReplyModal(false);
          setAiReply(null);
        }}
        reply={aiReply}
        analysis={activeThread ? threadAnalyses[activeThread.id] : null}
        originalEmail={activeThread ? {
          subject: activeThread.subject,
          fromName: activeThread.participants[0]?.name || 'Unknown',
          fromEmail: activeThread.participants[0]?.email || 'unknown@example.com',
          body: activeThread.snippet || 'No preview available'
        } : null}
        onApprove={handleApproveReply}
        onReject={handleRejectReply}
        onRegenerate={handleRegenerateReply}
      />
    </div>
  );
}