"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Mail, 
  Star, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  MoreHorizontal,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash2,
  Pin,
  Snooze,
  Tag,
  User,
  Building,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
  FileText,
  Download,
  Eye,
  EyeOff,
  Filter,
  Search,
  ChevronRight,
  ChevronLeft,
  Send,
  Edit,
  Plus,
  Sparkles,
  Zap,
  Target,
  Briefcase,
  CheckSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailThread {
  id: string;
  subject: string;
  participants: {
    name: string;
    email: string;
    avatar?: string;
  }[];
  lastMessage: {
    content: string;
    timestamp: Date;
    from: string;
  };
  unread: boolean;
  starred: boolean;
  snoozed: boolean;
  labels: string[];
  intent: {
    score: number;
    type: 'lead' | 'deal' | 'support' | 'general';
    confidence: number;
  };
  priority: 'high' | 'medium' | 'low';
  stage?: 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'closed';
  tags: string[];
  attachments: number;
  threadLength: number;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  phone?: string;
  avatar?: string;
  lastContact: Date;
  dealHistory: {
    id: string;
    title: string;
    value: number;
    status: string;
  }[];
  notes: string[];
  tags: string[];
  intent: number;
}

interface EnhancedInboxProps {
  activeTab: string;
  searchQuery: string;
  selectedFilter: string | null;
}

