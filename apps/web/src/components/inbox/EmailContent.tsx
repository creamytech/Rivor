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
  Trash2,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/contexts/ThemeContext';
import { internalFetch } from '@/lib/internal-url';

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
  onAction?: (action: string, threadId: string, messageId?: string, data?: any) => void;
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
      const response = await internalFetch(`/api/inbox/threads/${threadId}`);
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

  const handleReply = (threadId: string) => {
    if (!thread || !thread.messages || thread.messages.length === 0) return;
    
    // Get the latest message to reply to
    const latestMessage = thread.messages[thread.messages.length - 1];
    
    // Extract plain text from HTML or use bodyText
    const getPlainTextContent = (message: EmailMessage): string => {
      if (message.bodyText) {
        return message.bodyText;
      } else if (message.bodyHtml) {
        // Simple HTML to text conversion
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = message.bodyHtml;
        return tempDiv.textContent || tempDiv.innerText || '';
      }
      return '';
    };
    
    // Create reply data
    const replyData = {
      type: 'reply',
      originalMessageId: latestMessage.id,
      toEmail: latestMessage.fromEmail,
      toName: latestMessage.fromName || '',
      subject: latestMessage.subject?.startsWith('Re:') 
        ? latestMessage.subject 
        : `Re: ${latestMessage.subject}`,
      originalBody: getPlainTextContent(latestMessage),
      originalDate: latestMessage.sentAt || latestMessage.receivedAt,
      inReplyTo: latestMessage.messageId,
      references: latestMessage.references || latestMessage.messageId,
      threadId: threadId
    };
    
    console.log('Manual reply initiated:', replyData);
    onAction?.('reply', threadId, latestMessage.id, replyData);
  };

  const handleForward = (threadId: string) => {
    if (!thread || !thread.messages || thread.messages.length === 0) return;
    
    // Get the latest message to forward
    const latestMessage = thread.messages[thread.messages.length - 1];
    
    // Extract plain text from HTML or use bodyText (reuse function from reply)
    const getPlainTextContent = (message: EmailMessage): string => {
      if (message.bodyText) {
        return message.bodyText;
      } else if (message.bodyHtml) {
        // Simple HTML to text conversion
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = message.bodyHtml;
        return tempDiv.textContent || tempDiv.innerText || '';
      }
      return '';
    };
    
    // Create forward data
    const forwardData = {
      type: 'forward',
      originalMessageId: latestMessage.id,
      subject: latestMessage.subject?.startsWith('Fwd:') 
        ? latestMessage.subject 
        : `Fwd: ${latestMessage.subject}`,
      originalBody: getPlainTextContent(latestMessage),
      originalFrom: `${latestMessage.fromName || latestMessage.fromEmail} <${latestMessage.fromEmail}>`,
      originalTo: latestMessage.toEmail?.join(', ') || '',
      originalDate: latestMessage.sentAt || latestMessage.receivedAt,
      threadId: threadId
    };
    
    console.log('Manual forward initiated:', forwardData);
    onAction?.('forward', threadId, latestMessage.id, forwardData);
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
    if (!html) return '';
    
    // Basic HTML sanitization - remove potentially dangerous elements
    let sanitized = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
      .replace(/<form[^>]*>.*?<\/form>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/mailto:/gi, '#') // Convert mailto links to prevent URL scheme errors
      .replace(/tel:/gi, '#') // Convert tel links to prevent URL scheme errors
      .replace(/href="[^"]*javascript:/gi, 'href="#"') // Fix javascript hrefs
      .replace(/src="[^"]*javascript:/gi, 'src="#"'); // Fix javascript src
    
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
    if (!html) return '';
    
    try {
      // First sanitize the HTML to prevent URL scheme errors
      const sanitizedHtml = html
        .replace(/mailto:/gi, '#')
        .replace(/tel:/gi, '#')
        .replace(/javascript:/gi, '')
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '');
      
      // Create a temporary div to parse HTML and extract text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = sanitizedHtml;
      
      // Remove any remaining style and script tags
      const styleElements = tempDiv.querySelectorAll('style, script');
      styleElements.forEach(el => el.remove());
      
      // Get text content and clean it up
      return tempDiv.textContent || tempDiv.innerText || '';
    } catch (error) {
      console.warn('Error extracting text from HTML:', error);
      // Fallback: strip HTML tags with regex
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
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
    <div className="flex-1 flex flex-col" style={{ minHeight: '600px' }}>

      {/* Messages */}
      <ScrollArea className="flex-1" style={{ minHeight: '500px' }}>
        <div className="p-4 space-y-3" style={{ minWidth: '900px' }}>
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
                        
                        {/* Email Controls - Show if we have any content */}
                        {(() => {
                          const hasHtmlContent = message.bodyHtml && message.bodyHtml.trim();
                          const hasTextContent = message.bodyText && message.bodyText.trim();
                          
                          if (hasHtmlContent || hasTextContent) {
                            return (
                              <div className="flex items-center gap-4 mb-4 p-3 rounded-lg" style={{
                                background: theme === 'black' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                              }}>
                                {hasHtmlContent && (
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
                                )}
                                
                                {hasHtmlContent && viewMode === 'html' && (
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
                                
                                {!hasHtmlContent && hasTextContent && (
                                  <div className={`text-sm ${theme === 'black' ? 'text-white/60' : 'text-black/60'}`}>
                                    Text content only
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Message Body */}
                        <div className={`prose max-w-none ${
                          theme === 'black' 
                            ? 'prose-invert prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-a:text-blue-400' 
                            : 'prose-headings:text-black prose-p:text-black/90 prose-strong:text-black prose-a:text-blue-600'
                        }`}>
                          {(() => {
                            // Check if we have any content at all
                            const hasHtmlContent = message.bodyHtml && message.bodyHtml.trim();
                            const hasTextContent = message.bodyText && message.bodyText.trim();
                            const extractedText = hasHtmlContent ? extractTextFromHtml(message.bodyHtml) : '';
                            const hasExtractedText = extractedText && extractedText.trim();
                            
                            if (hasHtmlContent || hasTextContent) {
                              if (hasHtmlContent) {
                                return (
                                  <>
                                    {viewMode === 'text' ? (
                                      <div className={`p-4 rounded-lg ${theme === 'black' ? 'bg-white/5 text-white/90' : 'bg-black/5 text-black/90'}`}>
                                        <div className="font-sans leading-relaxed whitespace-pre-wrap">
                                          {hasExtractedText ? extractedText : 'Content available in HTML view'}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex justify-center w-full">
                                        <div 
                                          dangerouslySetInnerHTML={{ 
                                            __html: sanitizeHtml(message.bodyHtml, showImages)
                                          }}
                                          className="email-content rounded-lg"
                                          style={{
                                            background: 'white',
                                            color: 'black',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                            padding: '20px',
                                            border: theme === 'black' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                            maxWidth: '700px',
                                            width: '100%',
                                            minHeight: '70vh',
                                            height: 'auto',
                                            overflow: 'auto',
                                            zoom: '0.9'
                                          }}
                                        />
                                      </div>
                                    )}
                                  </>
                                );
                              } else if (hasTextContent) {
                                return (
                                  <div className={`p-4 rounded-lg ${theme === 'black' ? 'bg-white/5 text-white/90' : 'bg-black/5 text-black/90'}`}>
                                    <div className="font-sans leading-relaxed whitespace-pre-wrap">
                                      {message.bodyText}
                                    </div>
                                  </div>
                                );
                              }
                            }
                            
                            // Fallback: try to show subject or snippet
                            const fallbackContent = message.subject || message.snippet || 'Email content is encrypted and cannot be displayed';
                            
                            return (
                              <div className={`p-4 rounded-lg border-2 border-dashed ${theme === 'black' ? 'border-white/20 bg-white/5 text-white/70' : 'border-black/20 bg-black/5 text-black/70'}`}>
                                <div className="text-center">
                                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <div className="font-medium mb-1">Email Content Not Available</div>
                                  <div className="text-sm opacity-75">
                                    {fallbackContent.length > 100 ? fallbackContent.substring(0, 100) + '...' : fallbackContent}
                                  </div>
                                </div>
                              </div>
                            );
                          })()} 
                        </div>
                      </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Action Bar */}
      {thread && (
        <div className={`sticky bottom-0 border-t p-4 ${
          theme === 'black' 
            ? 'bg-black/80 border-white/10 backdrop-blur-xl' 
            : 'bg-white/80 border-black/10 backdrop-blur-xl'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Primary Reply Button */}
              <Button
                variant="liquid"
                size="sm"
                onClick={() => handleReply(thread.id)}
                className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-400/30 font-medium"
              >
                <Reply className="h-4 w-4" />
                Reply
              </Button>
              
              {/* Secondary Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleForward(thread.id)}
                  className="flex items-center gap-2 opacity-70 hover:opacity-100"
                >
                  <Forward className="h-4 w-4" />
                  Forward
                </Button>
                
                {/* AI Reply as Secondary Option */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction?.('ai-reply', thread.id)}
                  className="flex items-center gap-2 opacity-70 hover:opacity-100 text-purple-400"
                  title="Generate AI Reply"
                >
                  <Bot className="h-4 w-4" />
                  AI Reply
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAction?.('delete', thread.id)}
                className="flex items-center gap-2 opacity-50 hover:opacity-100 text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .email-content {
          /* Minimal styling - let email's natural styles show through */
          font-size: 14px !important;
        }
        
        .email-content img {
          max-width: 100% !important;
          height: auto !important;
        }
        
        .email-content table {
          width: auto !important;
          max-width: 100% !important;
        }
        
        .email-content td, .email-content th {
          white-space: nowrap;
          padding: 8px 12px !important;
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