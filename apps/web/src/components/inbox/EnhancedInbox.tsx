"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Mail, Star, Clock, AlertTriangle, CheckCircle, MoreHorizontal, Reply, ReplyAll, Forward, Archive, Trash2, Pin, Snooze, Tag, User, Building, Phone, MapPin, Calendar, MessageSquare, FileText, Eye, EyeOff, Filter, Search, ChevronRight, ChevronLeft, Send, Edit, Plus, Sparkles, Zap, Target, Briefcase, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  intentScore?: number;
  dealHistory?: Array<{
    id: string;
    title: string;
    value: number;
    stage: string;
    status: string;
  }>;
  notes?: string;
  tags: string[];
  lastContact?: string;
  nextFollowUp?: string;
}

interface EnhancedInboxProps {
  activeTab?: string;
  searchQuery?: string;
  selectedFilter?: string;
}

export default function EnhancedInbox({ activeTab = 'all', searchQuery = '', selectedFilter = '' }: EnhancedInboxProps) {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [showContactPanel, setShowContactPanel] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'thread'>('split');

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const params = new URLSearchParams();
        if (activeTab !== 'all') params.append('filter', activeTab);
        if (searchQuery) params.append('search', searchQuery);
        if (selectedFilter) params.append('filter', selectedFilter);
        
        const response = await fetch(`/api/inbox/threads?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setThreads(data.threads || []);
        } else {
          setThreads([]);
        }
      } catch (error) {
        console.error('Failed to fetch email threads:', error);
        setThreads([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreads();
  }, [activeTab, searchQuery, selectedFilter]);

  useEffect(() => {
    // Fetch contact data when a thread is selected
    if (selectedThread && selectedThread.participants.length > 0) {
      const fetchContact = async () => {
        try {
          const participant = selectedThread.participants[0];
          const response = await fetch(`/api/contacts?search=${participant.email}`);
          if (response.ok) {
            const data = await response.json();
            if (data.contacts && data.contacts.length > 0) {
              const contactData = data.contacts[0];
              setContact({
                id: contactData.id,
                name: contactData.name,
                email: contactData.email,
                company: contactData.company,
                title: contactData.title,
                phone: contactData.phone,
                location: contactData.location,
                avatarUrl: contactData.avatarUrl,
                tags: contactData.tags || [],
                lastContact: contactData.lastActivity,
                notes: 'Contact information from email thread'
              });
            } else {
              // Create a basic contact from participant data
              setContact({
                id: 'temp-' + Date.now(),
                name: participant.name,
                email: participant.email,
                tags: ['email-contact'],
                lastContact: selectedThread.lastMessageAt,
                notes: 'Contact from email thread'
              });
            }
          }
        } catch (error) {
          console.error('Failed to fetch contact data:', error);
          // Create a basic contact from participant data
          if (selectedThread.participants.length > 0) {
            const participant = selectedThread.participants[0];
            setContact({
              id: 'temp-' + Date.now(),
              name: participant.name,
              email: participant.email,
              tags: ['email-contact'],
              lastContact: selectedThread.lastMessageAt,
              notes: 'Contact from email thread'
            });
          }
        }
      };

      fetchContact();
    } else {
      setContact(null);
    }
  }, [selectedThread]);

  const getIntentColor = (score?: number) => {
    if (!score) return 'bg-slate-100 text-slate-700';
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'lead':
        return 'bg-blue-100 text-blue-700';
      case 'prospect':
        return 'bg-purple-100 text-purple-700';
      case 'qualified':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Thread List */}
      <div className={cn(
        "flex flex-col border-r border-slate-200 dark:border-slate-700",
        viewMode === 'split' ? "w-1/3" : "w-full"
      )}>
        {/* Thread List Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Inbox</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'split' ? 'thread' : 'split')}
              >
                {viewMode === 'split' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search emails..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => console.log('Search:', e.target.value)}
              />
            </div>
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Mail className="h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No emails found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Connect your email account to get started'}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Connect Email
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {threads.map((thread) => (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    selectedThread?.id === thread.id && "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
                  )}
                  onClick={() => setSelectedThread(thread)}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={thread.participants[0]?.email ? `/api/avatar/${thread.participants[0].email}` : undefined} />
                      <AvatarFallback>
                        {thread.participants[0]?.name?.charAt(0) || 'E'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn(
                          "font-medium text-sm truncate",
                          thread.unread && "font-semibold"
                        )}>
                          {thread.subject || 'No Subject'}
                        </h3>
                        {thread.starred && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                        {thread.hasAttachments && (
                          <FileText className="h-3 w-3 text-slate-400" />
                        )}
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                        {thread.snippet}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{thread.participants[0]?.name || thread.participants[0]?.email || 'Unknown'}</span>
                        <span>•</span>
                        <span>{formatTime(thread.lastMessageAt)}</span>
                        {thread.messageCount > 1 && (
                          <>
                            <span>•</span>
                            <span>{thread.messageCount} messages</span>
                          </>
                        )}
                      </div>

                      {/* Labels */}
                      {thread.labels.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {thread.labels.slice(0, 2).map((label) => (
                            <Badge key={label} variant="secondary" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                          {thread.labels.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{thread.labels.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thread Panel */}
      {viewMode === 'split' && (
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{selectedThread.subject || 'No Subject'}</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Reply className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ReplyAll className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Forward className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>From:</span>
                    <span className="font-medium">
                      {selectedThread.participants[0]?.name || selectedThread.participants[0]?.email || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>To:</span>
                    <span className="font-medium">
                      {selectedThread.participants.slice(1).map(p => p.name || p.email).join(', ') || 'You'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(selectedThread.lastMessageAt)}</span>
                  </div>
                </div>
              </div>

              {/* Thread Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-slate-700 dark:text-slate-300">
                    {selectedThread.snippet}
                  </p>
                  <p className="text-slate-500 text-sm mt-4">
                    This is a preview of the email content. The full message would be displayed here with proper formatting.
                  </p>
                </div>

                {/* AI Summary Card */}
                <Card className="mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      AI Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Intent: {contact?.intentScore ? `${contact.intentScore}%` : 'Unknown'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Priority: Medium
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        This appears to be a {contact?.intentScore && contact.intentScore > 70 ? 'high-intent' : 'general'} email. 
                        {contact?.intentScore && contact.intentScore > 70 ? ' Consider following up promptly.' : ' Standard response timeline applies.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Target className="h-3 w-3 mr-1" />
                          Mark as Lead
                        </Button>
                        <Button size="sm" variant="outline">
                          <CheckSquare className="h-3 w-3 mr-1" />
                          Create Task
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Mail className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Select an email
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Choose an email from the list to view its content
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contact Panel */}
      {viewMode === 'split' && showContactPanel && contact && (
        <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Contact</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContactPanel(false)}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Contact Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={contact.avatarUrl} />
                <AvatarFallback>
                  {contact.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{contact.name}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{contact.email}</p>
                {contact.company && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{contact.company}</p>
                )}
              </div>
            </div>

            {/* Intent Score */}
            {contact.intentScore && (
              <div>
                <h5 className="text-sm font-medium mb-2">Intent Score</h5>
                <Badge className={cn("text-xs", getIntentColor(contact.intentScore))}>
                  {contact.intentScore}% likely to convert
                </Badge>
              </div>
            )}

            {/* Contact Details */}
            <div className="space-y-2">
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{contact.location}</span>
                </div>
              )}
              {contact.title && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  <span>{contact.title}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {contact.tags.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Tags</h5>
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Deal History */}
            {contact.dealHistory && contact.dealHistory.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Deal History</h5>
                <div className="space-y-2">
                  {contact.dealHistory.slice(0, 3).map((deal) => (
                    <div key={deal.id} className="p-2 bg-white dark:bg-slate-800 rounded border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{deal.title}</span>
                        <span className="text-sm text-green-600">${deal.value.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={cn("text-xs", getStageColor(deal.stage))}>
                          {deal.stage}
                        </Badge>
                        <span className="text-xs text-slate-500">{deal.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {contact.notes && (
              <div>
                <h5 className="text-sm font-medium mb-2">Notes</h5>
                <p className="text-sm text-slate-600 dark:text-slate-400">{contact.notes}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button size="sm" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <CheckSquare className="h-4 w-4 mr-2" />
                Create Task
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                Add to Pipeline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