export default function EnhancedInbox({ 
  activeTab, 
  searchQuery, 
  selectedFilter 
}: EnhancedInboxProps) {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [showContactPanel, setShowContactPanel] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'thread'>('split');

  // Mock data
  const mockThreads: EmailThread[] = [
    {
      id: '1',
      subject: 'Proposal Discussion - TechCorp Enterprise Deal',
      participants: [
        { name: 'Sarah Johnson', email: 'sarah@techcorp.com', avatar: '/api/avatar/sarah' },
        { name: 'John Doe', email: 'john@company.com' }
      ],
      lastMessage: {
        content: 'Hi John, I\'ve reviewed the proposal and have some questions about the implementation timeline...',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        from: 'sarah@techcorp.com'
      },
      unread: true,
      starred: true,
      snoozed: false,
      labels: ['leads', 'proposal'],
      intent: {
        score: 0.85,
        type: 'lead',
        confidence: 0.92
      },
      priority: 'high',
      stage: 'proposal',
      tags: ['enterprise', 'tech', 'proposal'],
      attachments: 2,
      threadLength: 8
    },
    {
      id: '2',
      subject: 'Contract Review - StartupXYZ',
      participants: [
        { name: 'Mike Chen', email: 'mike@startupxyz.com', avatar: '/api/avatar/mike' },
        { name: 'John Doe', email: 'john@company.com' }
      ],
      lastMessage: {
        content: 'The contract looks good overall. Can we discuss the payment terms?',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        from: 'mike@startupxyz.com'
      },
      unread: false,
      starred: false,
      snoozed: false,
      labels: ['deals', 'contract'],
      intent: {
        score: 0.78,
        type: 'deal',
        confidence: 0.85
      },
      priority: 'medium',
      stage: 'negotiation',
      tags: ['startup', 'contract', 'payment'],
      attachments: 1,
      threadLength: 12
    },
    {
      id: '3',
      subject: 'Product Demo Request',
      participants: [
        { name: 'David Wilson', email: 'david@acmecorp.com', avatar: '/api/avatar/david' },
        { name: 'John Doe', email: 'john@company.com' }
      ],
      lastMessage: {
        content: 'We\'re interested in seeing a demo of your platform. When would be a good time?',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        from: 'david@acmecorp.com'
      },
      unread: true,
      starred: false,
      snoozed: false,
      labels: ['leads', 'demo'],
      intent: {
        score: 0.72,
        type: 'lead',
        confidence: 0.78
      },
      priority: 'medium',
      stage: 'prospect',
      tags: ['demo', 'acme', 'interest'],
      attachments: 0,
      threadLength: 3
    }
  ];

  const mockContact: Contact = {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@techcorp.com',
    company: 'TechCorp Inc.',
    title: 'VP of Engineering',
    phone: '+1 (555) 123-4567',
    avatar: '/api/avatar/sarah',
    lastContact: new Date(Date.now() - 2 * 60 * 60 * 1000),
    dealHistory: [
      { id: '1', title: 'Enterprise License', value: 250000, status: 'In Progress' },
      { id: '2', title: 'Professional Services', value: 50000, status: 'Completed' }
    ],
    notes: [
      'Interested in enterprise features',
      'Decision maker for technical purchases',
      'Prefers technical demos over sales pitches'
    ],
    tags: ['enterprise', 'technical', 'decision-maker'],
    intent: 85
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setThreads(mockThreads);
      setSelectedThread(mockThreads[0]);
      setContact(mockContact);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const getIntentColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  const getStageColor = (stage?: string) => {
    switch (stage) {
      case 'prospect':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'qualified':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'proposal':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'negotiation':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'closed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return 'now';
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
        "border-r border-slate-200 dark:border-slate-700",
        viewMode === 'split' ? 'w-1/3' : 'w-full'
      )}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
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

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mb-4">
            <Button size="sm" className="flex items-center gap-2">
              <Reply className="h-4 w-4" />
              Reply
            </Button>
            <Button size="sm" variant="outline" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archive
            </Button>
            <Button size="sm" variant="outline" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tag
            </Button>
          </div>
        </div>

        {/* Thread List */}
        <div className="overflow-y-auto h-[calc(100vh-200px)]">
          {threads.map((thread) => (
            <motion.div
              key={thread.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                selectedThread?.id === thread.id && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              )}
              onClick={() => setSelectedThread(thread)}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={thread.participants[0].avatar} />
                  <AvatarFallback>
                    {thread.participants[0].name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {thread.participants[0].name}
                    </span>
                    {thread.starred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                    {thread.unread && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>

                  <h3 className={cn(
                    "text-sm font-medium mb-1 line-clamp-1",
                    thread.unread ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"
                  )}>
                    {thread.subject}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                    {thread.lastMessage.content}
                  </p>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", getIntentColor(thread.intent.score))}
                    >
                      {Math.round(thread.intent.score * 100)}% Intent
                    </Badge>
                    
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", getPriorityColor(thread.priority))}
                    >
                      {thread.priority}
                    </Badge>

                    {thread.stage && (
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getStageColor(thread.stage))}
                      >
                        {thread.stage}
                      </Badge>
                    )}

                    {thread.attachments > 0 && (
                      <Badge variant="outline" className="text-xs">
                        📎 {thread.attachments}
                      </Badge>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatTime(thread.lastMessage.timestamp)}</span>
                    <span>{thread.threadLength} messages</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Thread Panel */}
      {viewMode === 'split' && selectedThread && (
        <div className="flex-1 flex">
          {/* Email Content */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{selectedThread.subject}</h2>
                <div className="flex items-center gap-2">
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

              {/* AI Summary */}
              <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      AI Summary
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    This thread shows high intent (85%) for a lead opportunity. Sarah is interested in the enterprise proposal 
                    and has questions about implementation timeline. Recommended next action: Schedule a technical demo.
                  </p>
                </CardContent>
              </Card>

              {/* Email Content */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedThread.participants[0].avatar} />
                    <AvatarFallback>
                      {selectedThread.participants[0].name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{selectedThread.participants[0].name}</span>
                      <span className="text-xs text-slate-500">{selectedThread.participants[0].email}</span>
                      <span className="text-xs text-slate-400">{formatTime(selectedThread.lastMessage.timestamp)}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {selectedThread.lastMessage.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Panel */}
          {showContactPanel && contact && (
            <div className="w-80 border-l border-slate-200 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Contact</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowContactPanel(false)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Contact Info */}
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-3">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className="text-lg">
                      {contact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold">{contact.name}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{contact.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{contact.company}</p>
                </div>

                {/* Contact Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{contact.email}</span>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                </div>

                {/* Intent Score */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Intent Score</span>
                    <span className="text-sm font-bold text-green-600">{contact.intent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${contact.intent}%` }}
                    />
                  </div>
                </div>

                {/* Deal History */}
                <div>
                  <h5 className="font-medium mb-2">Deal History</h5>
                  <div className="space-y-2">
                    {contact.dealHistory.map((deal) => (
                      <div key={deal.id} className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-sm">
                        <div className="font-medium">{deal.title}</div>
                        <div className="text-slate-600 dark:text-slate-400">
                          ${deal.value.toLocaleString()} • {deal.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h5 className="font-medium mb-2">Notes</h5>
                  <div className="space-y-1">
                    {contact.notes.map((note, index) => (
                      <div key={index} className="text-sm text-slate-600 dark:text-slate-400">
                        • {note}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h5 className="font-medium mb-2">Tags</h5>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

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
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
