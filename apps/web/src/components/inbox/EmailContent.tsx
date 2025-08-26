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
  const [showImages, setShowImages] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'text' | 'html'>('html');

  console.log('EmailContent component mounted/updated with threadId:', threadId);

  useEffect(() => {
    console.log('EmailContent useEffect triggered for threadId:', threadId);
    fetchThreadDetails();
  }, [threadId]);

  const fetchThreadDetails = async () => {
    console.log('🔍 fetchThreadDetails called for threadId:', threadId);
    try {
      setLoading(true);
      setError(null);

      console.log('📡 Making API call to:', `/api/inbox/threads/${threadId}`);
      const response = await fetch(`/api/inbox/threads/${threadId}`);
      console.log('📡 API response status:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📡 API response data:', data);

      if (!response.ok) {
        console.error('❌ API response not ok:', data);
        throw new Error(data.error || 'Failed to load thread details');
      }

      console.log('✅ Raw thread data received:', data);
      console.log('📨 Messages in thread:', data.messages);

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

      console.log('🔄 Transformed messages:', transformedMessages);
      console.log('📊 Number of messages transformed:', transformedMessages.length);

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
      
      console.log('💾 Final thread data:', threadData);
      console.log('📝 Setting thread state with:', threadData.messages.length, 'messages');
      
      setThread(threadData);
      
      // Expand the latest message by default
      if (threadData.messages.length > 0) {
        const latestMessage = threadData.messages[threadData.messages.length - 1];
        console.log('🔧 Expanding latest message:', latestMessage.id);
        setExpandedMessages(new Set([latestMessage.id]));
      } else {
        console.log('⚠️ No messages to expand');
      }

    } catch (error) {
      console.error('❌ Error fetching thread details:', error);
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

  const sanitizeHtml = (html: string, allowImages: boolean = false) => {
    // Basic HTML sanitization - remove potentially dangerous elements
    // In production, use a proper sanitization library like DOMPurify
    let sanitized = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
      .replace(/<form[^>]*>.*?<\/form>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .replace(/javascript:/gi, ''); // Remove javascript: URLs
    
    // Handle images based on user preference
    if (!allowImages) {
      // Replace img tags with placeholder showing image info
      sanitized = sanitized.replace(/<img[^>]*>/gi, (match) => {
        const srcMatch = match.match(/src="([^"]*)"/i);
        const altMatch = match.match(/alt="([^"]*)"/i);
        const src = srcMatch ? srcMatch[1] : '';
        const alt = altMatch ? altMatch[1] : 'Image';
        
        return `<div style="
          border: 2px dashed #ccc; 
          padding: 16px; 
          margin: 8px 0; 
          text-align: center; 
          background: #f9f9f9;
          border-radius: 8px;
        ">
          <div style="font-size: 14px; color: #666; margin-bottom: 8px;">
            📷 Image: ${alt}
          </div>
          <div style="font-size: 12px; color: #999; word-break: break-all;">
            ${src}
          </div>
        </div>`;
      });
    }
    
    return sanitized;
  };

  const extractTextFromHtml = (html: string) => {
    // Create a temporary div to parse HTML and extract text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove style and script tags
    const styleElements = tempDiv.querySelectorAll('style, script');
    styleElements.forEach(el => el.remove());
    
    // Get text content and clean it up
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin h-8 w-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-4 ${
            theme === 'black' ? 'text-white/40' : 'text-black/40'
          }`} />
          <p className={`${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>Loading email content for thread: {threadId}</p>
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
      <div className={`p-4 border-b ${theme === 'black' ? 'border-white/10' : 'border-black/10'}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className={`text-xl font-bold ${theme === 'black' ? 'text-white' : 'text-black'} mb-2`}>
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
        <div className="p-4 space-y-3">
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
                {(isExpanded || isLatest) && (
                  <div>
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
                        
                        {/* Email Controls */}
                        {message.bodyHtml && (
                          <div className="flex items-center gap-4 mb-4 p-3 rounded-lg" style={{
                            background: theme === 'black' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                          }}>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${theme === 'black' ? 'text-white/80' : 'text-black/80'}`}>View:</span>
                              <div className="flex rounded-lg overflow-hidden border" style={{
                                borderColor: theme === 'black' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
                              }}>
                                <button
                                  onClick={() => setViewMode('html')}
                                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                                    viewMode === 'html' 
                                      ? 'bg-blue-500 text-white' 
                                      : theme === 'black' ? 'bg-transparent text-white/60 hover:text-white/80' : 'bg-transparent text-black/60 hover:text-black/80'
                                  }`}
                                >
                                  Rich HTML
                                </button>
                                <button
                                  onClick={() => setViewMode('text')}
                                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                                    viewMode === 'text' 
                                      ? 'bg-blue-500 text-white' 
                                      : theme === 'black' ? 'bg-transparent text-white/60 hover:text-white/80' : 'bg-transparent text-black/60 hover:text-black/80'
                                  }`}
                                >
                                  Text Only
                                </button>
                              </div>
                            </div>
                            
                            {viewMode === 'html' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setShowImages(!showImages)}
                                  className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded transition-colors ${
                                    showImages 
                                      ? 'bg-green-500 text-white' 
                                      : theme === 'black' ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-black/10 text-black/60 hover:bg-black/20'
                                  }`}
                                >
                                  <span>📷</span>
                                  {showImages ? 'Hide Images' : 'Show Images'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message Body */}
                        <div className={`prose max-w-none ${
                          theme === 'black' 
                            ? 'prose-invert prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-a:text-blue-400' 
                            : 'prose-headings:text-black prose-p:text-black/90 prose-strong:text-black prose-a:text-blue-600'
                        }`}>
                          {message.bodyHtml ? (
                            <>
                              {viewMode === 'text' ? (
                                <div className={`p-4 rounded-lg ${theme === 'black' ? 'bg-white/5 text-white/90' : 'bg-black/5 text-black/90'}`}>
                                  <div className="font-sans leading-relaxed whitespace-pre-wrap">
                                    {extractTextFromHtml(message.bodyHtml)}
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  dangerouslySetInnerHTML={{ 
                                    __html: sanitizeHtml(message.bodyHtml, showImages)
                                  }}
                                  className="email-content rounded-lg"
                                  style={{
                                    background: 'white',
                                    color: 'black',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    lineHeight: '1.8',
                                    minHeight: '400px',
                                    padding: '40px',
                                    fontSize: '16px',
                                    border: theme === 'black' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                    width: '100%',
                                    maxWidth: 'none',
                                    minWidth: '600px'
                                  }}
                                />
                              )}
                            </>
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
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      <style jsx global>{`
        .email-content {
          /* Reset default spacing and ensure proper layout */
          line-height: 1.7 !important;
        }
        
        .email-content img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 8px;
          margin: 24px auto !important;
          display: block !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .email-content p {
          margin: 16px 0 !important;
          line-height: 1.8 !important;
          font-size: 16px !important;
        }
        
        .email-content h1, .email-content h2, .email-content h3, .email-content h4, .email-content h5, .email-content h6 {
          margin: 32px 0 16px 0 !important;
          line-height: 1.4 !important;
          font-weight: 600 !important;
        }
        
        .email-content h1 { font-size: 28px !important; }
        .email-content h2 { font-size: 24px !important; }
        .email-content h3 { font-size: 20px !important; }
        
        .email-content table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 24px 0 !important;
          background: white !important;
        }
        
        .email-content table td,
        .email-content table th {
          padding: 16px 20px !important;
          border: 1px solid #e5e7eb !important;
          text-align: left !important;
          vertical-align: top !important;
          font-size: 15px !important;
        }
        
        .email-content table th {
          background-color: #f9fafb !important;
          font-weight: 600 !important;
        }
        
        .email-content blockquote {
          border-left: 4px solid #3b82f6 !important;
          padding: 16px 24px !important;
          margin: 24px 0 !important;
          background-color: #f8fafc !important;
          font-style: italic;
          border-radius: 0 8px 8px 0 !important;
        }
        
        .email-content pre {
          background: #f1f5f9 !important;
          padding: 20px !important;
          border-radius: 8px !important;
          overflow-x: auto !important;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
          margin: 24px 0 !important;
          line-height: 1.5 !important;
        }
        
        .email-content code {
          background: #f1f5f9 !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
          font-size: 14px !important;
        }
        
        .email-content ul, .email-content ol {
          margin: 16px 0 !important;
          padding-left: 32px !important;
        }
        
        .email-content li {
          margin: 8px 0 !important;
          line-height: 1.8 !important;
        }
        
        .email-content a {
          color: #3b82f6 !important;
          text-decoration: underline !important;
        }
        
        .email-content a:hover {
          color: #1d4ed8 !important;
        }
        
        .email-content div {
          margin: 8px 0 !important;
        }
        
        .email-content br {
          line-height: 2 !important;
        }
        
        /* Ensure proper spacing for email-specific elements */
        .email-content [style*="padding"],
        .email-content [style*="margin"] {
          /* Allow email's own spacing to take precedence but add minimums */
          padding: max(8px, var(--padding, 8px)) !important;
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