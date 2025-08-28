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
import { ContextMenu } from '@/components/inbox/ContextMenu';
import { EmailContent } from '@/components/inbox/EmailContent';
import { CategoryModal } from '@/components/inbox/CategoryModal';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { internalFetch } from '@/lib/internal-url';
import { LeadScoreWidget } from '@/components/intelligence/LeadScoreWidget';
import { DraftPanel } from '@/components/inbox/DraftPanel';
import { ManualDraftButton } from '@/components/inbox/ManualDraftButton';

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
  // AI Analysis data from API
  aiAnalysis?: {
    category: string;
    priorityScore: number;
    leadScore: number;
    confidenceScore: number;
    sentimentScore: number;
    keyEntities: any;
    processingStatus: string;
    analyzedAt: string;
  };
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
  
  // Setup auto-sync with refresh on new content (every 10 minutes)
  const autoSync = useAutoSync({
    interval: 10, // Sync every 10 minutes for inbox
    enabled: true, // Enable auto-sync
    showToasts: true,
    runOnMount: true, // Run initial sync on page load
    onSyncComplete: (result) => {
      console.log('🔄 Auto-sync completed:', result);
      // Only refresh if new content was found
      if (result.email.newMessages || result.email.newThreads) {
        console.log(`📧 Found ${result.email.newMessages} new messages, ${result.email.newThreads} new threads - adding to list`);
        // Fetch only new threads and prepend them to the existing list
        fetchNewThreadsOnly();
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
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedThreadForCategory, setSelectedThreadForCategory] = useState<EmailThread | null>(null);
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [selectedThreadForPipeline, setSelectedThreadForPipeline] = useState<EmailThread | null>(null);
  const [lastManualSync, setLastManualSync] = useState<Date | null>(null);
  const [syncCountdown, setSyncCountdown] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'inbox' | 'drafts'>('inbox');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    thread: EmailThread | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    thread: null
  });

  // Fetch only new threads and prepend to existing list (no full refresh)
  const fetchNewThreadsOnly = async () => {
    try {
      console.log('🖆 Fetching new threads only...');
      
      // Get the timestamp of the most recent thread we have
      const newestThreadTime = threads.length > 0 
        ? new Date(threads[0].lastMessageAt).toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours if no threads
      
      const params = new URLSearchParams({
        page: '1',
        limit: '20', // Get recent threads
        filter: 'all',
        since: newestThreadTime // Only get threads newer than our newest
      });
      
      const response = await internalFetch(`/api/inbox/threads?${params}`);
      console.log(`📡 New threads API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ New threads API error: ${response.status} - ${errorText}`);
        return;
      }
      
      const data: ThreadsResponse = await response.json();
      
      // Validate and filter new threads
      const validThreads = data.threads.filter(thread => {
        const isValid = thread.id && typeof thread.id === 'string' && !thread.id.includes('http') && !thread.id.includes('://') && thread.id.length < 100;
        if (!isValid) {
          console.error('❌ Invalid new thread data detected and filtered:', { id: thread.id, subject: thread.subject?.substring(0, 50) });
        }
        return isValid;
      });
      
      const newThreads = validThreads.filter(newThread => 
        !threads.some(existingThread => existingThread.id === newThread.id)
      );
      
      if (newThreads.length > 0) {
        console.log(`✨ Adding ${newThreads.length} new threads to the top of the list`);
        setThreads(prev => [...newThreads, ...prev]);
        
        // Auto-analyze new threads
        for (const thread of newThreads.filter(t => !t.aiAnalysis).slice(0, 3)) {
          setTimeout(async () => {
            try {
              await analyzeThreadWithoutRefresh(thread.id);
            } catch (error) {
              console.error(`Failed to analyze new thread ${thread.id}:`, error);
            }
          }, 500);
        }
        
        // Update analysis for new threads after a delay
        setTimeout(() => {
          updateExistingThreadsAnalysis();
        }, 3000);
        
        toast({
          title: "New Emails",
          description: `${newThreads.length} new email${newThreads.length !== 1 ? 's' : ''} received`,
        });
      }
    } catch (error) {
      console.error('Error fetching new threads:', error);
    }
  };

  // Update AI analysis for existing threads without full refresh
  const updateExistingThreadsAnalysis = async () => {
    if (threads.length === 0) return;
    
    try {
      console.log('🤖 Updating AI analysis for existing threads...');
      
      const threadIds = threads.slice(0, 20).map(t => t.id); // Update first 20 threads
      const params = new URLSearchParams({
        threadIds: threadIds.join(','),
        analysisOnly: 'true'
      });
      
      const response = await internalFetch(`/api/inbox/ai-analysis?${params}`);
      if (response.ok) {
        const data = await response.json();
        const analyses = data.analyses || [];
        
        if (analyses.length > 0) {
          console.log(`📊 Updated analysis for ${analyses.length} threads`);
          
          // Update threads with new analysis data
          setThreads(prev => prev.map(thread => {
            const analysis = analyses.find((a: any) => a.threadId === thread.id);
            if (analysis) {
              return {
                ...thread,
                aiAnalysis: {
                  category: analysis.category,
                  priorityScore: analysis.priorityScore,
                  leadScore: analysis.leadScore,
                  confidenceScore: analysis.confidenceScore,
                  sentimentScore: analysis.sentimentScore,
                  keyEntities: analysis.keyEntities,
                  processingStatus: analysis.processingStatus,
                  analyzedAt: analysis.createdAt
                }
              };
            }
            return thread;
          }));
        }
      }
    } catch (error) {
      console.error('Error updating thread analysis:', error);
    }
  };

  // Fetch threads from API (full refresh)
  const fetchThreads = async (page = 1, filter = activeFilter, search = searchQuery, skipAutoAnalysis = false) => {
    try {
      console.log(`🔄 fetchThreads called: page=${page}, filter=${filter}, skipAutoAnalysis=${skipAutoAnalysis}`);
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        filter,
        ...(search && { search })
      });
      
      const response = await internalFetch(`/api/inbox/threads?${params}`);
      console.log(`📡 API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch threads: ${response.status} - ${errorText}`);
      }
      
      const data: ThreadsResponse = await response.json();
      console.log(`📧 Fetched ${data.threads.length} threads`);
      
      // Log threads with/without AI analysis for debugging
      // Validate all thread IDs before processing
      const validThreads = data.threads.filter(thread => {
        const isValid = thread.id && typeof thread.id === 'string' && !thread.id.includes('http') && !thread.id.includes('://') && thread.id.length < 100;
        if (!isValid) {
          console.error('❌ Invalid thread data detected and filtered:', { id: thread.id, subject: thread.subject?.substring(0, 50) });
        }
        return isValid;
      });
      
      if (validThreads.length !== data.threads.length) {
        console.warn(`⚠️ Filtered out ${data.threads.length - validThreads.length} invalid threads`);
      }
      
      const threadsWithAI = validThreads.filter(t => t.aiAnalysis);
      const threadsWithoutAI = validThreads.filter(t => !t.aiAnalysis);
      console.log(`🤖 Threads with AI analysis: ${threadsWithAI.length}/${validThreads.length}`);
      console.log(`❌ Threads without AI analysis: ${threadsWithoutAI.length}`);
      
      setThreads(validThreads);
      setPagination(data.pagination);
      
      // Auto-analyze threads without existing analysis (only on initial load, not on refresh)
      if (data.threads.length > 0 && !skipAutoAnalysis) {
        const threadsWithoutAnalysis = data.threads.filter(t => !t.aiAnalysis);
        if (threadsWithoutAnalysis.length > 0) {
          console.log(`Auto-analyzing ${threadsWithoutAnalysis.length} threads without analysis`);
          
          // Process analyses in parallel but with staggered timing to avoid rate limits
          const analysisPromises = threadsWithoutAnalysis.slice(0, 3).map((thread, index) => 
            new Promise(resolve => {
              setTimeout(async () => {
                try {
                  const result = await analyzeThreadWithoutRefresh(thread.id);
                  resolve(result);
                } catch (error) {
                  console.error(`Failed to auto-analyze thread ${thread.id}:`, error);
                  resolve(null);
                }
              }, index * 1000); // Stagger by 1 second each
            })
          );
          
          // Wait for all analyses to complete (no refresh needed since state updates immediately)
          Promise.all(analysisPromises).then(() => {
            console.log(`🔄 All ${analysisPromises.length} analyses completed and badges updated!`);
          });
        }
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

  // Polling mechanism to check for updated AI analysis every 30 seconds (without full refresh)
  useEffect(() => {
    const pollForUpdates = setInterval(() => {
      console.log('🔍 Polling for AI analysis updates...');
      updateExistingThreadsAnalysis();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollForUpdates);
  }, []);

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
    // Validate thread ID to prevent external URL injection
    if (!thread.id || typeof thread.id !== 'string' || thread.id.includes('http') || thread.id.includes('://')) {
      console.error('❌ Invalid thread ID detected:', thread.id);
      toast({
        title: "Error", 
        description: "Invalid thread selected",
        variant: "destructive"
      });
      return;
    }
    
    console.log('✅ Selecting thread with valid ID:', thread.id);
    setActiveThread(thread);
    
    // Mark as read if unread
    if (thread.unread) {
      await toggleReadStatus(thread.id, false);
    }
  };

  // Enhanced thread ID validation helper
  const validateThreadId = (threadId: string, functionName: string): boolean => {
    if (!threadId || typeof threadId !== 'string' || 
        threadId.includes('http') || 
        threadId.includes('://') || 
        threadId.includes('trk.') ||
        threadId.includes('.com') ||
        threadId.includes('promotions.') ||
        threadId.includes('tracking.') ||
        threadId.length > 50 ||
        threadId.includes('wf/open') ||
        threadId.includes('upn=')) {
      console.error(`❌ BLOCKED: Invalid/external thread ID in ${functionName}:`, threadId);
      console.error(`❌ Thread ID length: ${threadId?.length}`);
      console.error(`❌ Call stack:`, new Error().stack);
      toast({
        title: "Security Error",
        description: `External URL detected as thread ID in ${functionName} - blocked for security`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  // Toggle star status
  const toggleStarStatus = async (threadId: string, currentStarred: boolean) => {
    if (!validateThreadId(threadId, 'toggleStarStatus')) return;
    
    try {
      setActionLoading(`star-${threadId}`);
      const response = await internalFetch(`/api/inbox/threads/${threadId}/star`, {
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
    if (!validateThreadId(threadId, 'toggleReadStatus')) return;
    
    try {
      setActionLoading(`read-${threadId}`);
      const response = await internalFetch(`/api/inbox/threads/${threadId}/read`, {
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
    if (!validateThreadId(threadId, 'archiveThread')) return;
    
    try {
      setActionLoading(`archive-${threadId}`);
      const response = await internalFetch(`/api/inbox/threads/${threadId}/archive`, {
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
    if (!validateThreadId(threadId, 'deleteThread')) return;
    
    if (!confirm('Are you sure you want to delete this thread?')) {
      return;
    }

    try {
      setActionLoading(`delete-${threadId}`);
      const response = await internalFetch(`/api/inbox/threads/${threadId}/delete`, {
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


  // Trigger AI analysis for a thread (with refresh)
  const analyzeThread = async (threadId: string) => {
    const result = await analyzeThreadWithoutRefresh(threadId);
    // No need to refresh since analyzeThreadWithoutRefresh updates state immediately
    return result;
  };

  // Trigger AI analysis for a thread (without refresh to prevent loops)
  const analyzeThreadWithoutRefresh = async (threadId: string) => {
    if (!validateThreadId(threadId, 'analyzeThreadWithoutRefresh')) return null;
    
    try {
      console.log(`🤖 Starting AI analysis for thread: ${threadId}`);
      setAiAnalyzing(threadId);
      
      // First get thread details to extract email content
      const threadResponse = await internalFetch(`/api/inbox/threads/${threadId}`);
      if (!threadResponse.ok) {
        throw new Error('Failed to fetch thread details');
      }
      
      const threadData = await threadResponse.json();
      if (!threadData.messages || threadData.messages.length === 0) {
        throw new Error('No messages found in thread');
      }
      
      // Use the latest message for analysis
      const latestMessage = threadData.messages[threadData.messages.length - 1];
      
      // Extract text content from HTML if available, with image detection
      const extractTextFromHtml = (html: string) => {
        if (!html) return '';
        
        try {
          // First sanitize dangerous URL schemes
          const sanitizedHtml = html
            .replace(/mailto:/gi, '#')
            .replace(/tel:/gi, '#')
            .replace(/javascript:/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
          
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = sanitizedHtml;
          const styleElements = tempDiv.querySelectorAll('style, script');
          styleElements.forEach(el => el.remove());
          
          // Check if HTML contains images
          const images = tempDiv.querySelectorAll('img');
          const hasImages = images.length > 0;
          
          // If no images, default to text-only content
          if (!hasImages) {
            return tempDiv.textContent || tempDiv.innerText || '';
          }
          
          // If has images, preserve some basic HTML structure but clean it
          const cleanHtml = tempDiv.innerHTML
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/onclick\s*=\s*["'][^"']*["']/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/mailto:/gi, '#')
            .replace(/tel:/gi, '#');
          
          return cleanHtml;
        } catch (error) {
          console.warn('Error extracting text from HTML:', error);
          return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      };
      
      const emailContent = latestMessage.htmlBody 
        ? extractTextFromHtml(latestMessage.htmlBody)
        : latestMessage.textBody || latestMessage.subject;
      
      console.log('📧 AI Analysis - Email data:', {
        emailId: latestMessage.id,
        threadId: threadId,
        fromName: latestMessage.from?.name || 'Unknown',
        fromEmail: latestMessage.from?.email || 'unknown@example.com',
        subject: latestMessage.subject || threadData.subject,
        bodyLength: emailContent?.length || 0,
        bodyPreview: emailContent?.substring(0, 100) || 'No content'
      });
      
      const response = await internalFetch('/api/inbox/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailId: latestMessage.id,
          threadId: threadId,
          fromName: latestMessage.from?.name || 'Unknown',
          fromEmail: latestMessage.from?.email || 'unknown@example.com',
          subject: latestMessage.subject || threadData.subject,
          body: emailContent
        })
      });

      console.log('📊 AI Analysis response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI Analysis failed:', response.status, errorText);
        throw new Error(`Failed to analyze thread: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ AI Analysis result:', data);
      if (data.analysis) {
        console.log(`🏷️ Analysis saved for thread ${threadId}: ${data.analysis.category} (${data.analysis.leadScore}/100)`);
        
        // Update the thread in local state immediately
        setThreads(prev => prev.map(thread => 
          thread.id === threadId 
            ? { 
                ...thread, 
                aiAnalysis: {
                  category: data.analysis.category,
                  priorityScore: data.analysis.priorityScore,
                  leadScore: data.analysis.leadScore,
                  confidenceScore: data.analysis.confidenceScore,
                  sentimentScore: data.analysis.sentimentScore,
                  keyEntities: data.analysis.keyEntities,
                  processingStatus: data.analysis.processingStatus,
                  analyzedAt: new Date().toISOString()
                }
              }
            : thread
        ));
        
        // Update activeThread if it's the one being analyzed
        if (activeThread?.id === threadId) {
          setActiveThread(prev => prev ? {
            ...prev,
            aiAnalysis: {
              category: data.analysis.category,
              priorityScore: data.analysis.priorityScore,
              leadScore: data.analysis.leadScore,
              confidenceScore: data.analysis.confidenceScore,
              sentimentScore: data.analysis.sentimentScore,
              keyEntities: data.analysis.keyEntities,
              processingStatus: data.analysis.processingStatus,
              analyzedAt: new Date().toISOString()
            }
          } : null);
        }
        
        toast({
          title: "AI Analysis Complete",
          description: `Category: ${data.analysis.category} | Lead Score: ${data.analysis.leadScore}/100`,
        });
        return data.analysis;
      } else {
        console.warn(`⚠️ No analysis data returned for thread ${threadId}`);
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
    return null;
  };

  // Generate AI reply
  const generateAIReply = async (threadId: string) => {
    if (!validateThreadId(threadId, 'generateAIReply')) return;
    
    try {
      setActionLoading(`ai-reply-${threadId}`);
      
      // First get thread details to extract email content
      const threadResponse = await internalFetch(`/api/inbox/threads/${threadId}`);
      if (!threadResponse.ok) {
        throw new Error('Failed to fetch thread details');
      }
      
      const threadData = await threadResponse.json();
      if (!threadData.messages || threadData.messages.length === 0) {
        throw new Error('No messages found in thread');
      }
      
      // Use the latest message for reply generation
      const latestMessage = threadData.messages[threadData.messages.length - 1];
      
      // Extract text content from HTML if available, with image detection
      const extractTextFromHtml = (html: string) => {
        if (!html) return '';
        
        try {
          // First sanitize dangerous URL schemes
          const sanitizedHtml = html
            .replace(/mailto:/gi, '#')
            .replace(/tel:/gi, '#')
            .replace(/javascript:/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
          
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = sanitizedHtml;
          const styleElements = tempDiv.querySelectorAll('style, script');
          styleElements.forEach(el => el.remove());
          
          // Check if HTML contains images
          const images = tempDiv.querySelectorAll('img');
          const hasImages = images.length > 0;
          
          // If no images, default to text-only content
          if (!hasImages) {
            return tempDiv.textContent || tempDiv.innerText || '';
          }
          
          // If has images, preserve some basic HTML structure but clean it
          const cleanHtml = tempDiv.innerHTML
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/onclick\s*=\s*["'][^"']*["']/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/mailto:/gi, '#')
            .replace(/tel:/gi, '#');
          
          return cleanHtml;
        } catch (error) {
          console.warn('Error extracting text from HTML:', error);
          return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      };
      
      const emailContent = latestMessage.htmlBody 
        ? extractTextFromHtml(latestMessage.htmlBody)
        : latestMessage.textBody || latestMessage.subject;

      console.log('🤖 AI Reply - Email data:', {
        emailId: latestMessage.id,
        threadId: threadId,
        fromName: latestMessage.from?.name || 'Unknown',
        fromEmail: latestMessage.from?.email || 'unknown@example.com',
        subject: latestMessage.subject || threadData.subject,
        bodyLength: emailContent?.length || 0,
        bodyPreview: emailContent?.substring(0, 100) || 'No content'
      });

      const response = await internalFetch('/api/inbox/ai-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailId: latestMessage.id,
          threadId,
          fromName: latestMessage.from?.name || 'Unknown',
          fromEmail: latestMessage.from?.email || 'unknown@example.com',
          subject: latestMessage.subject || threadData.subject,
          body: emailContent,
          agentName: 'Real Estate Agent',
          brokerage: 'Rivor Realty'
        })
      });

      console.log('🔄 AI Reply response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI Reply failed:', response.status, errorText);
        throw new Error(`Failed to generate AI reply: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ AI Reply result:', data);
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
      const response = await internalFetch('/api/inbox/ai-reply', {
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
        await fetchThreads(pagination.page, activeFilter, searchQuery, true);
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
      const response = await internalFetch('/api/inbox/ai-reply', {
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

  // Context menu handlers
  const handleContextMenu = (event: React.MouseEvent, thread: EmailThread) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      thread
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      thread: null
    });
  };

  // Handle category badge click to open modal
  const handleCategoryBadgeClick = (thread: EmailThread, event?: React.MouseEvent) => {
    event?.stopPropagation?.();
    
    console.log('CategoryBadgeClick called with:', {
      threadId: thread?.id,
      hasThread: !!thread,
      hasAiAnalysis: !!thread?.aiAnalysis,
      category: thread?.aiAnalysis?.category,
      threadObject: thread
    });
    
    // Validate that the thread exists and has required properties
    if (!thread || !thread.id) {
      console.error('CategoryBadgeClick: Invalid thread object', thread);
      toast({
        title: "Error",
        description: "Invalid email thread. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    // Validate that the thread has AI analysis before opening modal
    if (!thread.aiAnalysis || !thread.aiAnalysis.category) {
      console.warn('Attempted to open category modal for thread without AI analysis:', thread.id);
      toast({
        title: "Category Update Unavailable",
        description: "This email hasn't been analyzed yet. Please wait for AI analysis to complete.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('Setting selectedThreadForCategory and showing modal');
      setSelectedThreadForCategory(thread);
      setShowCategoryModal(true);
    } catch (error) {
      console.error('Error in handleCategoryBadgeClick:', error);
      toast({
        title: "Error",
        description: "Failed to open category modal. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle category change
  const handleCategoryChange = async (threadId: string, newCategory: string) => {
    try {
      // Update local state optimistically
      setThreads(prev => prev.map(t => 
        t.id === threadId 
          ? { 
              ...t, 
              aiAnalysis: { 
                ...(t.aiAnalysis || {}), 
                category: newCategory 
              } 
            }
          : t
      ));

      if (activeThread?.id === threadId) {
        setActiveThread(prev => prev 
          ? { 
              ...prev, 
              aiAnalysis: { 
                ...(prev.aiAnalysis || {}), 
                category: newCategory 
              } 
            }
          : null
        );
      }

      toast({
        title: "Category Updated",
        description: `Email category changed to ${newCategory.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating category:', error);
      // Refresh threads to get correct state
      await fetchThreads(pagination.page, activeFilter, searchQuery, true);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  // Handle add to pipeline
  const handleAddToPipeline = (thread: EmailThread, event?: React.MouseEvent) => {
    event?.stopPropagation?.();
    
    // Validate that the thread exists and has participants
    if (!thread || !thread.participants || thread.participants.length === 0) {
      console.warn('Attempted to add thread to pipeline without valid thread data:', thread?.id);
      toast({
        title: "Add to Pipeline Unavailable",
        description: "Unable to add this email to pipeline. Thread data is incomplete.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedThreadForPipeline(thread);
    setShowPipelineModal(true);
  };

  // Handle manual sync with rate limiting
  const handleManualSync = async () => {
    const now = Date.now();
    if (lastManualSync && now - lastManualSync.getTime() < 2 * 60 * 1000) {
      const remainingTime = Math.ceil((2 * 60 * 1000 - (now - lastManualSync.getTime())) / 1000);
      toast({
        title: "Sync Rate Limited",
        description: `Please wait ${remainingTime} seconds before syncing again`,
        variant: "destructive",
      });
      return;
    }

    setLastManualSync(new Date());
    if (autoSync?.triggerSync) {
      await autoSync.triggerSync();
    } else {
      console.error('autoSync.triggerSync is not available');
      toast({
        title: "Sync Error",
        description: "Sync function is not available. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  // Sync countdown timer with safety checks
  useEffect(() => {
    const updateCountdown = () => {
      try {
        if (autoSync?.nextSync && autoSync.nextSync instanceof Date) {
          const timeUntilSync = Math.max(0, Math.floor((autoSync.nextSync.getTime() - Date.now()) / 1000));
          setSyncCountdown(timeUntilSync);
        } else {
          setSyncCountdown(0);
        }
      } catch (error) {
        console.error('Error updating sync countdown:', error);
        setSyncCountdown(0);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [autoSync?.nextSync]);

  // Handle pipeline form submission
  const handlePipelineSubmit = async (pipelineData: any) => {
    try {
      const response = await internalFetch(`/api/inbox/threads/${selectedThreadForPipeline?.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_to_pipeline',
          data: pipelineData
        })
      });

      if (response.ok) {
        toast({
          title: "Added to Pipeline",
          description: "Contact has been added to your sales pipeline",
        });
        setShowPipelineModal(false);
        // Refresh to show pipeline status
        await fetchThreads(pagination.page, activeFilter, searchQuery, true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add to pipeline');
      }
    } catch (error) {
      console.error('Error adding to pipeline:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add to pipeline",
        variant: "destructive",
      });
    }
  };

  const handleContextMenuAction = async (action: string, threadId: string) => {
    try {
      switch (action) {
        case 'mark-read':
        case 'mark-unread':
          await updateThread(threadId, { isRead: action === 'mark-read' });
          break;
        case 'star':
        case 'unstar':
          await updateThread(threadId, { starred: action === 'star' });
          break;
        case 'archive':
          await updateThread(threadId, { labels: ['archived'] });
          break;
        case 'delete':
          // Implement delete functionality
          toast({
            title: "Delete",
            description: "Delete functionality coming soon",
          });
          break;
        case 'reply':
          // Set active thread and show reply interface
          const thread = threads.find(t => t.id === threadId);
          if (thread) {
            setActiveThread(thread);
            await generateAIReply(threadId);
          }
          break;
        case 'reply-all':
        case 'forward':
        case 'add-label':
        case 'more':
          toast({
            title: action.charAt(0).toUpperCase() + action.slice(1),
            description: `${action} functionality coming soon`,
          });
          break;
        default:
          console.warn('Unknown action:', action);
      }
    } catch (error) {
      console.error('Context menu action error:', error);
      toast({
        title: "Error",
        description: "Failed to perform action",
        variant: "destructive",
      });
    }
  };

  const updateThread = async (threadId: string, updates: { isRead?: boolean; starred?: boolean; labels?: string[] }) => {
    try {
      const response = await internalFetch(`/api/inbox/thread/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update thread');
      }

      // Update local state
      setThreads(prevThreads => 
        prevThreads.map(thread => 
          thread.id === threadId 
            ? { ...thread, ...updates, unread: updates.isRead === false }
            : thread
        )
      );

      if (activeThread?.id === threadId) {
        setActiveThread(prev => prev ? { ...prev, ...updates, unread: updates.isRead === false } : null);
      }

      toast({
        title: "Success",
        description: "Thread updated successfully",
      });

    } catch (error) {
      console.error('Error updating thread:', error);
      toast({
        title: "Error",
        description: "Failed to update thread",
        variant: "destructive",
      });
    }
  };

  // Get category emoji
  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'hot_lead': 
      case 'hot-lead': return '🔥';
      case 'showing_request':
      case 'showing-request': return '🏠';
      case 'buyer_lead':
      case 'buyer-lead': return '🛒';
      case 'seller_lead':
      case 'seller-lead': return '💰';
      case 'price_inquiry':
      case 'price-inquiry': return '🧮';
      case 'follow_up':
      case 'follow-up':
      case 'follow_up_required': return '⏰';
      case 'contract':
      case 'contract_legal': return '📄';
      case 'marketing': return '🧊';
      default: return '📧';
    }
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hot-lead': return 'bg-red-600/30 text-red-200 border-red-400/50';
      case 'showing-request': return 'bg-blue-600/30 text-blue-200 border-blue-400/50';
      case 'price-inquiry': return 'bg-green-600/30 text-green-200 border-green-400/50';
      case 'seller-lead': return 'bg-purple-600/30 text-purple-200 border-purple-400/50';
      case 'buyer-lead': return 'bg-orange-600/30 text-orange-200 border-orange-400/50';
      case 'follow-up': return 'bg-yellow-600/30 text-yellow-200 border-yellow-400/50';
      case 'contract': return 'bg-indigo-600/30 text-indigo-200 border-indigo-400/50';
      case 'marketing': return 'bg-gray-600/30 text-gray-200 border-gray-400/50';
      // Handle legacy underscore versions
      case 'hot_lead': return 'bg-red-600/30 text-red-200 border-red-400/50';
      case 'showing_request': return 'bg-blue-600/30 text-blue-200 border-blue-400/50';
      case 'price_inquiry': return 'bg-green-600/30 text-green-200 border-green-400/50';
      case 'seller_lead': return 'bg-purple-600/30 text-purple-200 border-purple-400/50';
      case 'buyer_lead': return 'bg-orange-600/30 text-orange-200 border-orange-400/50';
      case 'follow_up_required': return 'bg-yellow-600/30 text-yellow-200 border-yellow-400/50';
      case 'contract_legal': return 'bg-indigo-600/30 text-indigo-200 border-indigo-400/50';
      default: return 'bg-gray-600/30 text-gray-200 border-gray-400/50';
    }
  };

  // Get urgency indicator
  const getUrgencyIndicator = (urgency: string | undefined, leadScore: number | undefined) => {
    if (urgency === 'critical' || (leadScore && leadScore >= 90)) {
      return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
    } else if (urgency === 'high' || (leadScore && leadScore >= 70)) {
      return <div className="w-2 h-2 bg-orange-500 rounded-full" />;
    } else if (urgency === 'medium' || (leadScore && leadScore >= 50)) {
      return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
    }
    return null;
  };

  // Pipeline Form Component
  const PipelineForm = ({ thread, onSubmit, onCancel, theme }: {
    thread: EmailThread;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    theme: string;
  }) => {
    const [formData, setFormData] = useState({
      contactName: thread.participants[0]?.name || '',
      contactEmail: thread.participants[0]?.email || '',
      contactPhone: '',
      propertyAddress: '',
      propertyType: 'Single Family Home',
      budget: '',
      timeline: '3 months',
      notes: `Created from email: ${thread.subject}`,
      stage: 'new_lead'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'black' ? 'text-white/80' : 'text-black/80'}`}>
              Contact Name *
            </label>
            <input
              type="text"
              required
              value={formData.contactName}
              onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
              className={`w-full px-3 py-2 rounded border ${theme === 'black' ? 'bg-white/5 border-white/20 text-white' : 'bg-black/5 border-black/20 text-black'}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'black' ? 'text-white/80' : 'text-black/80'}`}>
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.contactEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              className={`w-full px-3 py-2 rounded border ${theme === 'black' ? 'bg-white/5 border-white/20 text-white' : 'bg-black/5 border-black/20 text-black'}`}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'black' ? 'text-white/80' : 'text-black/80'}`}>
              Phone
            </label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              className={`w-full px-3 py-2 rounded border ${theme === 'black' ? 'bg-white/5 border-white/20 text-white' : 'bg-black/5 border-black/20 text-black'}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'black' ? 'text-white/80' : 'text-black/80'}`}>
              Property Address
            </label>
            <input
              type="text"
              value={formData.propertyAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, propertyAddress: e.target.value }))}
              className={`w-full px-3 py-2 rounded border ${theme === 'black' ? 'bg-white/5 border-white/20 text-white' : 'bg-black/5 border-black/20 text-black'}`}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'black' ? 'text-white/80' : 'text-black/80'}`}>
              Budget
            </label>
            <input
              type="text"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
              placeholder="$400,000"
              className={`w-full px-3 py-2 rounded border ${theme === 'black' ? 'bg-white/5 border-white/20 text-white' : 'bg-black/5 border-black/20 text-black'}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'black' ? 'text-white/80' : 'text-black/80'}`}>
              Timeline
            </label>
            <select
              value={formData.timeline}
              onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
              className={`w-full px-3 py-2 rounded border ${theme === 'black' ? 'bg-white/5 border-white/20 text-white' : 'bg-black/5 border-black/20 text-black'}`}
            >
              <option value="Immediate">Immediate</option>
              <option value="1 month">1 month</option>
              <option value="3 months">3 months</option>
              <option value="6 months">6 months</option>
              <option value="1+ years">1+ years</option>
            </select>
          </div>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'black' ? 'text-white/80' : 'text-black/80'}`}>
            Notes
          </label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className={`w-full px-3 py-2 rounded border ${theme === 'black' ? 'bg-white/5 border-white/20 text-white' : 'bg-black/5 border-black/20 text-black'}`}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="liquid">
            <Users className="h-4 w-4 mr-2" />
            Add to Pipeline
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
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
                  <p className={`text-sm ${theme === 'black' ? 'text-white/60' : 'text-black/60'} min-h-[20px] flex items-center`}>
                    <span className="min-w-[120px]">
                      {pagination.total} threads • {threads.filter(t => t.unread).length} unread
                    </span>
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
                  onClick={handleManualSync}
                  disabled={loading || autoSync?.isRunning || (lastManualSync && Date.now() - lastManualSync.getTime() < 2 * 60 * 1000)}
                  className="relative min-w-[140px]"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading || autoSync.isRunning ? 'animate-spin' : ''}`} />
                  <span className="text-xs font-medium">
                    {autoSync?.isRunning ? 'Syncing...' : 
                     lastManualSync && Date.now() - lastManualSync.getTime() < 2 * 60 * 1000 ? 
                     `Wait ${Math.ceil((2 * 60 * 1000 - (Date.now() - lastManualSync.getTime())) / 1000)}s` :
                     syncCountdown > 0 ? `Next: ${Math.floor(syncCountdown / 60)}:${(syncCountdown % 60).toString().padStart(2, '0')}` :
                     'Sync'}
                  </span>
                </Button>
                <Button 
                  variant="liquid" 
                  size="sm"
                  onClick={() => setShowComposeModal(true)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Compose
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                {[
                  { key: 'inbox', label: 'Inbox', icon: Mail, count: threads.filter(t => t.unread).length },
                  { key: 'drafts', label: 'AI Drafts', icon: Bot, count: null },
                ].map(tab => (
                  <Button
                    key={tab.key}
                    variant={activeTab === tab.key ? "liquid" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab(tab.key as 'inbox' | 'drafts')}
                    className="text-xs relative"
                  >
                    <tab.icon className="h-3 w-3 mr-1" />
                    {tab.label}
                    {tab.count !== null && tab.count > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                        {tab.count > 9 ? '9+' : tab.count}
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Search and Filters - Only show for inbox tab */}
            {activeTab === 'inbox' && (
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
            )}
          </motion.div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {activeTab === 'inbox' ? (
              <>
                {/* Thread List Panel - Made narrower */}
                <motion.div 
                  className={`w-80 border-r ${theme === 'black' ? 'border-white/10' : 'border-black/10'} flex flex-col`}
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
                    threads.filter(thread => thread.id && !thread.id.includes('http')).map((thread, index) => {
                      const analysis = thread.aiAnalysis;
                      return (
                        <motion.div
                          key={thread.id}
                          className={`p-3 border-b ${theme === 'black' ? 'border-white/5 hover:bg-white/5' : 'border-black/5 hover:bg-black/5'} cursor-pointer transition-all duration-300 ${
                            activeThread?.id === thread.id ? (theme === 'black' ? 'bg-white/10' : 'bg-black/10') : ''
                          } ${analysis?.urgency === 'critical' || (analysis?.leadScore >= 90) ? 'ring-1 ring-red-400/50' : ''}`}
                          onClick={() => handleThreadSelect(thread)}
                          onContextMenu={(e) => handleContextMenu(e, thread)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          style={{ minHeight: '120px' }}
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
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <div className={`text-sm font-medium ${theme === 'black' ? 'text-white' : 'text-black'} truncate min-w-0`}>
                                    {thread.participants[0]?.name || thread.participants[0]?.email || 'Unknown'}
                                  </div>
                                  <div className="w-2 h-2 flex items-center justify-center min-w-[8px]">
                                    {analysis ? getUrgencyIndicator(analysis.keyEntities?.urgency, analysis.leadScore) : <div className="w-2 h-2" />}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-8 flex justify-end min-h-[20px] items-center">
                                    {analysis ? (
                                      <div className={`text-xs px-1.5 py-0.5 rounded border ${getCategoryColor(analysis.category)} font-medium min-w-[24px] text-center`}>
                                        {analysis.leadScore}
                                      </div>
                                    ) : (
                                      <div className="w-6 h-4" />
                                    )}
                                  </div>
                                  {thread.hasAttachments && (
                                    <div className={`w-2 h-2 rounded-full bg-blue-500`} />
                                  )}
                                  {thread.unread && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                  )}
                                </div>
                              </div>

                              {/* AI Category Badge - Clickable */}
                              <div className="mb-1 flex items-center gap-2 min-h-[24px]">
                                {analysis?.category ? (
                                  <>
                                    <button
                                      onClick={(e) => handleCategoryBadgeClick(thread, e)}
                                      className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(analysis.category)} hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1`}
                                    >
                                      <span>{getCategoryEmoji(analysis.category)}</span>
                                      {analysis.category.replace('_', ' ').toUpperCase()}
                                    </button>
                                    <button
                                      onClick={(e) => handleAddToPipeline(thread, e)}
                                      className="text-xs px-2 py-0.5 rounded-full border border-green-400/50 bg-green-600/20 text-green-200 hover:opacity-80 transition-opacity cursor-pointer"
                                      title="Add to Pipeline"
                                    >
                                      + PIPELINE
                                    </button>
                                  </>
                                ) : (
                                  <div className="h-6" />
                                )}
                              </div>

                              <div className={`text-xs font-medium ${theme === 'black' ? 'text-white/90' : 'text-black/90'} truncate mb-1 min-h-[16px] leading-4`}>
                                {thread.subject || 'No Subject'}
                              </div>

                              <div className={`text-xs ${theme === 'black' ? 'text-white/60' : 'text-black/60'} mb-1 min-h-[32px] leading-4`}>
                                <div className="line-clamp-2 break-words">
                                  {analysis?.keyEntities?.summary || thread.snippet || ''}
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`text-xs ${theme === 'black' ? 'text-white/40' : 'text-black/40'}`}>
                                    {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
                                  </div>
                                  <div className={`text-xs ${theme === 'black' ? 'text-white/40' : 'text-black/40'} min-w-0 truncate min-h-[16px] flex items-center`}>
                                    <span>{analysis?.keyEntities?.contactIntent || ''}</span>
                                  </div>
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
                        <h2 className={`text-xl font-bold ${theme === 'black' ? 'text-white' : 'text-black'} mb-2 line-clamp-2 min-h-[56px]`}>
                          {activeThread.subject}
                        </h2>
                        <div className={`flex items-center gap-4 text-sm ${theme === 'black' ? 'text-white/60' : 'text-black/60'} min-h-[20px]`}>
                          <div className="truncate flex-1">
                            From: {activeThread.participants[0]?.name} &lt;{activeThread.participants[0]?.email}&gt;
                          </div>
                          <div className="flex-shrink-0">
                            {new Date(activeThread.lastMessageAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 min-w-[400px]">
                        <Button 
                          variant="liquid" 
                          size="sm"
                          onClick={() => generateAIReply(activeThread.id)}
                          disabled={actionLoading === `ai-reply-${activeThread.id}`}
                        >
                          <Bot className="h-4 w-4 mr-1" />
                          AI Reply
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Reply",
                              description: "Manual reply functionality - opening AI reply for now",
                            });
                            generateAIReply(activeThread.id);
                          }}
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Forward",
                              description: "Forward functionality coming soon",
                            });
                          }}
                        >
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
                        {activeThread.aiAnalysis && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCategoryBadgeClick(activeThread)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Category
                          </Button>
                        )}
                        {activeThread.aiAnalysis && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAddToPipeline(activeThread)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Pipeline
                          </Button>
                        )}
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

                  {/* Lead Intelligence Panel - New Smart Feature */}
                  {activeThread.participants && activeThread.participants.length > 0 && (
                    <div className={`p-4 border-b ${theme === 'black' ? 'border-white/10' : 'border-black/10'}`}>
                      <LeadScoreWidget 
                        contactId={undefined} // Will search by email
                        autoRefresh={true}
                        className="mb-4"
                      />
                    </div>
                  )}

                  {/* AI Analysis Panel */}
                  {activeThread.aiAnalysis && (
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
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-purple-400" />
                          <span className={`font-semibold text-sm ${theme === 'black' ? 'text-white' : 'text-black'}`}>
                            AI Analysis
                          </span>
                        </div>
                        <ManualDraftButton
                          emailId={(() => {
                            // Find the latest message in the thread to get emailId
                            // This is a simplified approach - in reality you'd pass this data properly
                            return activeThread.id; // Using thread ID as fallback
                          })()}
                          threadId={activeThread.id}
                          analysis={activeThread.aiAnalysis}
                          onDraftCreated={() => {
                            toast({
                              title: "Draft Created",
                              description: "Check the AI Drafts tab to review and send",
                            });
                          }}
                        />
                      </div>
                      
                      {(() => {
                        const analysis = activeThread.aiAnalysis;
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
                                analysis.keyEntities?.urgency === 'critical' ? 'text-red-400' :
                                analysis.keyEntities?.urgency === 'high' ? 'text-orange-400' :
                                analysis.keyEntities?.urgency === 'medium' ? 'text-yellow-400' : 'text-green-400'
                              }`}>
                                {analysis.keyEntities?.urgency?.toUpperCase() || 'LOW'}
                              </div>
                              <div className={`text-xs ${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>Urgency</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-sm font-bold ${theme === 'black' ? 'text-white' : 'text-black'}`}>
                                {analysis.keyEntities?.contactIntent?.replace('_', ' ') || 'Unknown'}
                              </div>
                              <div className={`text-xs ${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>Intent</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-sm font-bold ${
                                analysis.sentimentScore > 0.6 ? 'text-green-400' :
                                analysis.sentimentScore < 0.4 ? 'text-red-400' : 'text-blue-400'
                              }`}>
                                {analysis.sentimentScore > 0.6 ? 'POSITIVE' :
                                 analysis.sentimentScore < 0.4 ? 'NEGATIVE' : 'NEUTRAL'}
                              </div>
                              <div className={`text-xs ${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>Sentiment</div>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="mb-3">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(activeThread.aiAnalysis.category)} flex items-center gap-1 w-fit`}>
                          <span>{getCategoryEmoji(activeThread.aiAnalysis.category)}</span>
                          {activeThread.aiAnalysis.category?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className={`text-sm ${theme === 'black' ? 'text-white/80' : 'text-black/80'} mb-2`}>
                        {activeThread.aiAnalysis.keyEntities?.summary || 'No summary available'}
                      </div>

                      {activeThread.aiAnalysis.keyEntities?.keyPoints && (
                        <div>
                          <div className={`text-xs font-semibold ${theme === 'black' ? 'text-white/60' : 'text-black/60'} mb-1`}>
                            Key Points:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {activeThread.aiAnalysis.keyEntities.keyPoints.map((point: string, i: number) => (
                              <span key={i} className={`text-xs px-2 py-0.5 rounded ${theme === 'black' ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'}`}>
                                {point}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeThread.aiAnalysis.keyEntities?.propertyDetails && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className={`text-xs font-semibold ${theme === 'black' ? 'text-white/60' : 'text-black/60'} mb-2`}>
                            Property Information:
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {activeThread.aiAnalysis.keyEntities.propertyDetails.address && (
                              <div>
                                <span className="font-medium">Address:</span> {activeThread.aiAnalysis.keyEntities.propertyDetails.address}
                              </div>
                            )}
                            {activeThread.aiAnalysis.keyEntities.propertyDetails.priceRange && (
                              <div>
                                <span className="font-medium">Price:</span> {activeThread.aiAnalysis.keyEntities.propertyDetails.priceRange}
                              </div>
                            )}
                            {activeThread.aiAnalysis.keyEntities.propertyDetails.propertyType && (
                              <div>
                                <span className="font-medium">Type:</span> {activeThread.aiAnalysis.keyEntities.propertyDetails.propertyType}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Thread Content */}
                  <EmailContent 
                    threadId={activeThread.id}
                    onAction={handleContextMenuAction}
                  />
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
              </>
            ) : (
              /* Drafts Tab */
              <motion.div 
                className="flex-1 flex"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Draft Panel */}
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
                  <DraftPanel theme={theme} onDraftAction={(action, draftId) => {
                    console.log('Draft action:', action, draftId);
                    if (action === 'send') {
                      // Refresh threads to show sent status
                      fetchThreads(pagination.page, activeFilter, searchQuery, true);
                    }
                  }} />
                </motion.div>

                {/* Draft Detail/Info Panel */}
                <motion.div 
                  className="flex-1 flex flex-col"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md">
                      <Bot className={`h-16 w-16 ${theme === 'black' ? 'text-white/40' : 'text-black/40'} mx-auto mb-4`} />
                      <h3 className={`text-xl font-medium ${theme === 'black' ? 'text-white/60' : 'text-black/60'} mb-2`}>
                        AI Draft Center
                      </h3>
                      <p className={`${theme === 'black' ? 'text-white/40' : 'text-black/40'} mb-4`}>
                        AI automatically creates drafts for high-priority emails like showing requests and hot leads. 
                        Review, edit, and send drafts with one click.
                      </p>
                      <div className={`text-sm ${theme === 'black' ? 'text-white/60' : 'text-black/60'} space-y-2`}>
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>Hot Lead: Auto-draft when lead score ≥ 70</span>
                        </div>
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Showing Request: Auto-draft for property inquiries</span>
                        </div>
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Lead Follow-up: Personalized responses</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
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
        analysis={activeThread ? activeThread.aiAnalysis : null}
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

      {/* Compose Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            className={`w-full max-w-4xl mx-4 rounded-lg shadow-2xl ${
              theme === 'black' ? 'bg-black/90 border-white/10' : 'bg-white border-black/10'
            } border`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className={`p-6 border-b ${theme === 'black' ? 'border-white/10' : 'border-black/10'}`}>
              <h2 className={`text-xl font-semibold ${theme === 'black' ? 'text-white' : 'text-black'}`}>
                Compose Email
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'black' ? 'text-white/80' : 'text-black/80'}`}>
                    To:
                  </label>
                  <input
                    type="email"
                    className={`w-full px-3 py-2 rounded border ${
                      theme === 'black' 
                        ? 'bg-white/5 border-white/20 text-white placeholder-white/40' 
                        : 'bg-black/5 border-black/20 text-black placeholder-black/40'
                    }`}
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'black' ? 'text-white/80' : 'text-black/80'}`}>
                    Subject:
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 rounded border ${
                      theme === 'black' 
                        ? 'bg-white/5 border-white/20 text-white placeholder-white/40' 
                        : 'bg-black/5 border-black/20 text-black placeholder-black/40'
                    }`}
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'black' ? 'text-white/80' : 'text-black/80'}`}>
                    Message:
                  </label>
                  <textarea
                    rows={12}
                    className={`w-full px-3 py-2 rounded border ${
                      theme === 'black' 
                        ? 'bg-white/5 border-white/20 text-white placeholder-white/40' 
                        : 'bg-black/5 border-black/20 text-black placeholder-black/40'
                    }`}
                    placeholder="Write your message here..."
                  />
                </div>
              </div>
            </div>
            <div className={`p-6 border-t ${theme === 'black' ? 'border-white/10' : 'border-black/10'} flex justify-between`}>
              <Button
                variant="outline"
                onClick={() => setShowComposeModal(false)}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Draft Saved",
                      description: "Email draft saved to drafts folder",
                    });
                  }}
                >
                  Save Draft
                </Button>
                <Button
                  variant="liquid"
                  onClick={() => {
                    toast({
                      title: "Email Sent",
                      description: "Your email has been sent successfully",
                    });
                    setShowComposeModal(false);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        thread={contextMenu.thread}
        onClose={handleContextMenuClose}
        onAction={handleContextMenuAction}
      />

      {/* Category Modal */}
      {selectedThreadForCategory && showCategoryModal && selectedThreadForCategory.id && (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('CategoryModal error:', error, errorInfo);
            // Reset modal state on error
            setShowCategoryModal(false);
            setSelectedThreadForCategory(null);
          }}
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm mx-4">
                <h3 className="text-lg font-semibold mb-2">Modal Error</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  There was an error with the category modal. Please try again.
                </p>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setSelectedThreadForCategory(null);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <CategoryModal
            isOpen={showCategoryModal}
            onClose={() => {
              setShowCategoryModal(false);
              setSelectedThreadForCategory(null);
            }}
            currentCategory={selectedThreadForCategory.aiAnalysis?.category || 'follow_up'}
            threadId={selectedThreadForCategory.id}
            onCategoryChange={handleCategoryChange}
          />
        </ErrorBoundary>
      )}

      {/* Add to Pipeline Modal */}
      {showPipelineModal && selectedThreadForPipeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            className={`w-full max-w-2xl mx-4 rounded-lg shadow-2xl ${
              theme === 'black' ? 'bg-black/90 border-white/10' : 'bg-white border-black/10'
            } border`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className={`p-6 border-b ${theme === 'black' ? 'border-white/10' : 'border-black/10'}`}>
              <h2 className={`text-xl font-semibold ${theme === 'black' ? 'text-white' : 'text-black'}`}>
                Add to Sales Pipeline
              </h2>
              <p className={`text-sm ${theme === 'black' ? 'text-white/60' : 'text-black/60'} mt-1`}>
                Create a lead from this email thread
              </p>
            </div>
            <div className="p-6">
              <PipelineForm
                thread={selectedThreadForPipeline}
                onSubmit={handlePipelineSubmit}
                onCancel={() => setShowPipelineModal(false)}
                theme={theme}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}