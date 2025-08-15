"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FlowCard from '@/components/river/FlowCard';
import StatusBadge from '@/components/river/StatusBadge';
import SkeletonFlow from '@/components/river/SkeletonFlow';
import CreateLeadModal from '@/components/pipeline/CreateLeadModal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/river/RiverToast';
import { 
  ArrowLeft,
  Reply, 
  ReplyAll, 
  Forward,
  Star,
  Archive,
  Trash2,
  Download,
  ExternalLink,
  Clock,
  User,
  Mail,
  Paperclip,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DOMPurify from 'isomorphic-dompurify';

interface EmailMessage {
  id: string;
  subject: string;
  from: {
    name?: string;
    email: string;
  };
  to: Array<{
    name?: string;
    email: string;
  }>;
  cc?: Array<{
    name?: string;
    email: string;
  }>;
  bcc?: Array<{
    name?: string;
    email: string;
  }>;
  htmlBody?: string;
  textBody: string;
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;
  sentAt: string;
  receivedAt: string;
}

interface EmailThread {
  id: string;
  subject: string;
  labels: string[];
  starred: boolean;
  unread: boolean;
  messages: EmailMessage[];
  participants: Array<{
    name?: string;
    email: string;
  }>;
}

interface ThreadViewProps {
  threadId: string;
  onBack: () => void;
  className?: string;
}

export default function ThreadView({ threadId, onBack, className }: ThreadViewProps) {
  const [thread, setThread] = useState<EmailThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [showingCompose, setShowingCompose] = useState(false);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  const fetchThread = async () => {
    try {
      const response = await fetch(`/api/inbox/threads/${threadId}`);
      if (response.ok) {
        const data = await response.json();
        setThread(data);
        
        // Auto-expand the latest message
        if (data.messages.length > 0) {
          const latestMessage = data.messages[data.messages.length - 1];
          setExpandedMessages(new Set([latestMessage.id]));
        }

        // Mark as read
        if (data.unread) {
          markAsRead();
        }
      }
    } catch (error) {
      console.error('Failed to fetch thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch(`/api/inbox/threads/${threadId}/read`, {
        method: 'PATCH'
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleThreadAction = async (action: 'star' | 'unstar' | 'archive' | 'delete') => {
    try {
      const response = await fetch(`/api/inbox/threads/${threadId}/${action}`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        if (action === 'star' || action === 'unstar') {
          setThread(prev => prev ? { ...prev, starred: action === 'star' } : null);
        } else if (action === 'archive' || action === 'delete') {
          onBack(); // Navigate back after archiving/deleting
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} thread:`, error);
    }
  };

  const toggleMessageExpanded = (messageId: string) => {
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateLead = () => {
    setShowCreateLead(true);
  };

  const handleLeadCreated = (lead: any) => {
    addToast({
      type: 'success',
      title: 'Lead Created',
      description: `"${lead.title}" has been created from this email thread.`
    });
  };

  const formatParticipant = (participant: { name?: string; email: string }) => {
    return participant.name ? `${participant.name} <${participant.email}>` : participant.email;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const sanitizeHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false
    });
  };

  if (loading) {
    return (
      <FlowCard className={className}>
        <div className="p-6">
          <SkeletonFlow variant="card" lines={8} />
        </div>
      </FlowCard>
    );
  }

  if (!thread) {
    return (
      <FlowCard className={className}>
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Thread not found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            The thread you're looking for might have been moved or deleted.
          </p>
          <Button onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inbox
          </Button>
        </div>
      </FlowCard>
    );
  }

  return (
    <FlowCard className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inbox
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleThreadAction(thread.starred ? 'unstar' : 'star')}
              variant="outline"
              size="sm"
            >
              <Star className={cn(
                'h-4 w-4 mr-2',
                thread.starred ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'
              )} />
              {thread.starred ? 'Starred' : 'Star'}
            </Button>
            <Button
              onClick={() => handleThreadAction('archive')}
              variant="outline"
              size="sm"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            <Button
              onClick={handleCreateLead}
              variant="outline"
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create Lead
            </Button>
            <Button
              onClick={() => handleThreadAction('delete')}
              variant="outline"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {thread.subject || '(No subject)'}
          </h1>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {thread.messages.length} message{thread.messages.length !== 1 ? 's' : ''}
            </span>
            
            {thread.labels.length > 0 && (
              <div className="flex items-center gap-1">
                {thread.labels.map((label) => (
                  <StatusBadge
                    key={label}
                    status="connected"
                    label={label}
                    size="sm"
                    showIcon={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto">
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
              >
                <FlowCard className={cn(
                  'overflow-hidden',
                  isLatest && 'ring-1 ring-teal-200 dark:ring-teal-800'
                )}>
                  {/* Message Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    onClick={() => toggleMessageExpanded(message.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-azure-400 flex items-center justify-center text-white font-medium text-sm">
                          {message.from.name ? message.from.name.charAt(0).toUpperCase() : message.from.email.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {message.from.name || message.from.email}
                            </span>
                            {message.attachments && message.attachments.length > 0 && (
                              <Paperclip className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            <div>To: {message.to.map(formatParticipant).join(', ')}</div>
                            {message.cc && message.cc.length > 0 && (
                              <div>CC: {message.cc.map(formatParticipant).join(', ')}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-slate-500 mb-1">
                          {formatDateTime(message.sentAt)}
                        </div>
                        {!isExpanded && (
                          <div className="text-xs text-slate-400 max-w-xs truncate">
                            {message.textBody.slice(0, 100)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Message Content */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      <div className="p-4">
                        {/* Message Body */}
                        <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
                          {message.htmlBody ? (
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: sanitizeHtml(message.htmlBody) 
                              }}
                              className="email-content"
                            />
                          ) : (
                            <pre className="whitespace-pre-wrap font-sans text-sm">
                              {message.textBody}
                            </pre>
                          )}
                        </div>

                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                              Attachments ({message.attachments.length})
                            </h4>
                            <div className="space-y-2">
                              {message.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                                >
                                  <div className="flex items-center gap-2">
                                    <Paperclip className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                      {attachment.filename}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {formatFileSize(attachment.size)}
                                    </span>
                                  </div>
                                  <Button size="sm" variant="outline">
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Message Actions */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <Button size="sm" variant="outline">
                            <Reply className="h-4 w-4 mr-2" />
                            Reply
                          </Button>
                          <Button size="sm" variant="outline">
                            <ReplyAll className="h-4 w-4 mr-2" />
                            Reply All
                          </Button>
                          <Button size="sm" variant="outline">
                            <Forward className="h-4 w-4 mr-2" />
                            Forward
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </FlowCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Create Lead Modal */}
      {thread && (
        <CreateLeadModal
          open={showCreateLead}
          onOpenChange={setShowCreateLead}
          threadData={{
            threadId: thread.id,
            subject: thread.subject,
            contact: thread.participants[0]?.name || thread.participants[0]?.email || 'Unknown',
            email: thread.participants[0]?.email || '',
            company: '' // Could be extracted from email signature or domain
          }}
          onLeadCreated={handleLeadCreated}
        />
      )}
    </FlowCard>
  );
}
