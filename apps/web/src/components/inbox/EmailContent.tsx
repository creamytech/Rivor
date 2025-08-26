"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Clock,
  User,
  Mail,
  Paperclip,
  ChevronDown,
  ChevronRight,
  Reply,
  Forward,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/contexts/ThemeContext';

interface EmailMessage {
  id: string;
  messageId: string;
  subject: string;
  snippet: string;
  bodyText: string | null;
  bodyHtml: string | null;
  fromEmail: string;
  fromName: string | null;
  toEmail: string[];
  toName: string[];
  ccEmail: string[] | null;
  bccEmail: string[] | null;
  receivedAt: string;
  sentAt: string | null;
  isRead: boolean;
  labelIds: string[];
  hasAttachments: boolean;
  inReplyTo: string | null;
  references: string | null;
  createdAt: string;
  updatedAt: string;
}

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
  messages: EmailMessage[];
}

interface EmailContentProps {
  threadId: string;
  onAction?: (action: string, threadId: string, messageId?: string) => void;
}

export function EmailContent({ threadId, onAction }: EmailContentProps) {
  const { theme } = useTheme();
  const [thread, setThread] = useState<EmailThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchThreadDetails();
  }, [threadId]);

  const fetchThreadDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/inbox/threads/${threadId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load thread details');
      }

      console.log('Raw thread data received:', data);
      console.log('Messages in thread:', data.messages);

      // Transform messages to match EmailMessage interface
      const transformedMessages = (data.messages || []).map((message: any) => ({
        id: message.id,
        messageId: message.id, // Use same ID
        subject: message.subject,
        snippet: message.textBody ? message.textBody.substring(0, 200) + '...' : '',
        bodyText: message.textBody,
        bodyHtml: message.htmlBody,
        fromEmail: message.from?.email || 'unknown@example.com',
        fromName: message.from?.name || message.from?.email || 'Unknown',
        toEmail: message.to ? message.to.map((t: any) => t.email) : [],
        toName: message.to ? message.to.map((t: any) => t.name) : [],
        ccEmail: message.cc ? message.cc.map((c: any) => c.email) : [],
        bccEmail: message.bcc ? message.bcc.map((b: any) => b.email) : [],
        receivedAt: message.receivedAt || message.sentAt,
        sentAt: message.sentAt,
        isRead: true, // Assume read if viewing
        labelIds: [],
        hasAttachments: (message.attachments && message.attachments.length > 0) || false,
        inReplyTo: null,
        references: null,
        createdAt: message.sentAt,
        updatedAt: message.sentAt
      }));

      console.log('Transformed messages:', transformedMessages);

      // Ensure the data has all required fields with defaults
      const threadData = {
        ...data,
        snippet: data.snippet || (transformedMessages[0]?.snippet || ''),
        participants: data.participants || [],
        messageCount: transformedMessages.length,
        unread: data.unread || false,
        starred: data.starred || false,
        hasAttachments: transformedMessages.some((msg: any) => msg.hasAttachments) || false,
        labels: data.labels || [],
        lastMessageAt: transformedMessages[transformedMessages.length - 1]?.receivedAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        messages: transformedMessages
      };
      
      setThread(threadData);
      
      // Expand the latest message by default
      if (threadData.messages.length > 0) {
        const latestMessage = threadData.messages[threadData.messages.length - 1];
        setExpandedMessages(new Set([latestMessage.id]));
      }

    } catch (error) {
      console.error('Error fetching thread details:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString(undefined, { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString(undefined, { 
        weekday: 'short',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString(undefined, { 
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const sanitizeHtml = (html: string) => {
    // Basic HTML sanitization - remove potentially dangerous elements
    // In production, use a proper sanitization library like DOMPurify
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
      .replace(/<form[^>]*>.*?<\/form>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .replace(/javascript:/gi, ''); // Remove javascript: URLs
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin h-8 w-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-4 ${
            theme === 'black' ? 'text-white/40' : 'text-black/40'
          }`} />
          <p className={`${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>Loading email content...</p>
        </div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Mail className={`h-16 w-16 ${theme === 'black' ? 'text-white/40' : 'text-black/40'} mx-auto mb-4`} />
          <h3 className={`text-xl font-medium ${theme === 'black' ? 'text-white/60' : 'text-black/60'} mb-2`}>
            {error ? 'Error Loading Email' : 'Email Not Found'}
          </h3>
          <p className={`${theme === 'black' ? 'text-white/40' : 'text-black/40'}`}>
            {error || 'The requested email thread could not be found.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Thread Header */}
      <div className={`p-6 border-b ${theme === 'black' ? 'border-white/10' : 'border-black/10'}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className={`text-2xl font-bold ${theme === 'black' ? 'text-white' : 'text-black'} mb-2`}>
              {thread.subject}
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <div className={`flex items-center gap-2 ${theme === 'black' ? 'text-white/70' : 'text-black/70'}`}>
                <User className="h-4 w-4" />
                <span>{thread.participants.map(p => p.name || p.email).join(', ')}</span>
              </div>
              <div className={`flex items-center gap-2 ${theme === 'black' ? 'text-white/70' : 'text-black/70'}`}>
                <Calendar className="h-4 w-4" />
                <span>{formatDate(thread.lastMessageAt)}</span>
              </div>
              {thread.hasAttachments && (
                <div className={`flex items-center gap-2 ${theme === 'black' ? 'text-white/70' : 'text-black/70'}`}>
                  <Paperclip className="h-4 w-4" />
                  <span>Attachments</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={thread.unread ? 'default' : 'secondary'} className="text-xs">
              {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
            </Badge>
            {thread.starred && (
              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                Starred
              </Badge>
            )}
          </div>
        </div>

        {/* Thread Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onAction?.('reply', thread.id)}
          >
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onAction?.('forward', thread.id)}
          >
            <Forward className="h-4 w-4 mr-2" />
            Forward
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onAction?.('delete', thread.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {thread.messages.map((message, index) => {
            const isExpanded = expandedMessages.has(message.id);
            const isLatest = index === thread.messages.length - 1;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  border rounded-lg overflow-hidden transition-all duration-200
                  ${theme === 'black' 
                    ? 'border-white/10 bg-white/5' 
                    : 'border-black/10 bg-black/2'
                  }
                  ${isExpanded ? 'shadow-lg' : 'shadow-sm'}
                `}
              >
                {/* Message Header */}
                <div 
                  className={`
                    p-4 cursor-pointer transition-colors duration-150
                    ${theme === 'black' 
                      ? 'hover:bg-white/5' 
                      : 'hover:bg-black/5'
                    }
                  `}
                  onClick={() => !isLatest && toggleMessageExpansion(message.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {!isLatest && (
                        <button className={`p-1 rounded ${theme === 'black' ? 'text-white/70' : 'text-black/70'}`}>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                          ${theme === 'black' 
                            ? 'bg-white/10 text-white' 
                            : 'bg-black/10 text-black'
                          }
                        `}>
                          {(message.fromName || message.fromEmail).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={`font-medium text-sm ${theme === 'black' ? 'text-white' : 'text-black'}`}>
                            {message.fromName || message.fromEmail}
                          </div>
                          <div className={`text-xs ${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>
                            {formatDate(message.receivedAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!message.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                      {message.hasAttachments && (
                        <Paperclip className={`h-4 w-4 ${theme === 'black' ? 'text-white/50' : 'text-black/50'}`} />
                      )}
                    </div>
                  </div>
                  
                  {!isExpanded && !isLatest && (
                    <div className={`mt-2 text-sm ${theme === 'black' ? 'text-white/70' : 'text-black/70'} line-clamp-2`}>
                      {message.snippet}
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <AnimatePresence>
                  {(isExpanded || isLatest) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Separator className={theme === 'black' ? 'bg-white/10' : 'bg-black/10'} />
                      <div className="p-4">
                        {/* Message Recipients */}
                        <div className={`text-xs mb-4 space-y-1 ${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>
                          <div>
                            <span className="font-medium">From:</span> {message.fromName || message.fromEmail}
                          </div>
                          <div>
                            <span className="font-medium">To:</span> {message.toEmail.join(', ')}
                          </div>
                          {message.ccEmail && message.ccEmail.length > 0 && (
                            <div>
                              <span className="font-medium">CC:</span> {message.ccEmail.join(', ')}
                            </div>
                          )}
                        </div>
                        
                        {/* Message Body */}
                        <div className={`prose max-w-none ${
                          theme === 'black' 
                            ? 'prose-invert prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-a:text-blue-400' 
                            : 'prose-headings:text-black prose-p:text-black/90 prose-strong:text-black prose-a:text-blue-600'
                        }`}>
                          {message.bodyHtml ? (
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: sanitizeHtml(message.bodyHtml) 
                              }}
                              className="email-content"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                lineHeight: '1.6'
                              }}
                            />
                          ) : message.bodyText ? (
                            <div className="whitespace-pre-wrap font-sans leading-relaxed">
                              {message.bodyText}
                            </div>
                          ) : (
                            <div className={`italic ${theme === 'black' ? 'text-white/50' : 'text-black/50'}`}>
                              No content available
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      <style jsx global>{`
        .email-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }
        
        .email-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        
        .email-content table td,
        .email-content table th {
          padding: 8px 12px;
          border: 1px solid ${theme === 'black' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          text-align: left;
        }
        
        .email-content blockquote {
          border-left: 4px solid ${theme === 'black' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
        }
        
        .email-content pre {
          background: ${theme === 'black' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}