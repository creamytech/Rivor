"use client";
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  Mail, 
  Eye, 
  Archive, 
  Trash2, 
  Reply, 
  ArrowUp, 
  MoreHorizontal,
  Paperclip,
  Clock,
  User,
  Building,
  Calendar,
  MessageSquare,
  Star,
  StarOff,
  Download,
  FileText,
  Image,
  File
} from 'lucide-react';

interface EmailThread {
  id: string;
  subjectEnc: any;
  participantsEnc: any;
  unread: boolean;
  starred: boolean;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    sentAt: string;
    fromEnc: any;
    toEnc: any;
    subjectEnc: any;
    snippetEnc: any;
    attachments: any;
  }>;
  _count: {
    messages: number;
  };
  lead?: {
    id: string;
    title: string | null;
    status: string;
    stage?: {
      name: string;
      color: string | null;
    } | null;
    contact?: {
      nameEnc: any;
      emailEnc: any;
      companyEnc: any;
    } | null;
  } | null;
}

interface EnhancedInboxProps {
  className?: string;
}

export default function EnhancedInbox({ className = '' }: EnhancedInboxProps) {
  const [activeTab, setActiveTab] = useState('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'split'>('split');

  // Fetch real data from tRPC
  const { data: threadsData, isLoading: threadsLoading, refetch: refetchThreads } = trpc.emailThreads.list.useQuery({
    search: searchQuery || undefined,
    status: activeTab === 'leads' ? 'unread' : activeTab === 'review' ? 'read' : undefined,
    limit: 50
  });

  const { data: selectedThreadData, isLoading: selectedThreadLoading } = trpc.emailThreads.get.useQuery(
    { id: selectedThread?.id || '' },
    { enabled: !!selectedThread?.id }
  );

  // Mutations
  const markAsReadMutation = trpc.emailThreads.markAsRead.useMutation({
    onSuccess: () => refetchThreads()
  });

  const archiveMutation = trpc.emailThreads.archive.useMutation({
    onSuccess: () => refetchThreads()
  });

  const threads = threadsData?.threads || [];
  const selectedThreadDetails = selectedThreadData;

  // Search chips
  const searchChips = [
    { label: 'from:john@example.com', value: 'from:john@example.com' },
    { label: 'has:attachment', value: 'has:attachment' },
    { label: 'stage:qualified', value: 'stage:qualified' },
    { label: 'confidence:>80', value: 'confidence:>80' }
  ];

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (contentType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const handleThreadSelect = (thread: EmailThread) => {
    setSelectedThread(thread);
    if (thread.unread) {
      markAsReadMutation.mutate({ id: thread.id });
    }
  };

  const handleBulkAction = (action: 'archive' | 'delete' | 'promote') => {
    selectedThreads.forEach(threadId => {
      if (action === 'archive') {
        archiveMutation.mutate({ id: threadId });
      }
      // Add other bulk actions as needed
    });
    setSelectedThreads(new Set());
  };

  const handleThreadToggle = (threadId: string) => {
    const newSelected = new Set(selectedThreads);
    if (newSelected.has(threadId)) {
      newSelected.delete(threadId);
    } else {
      newSelected.add(threadId);
    }
    setSelectedThreads(newSelected);
  };

  if (threadsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Inbox
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your email threads and leads
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/10">
            <TabsTrigger value="leads" className="text-sm">
              Leads ({threads.filter(t => t.status === 'unread').length})
            </TabsTrigger>
            <TabsTrigger value="review" className="text-sm">
              Review ({threads.filter(t => t.status === 'read').length})
            </TabsTrigger>
            <TabsTrigger value="other" className="text-sm">
              Other ({threads.filter(t => t.status === 'archived').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search threads, contacts, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Smart Templates
            </Button>
          </div>

          {/* Search Chips */}
          <div className="flex flex-wrap gap-2">
            {searchChips.map((chip) => (
              <Badge
                key={chip.value}
                variant="secondary"
                className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                onClick={() => setSearchQuery(chip.value)}
              >
                {chip.label}
              </Badge>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedThreads.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {selectedThreads.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('promote')}
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                Promote
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('archive')}
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Thread List */}
          <div className="lg:col-span-2">
            <GlassCard variant="gradient" intensity="medium" className="h-full">
              <GlassCardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <GlassCardTitle>Email Threads</GlassCardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'list' ? 'split' : 'list')}
                    >
                      {viewMode === 'list' ? 'Split View' : 'List View'}
                    </Button>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="p-0">
                {threads.length === 0 ? (
                  <div className="p-8 text-center">
                    <Mail className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                      No threads found
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {searchQuery ? 'Try adjusting your search criteria' : 'Threads will appear here as they are synced'}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto">
                    {threads.map((thread) => {
                      const isSelected = selectedThreads.has(thread.id);
                      const isActive = selectedThread?.id === thread.id;
                      const latestMessage = thread.messages[0];
                      const hasAttachments = thread._count.attachments > 0;

                      return (
                        <div
                          key={thread.id}
                          className={`p-4 border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors cursor-pointer ${
                            isActive ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                          } ${thread.unread ? 'bg-yellow-50/50 dark:bg-yellow-900/20' : ''}`}
                          onClick={() => handleThreadSelect(thread)}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleThreadToggle(thread.id);
                              }}
                              className="mt-1"
                            />
                            
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {latestMessage?.fromEnc ? 'U' : '?'}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                    {thread.subjectEnc ? 'Subject' : 'No Subject'}
                                  </h4>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {latestMessage?.fromEnc ? 'From: User' : 'Unknown sender'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  {hasAttachments && (
                                    <Paperclip className="h-4 w-4 text-slate-400" />
                                  )}
                                  <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Clock className="h-3 w-3" />
                                    {getTimeAgo(thread.updatedAt)}
                                  </div>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mb-3">
                                {thread.lead && (
                                  <>
                                    <Badge variant="default" className="text-xs">
                                      Lead
                                    </Badge>
                                    {thread.lead.stage && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                        style={{
                                          borderColor: thread.lead.stage.color || undefined,
                                          color: thread.lead.stage.color || undefined
                                        }}
                                      >
                                        {thread.lead.stage.name}
                                      </Badge>
                                    )}
                                  </>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {thread._count.messages} messages
                                </Badge>
                                {hasAttachments && (
                                  <Badge variant="outline" className="text-xs">
                                    {thread._count.attachments} attachments
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <MessageSquare className="h-3 w-3" />
                                    {thread._count.messages} messages
                                  </div>
                                  {thread.lead?.contact && (
                                    <div className="text-xs text-slate-500">
                                      <User className="h-3 w-3 inline mr-1" />
                                      Contact
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                                    <Reply className="h-3 w-3 mr-1" />
                                    Reply
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                                    <ArrowUp className="h-3 w-3 mr-1" />
                                    Promote
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                                    <Archive className="h-3 w-3 mr-1" />
                                    Archive
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Lead Summary Panel */}
          {viewMode === 'split' && selectedThread && (
            <div className="space-y-6">
              <GlassCard variant="gradient" intensity="medium">
                <GlassCardHeader>
                  <GlassCardTitle>Lead Summary</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  {selectedThread.lead ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                          {selectedThread.lead.title || 'Untitled Lead'}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Status: {selectedThread.lead.status}
                        </p>
                        {selectedThread.lead.stage && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Stage: {selectedThread.lead.stage.name}
                          </p>
                        )}
                      </div>

                      {selectedThread.lead.contact && (
                        <div>
                          <h5 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                            Contact Information
                          </h5>
                          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <p><User className="h-3 w-3 inline mr-1" /> Contact Name</p>
                            <p><Mail className="h-3 w-3 inline mr-1" /> contact@example.com</p>
                            <p><Building className="h-3 w-3 inline mr-1" /> Company Name</p>
                          </div>
                        </div>
                      )}

                      <div>
                        <h5 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                          Why Lead
                        </h5>
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                          <p>• Contains buying intent keywords</p>
                          <p>• Has valid contact information</p>
                          <p>• Recent activity within 24h</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-slate-600 dark:text-slate-400">
                        No lead associated with this thread
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Create Lead
                      </Button>
                    </div>
                  )}
                </GlassCardContent>
              </GlassCard>

              {/* Attachments */}
              {selectedThread.messages.some(msg => msg.attachments && msg.attachments.length > 0) && (
                <GlassCard variant="gradient" intensity="medium">
                  <GlassCardHeader>
                    <GlassCardTitle>Attachments</GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="space-y-2">
                      {selectedThread.messages.flatMap(msg => 
                        msg.attachments ? msg.attachments.map((attachment: any, index: number) => (
                          <div
                            key={`${msg.id}_${index}`}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {getFileIcon(attachment.contentType || 'application/octet-stream')}
                              <span className="text-sm text-slate-900 dark:text-slate-100">
                                {attachment.filename || 'Unknown file'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">
                                {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                              </span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )) : []
                      )}
                    </div>
                  </GlassCardContent>
                </GlassCard>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
