"use client";

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import AppShell from "@/components/app/AppShell";
import MobileInbox from "@/components/app/MobileInbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import ComposeEmailModal from "@/components/inbox/ComposeEmailModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Search,
  Edit3,
  RefreshCw,
  Archive,
  Trash2,
  Tag,
  Forward,
  Reply,
  MoreHorizontal,
  Star,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Phone,
  Calendar,
  MessageSquare,
  Inbox,
  Filter,
  X,
  Eye,
  EyeOff
} from "lucide-react";

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  type: 'lead' | 'business' | 'follow-up' | 'inquiry' | 'personal';
  priority: 'high' | 'normal' | 'low';
  avatar: string;
  attachments?: number;
  labels: string[];
}

interface ApiThread {
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

export default function InboxPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [activeEmail, setActiveEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [replyToEmail, setReplyToEmail] = useState<{ email: string; name: string; subject: string; threadId: string } | null>(null);

  // Load emails from API
  const loadEmails = async (filter: string = 'all') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/inbox/threads?filter=${filter}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        const transformedEmails: Email[] = data.threads.map((thread: ApiThread) => {
          const primaryParticipant = thread.participants[0] || { name: 'Unknown', email: 'unknown@example.com' };
          
          // Generate initials for avatar
          const getInitials = (name: string) => {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          };
          
          // Determine type based on content/labels (with fallback to business logic)
          const getEmailType = (subject: string, labels: string[]): Email['type'] => {
            const subjectLower = subject.toLowerCase();
            if (subjectLower.includes('property') || subjectLower.includes('listing') || subjectLower.includes('viewing')) return 'lead';
            if (subjectLower.includes('follow') || subjectLower.includes('thank') || subjectLower.includes('tour')) return 'follow-up';
            if (subjectLower.includes('question') || subjectLower.includes('help') || subjectLower.includes('mortgage')) return 'inquiry';
            if (labels.some(l => l.toLowerCase().includes('business'))) return 'business';
            return 'business'; // default
          };
          
          // Determine priority based on subject/labels
          const getPriority = (subject: string, labels: string[]): Email['priority'] => {
            const subjectLower = subject.toLowerCase();
            if (subjectLower.includes('urgent') || subjectLower.includes('asap') || labels.some(l => l.toLowerCase().includes('urgent'))) return 'high';
            if (subjectLower.includes('low priority') || subjectLower.includes('when convenient')) return 'low';
            return 'normal';
          };
          
          // Format relative time
          const getRelativeTime = (dateStr: string) => {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffHours < 1) return 'Just now';
            if (diffHours < 24) return `${diffHours} hours ago`;
            if (diffDays === 1) return '1 day ago';
            if (diffDays < 7) return `${diffDays} days ago`;
            return date.toLocaleDateString();
          };
          
          return {
            id: thread.id,
            from: primaryParticipant.name,
            fromEmail: primaryParticipant.email,
            subject: thread.subject,
            preview: thread.snippet,
            body: `Email content from ${primaryParticipant.name}.\n\nThis is a real email thread with ${thread.messageCount} message${thread.messageCount !== 1 ? 's' : ''}.\n\nTo view the full conversation, additional API integration is needed.`,
            time: getRelativeTime(thread.lastMessageAt),
            isRead: !thread.unread,
            isStarred: thread.starred,
            isImportant: getPriority(thread.subject, thread.labels) === 'high',
            type: getEmailType(thread.subject, thread.labels),
            priority: getPriority(thread.subject, thread.labels),
            avatar: getInitials(primaryParticipant.name),
            attachments: thread.hasAttachments ? 1 : 0,
            labels: thread.labels
          };
        });
        
        setEmails(transformedEmails);
        if (transformedEmails.length > 0 && !activeEmail) {
          setActiveEmail(transformedEmails[0]);
        }
      } else {
        console.error('Failed to load emails:', response.statusText);
        // Fallback to empty array
        setEmails([]);
      }
    } catch (error) {
      console.error('Error loading emails:', error);
      // Fallback to empty array
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails(activeFilter);
  }, [activeFilter]);

  const filteredEmails = emails.filter(email => {
    if (activeFilter === 'unread' && email.isRead) return false;
    if (activeFilter === 'starred' && !email.isStarred) return false;
    if (activeFilter === 'important' && !email.isImportant) return false;
    if (activeFilter !== 'all' && activeFilter !== 'unread' && activeFilter !== 'starred' && activeFilter !== 'important') {
      if (email.type !== activeFilter) return false;
    }
    if (searchQuery) {
      return email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
             email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
             email.preview.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const toggleEmailSelection = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const selectAllEmails = () => {
    setSelectedEmails(
      selectedEmails.length === filteredEmails.length 
        ? [] 
        : filteredEmails.map(e => e.id)
    );
  };

  const markAsRead = async (emailIds: string[]) => {
    try {
      // Update UI optimistically
      setEmails(prev => prev.map(email => 
        emailIds.includes(email.id) ? { ...email, isRead: true } : email
      ));
      
      // Call API for each email
      await Promise.all(emailIds.map(id => 
        fetch(`/api/inbox/threads/${id}/read`, { method: 'POST' })
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
      // Reload to get correct state
      loadEmails(activeFilter);
    }
  };

  const markAsUnread = async (emailIds: string[]) => {
    try {
      // Update UI optimistically
      setEmails(prev => prev.map(email => 
        emailIds.includes(email.id) ? { ...email, isRead: false } : email
      ));
      
      // Call API for each email (DELETE to mark as unread)
      await Promise.all(emailIds.map(id => 
        fetch(`/api/inbox/threads/${id}/read`, { method: 'DELETE' })
      ));
    } catch (error) {
      console.error('Error marking as unread:', error);
      // Reload to get correct state
      loadEmails(activeFilter);
    }
  };

  const toggleStar = async (emailId: string) => {
    try {
      const email = emails.find(e => e.id === emailId);
      const newStarred = !email?.isStarred;
      
      // Update UI optimistically
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isStarred: newStarred } : email
      ));
      
      // Call API
      await fetch(`/api/inbox/threads/${emailId}/star`, { 
        method: newStarred ? 'POST' : 'DELETE' 
      });
    } catch (error) {
      console.error('Error toggling star:', error);
      // Reload to get correct state
      loadEmails(activeFilter);
    }
  };

  const archiveEmails = async (emailIds: string[]) => {
    try {
      // Update UI optimistically
      setEmails(prev => prev.filter(email => !emailIds.includes(email.id)));
      setSelectedEmails([]);
      
      // Clear active email if it was archived
      if (activeEmail && emailIds.includes(activeEmail.id)) {
        setActiveEmail(null);
      }
      
      // Call API for each email
      await Promise.all(emailIds.map(id => 
        fetch(`/api/inbox/threads/${id}/archive`, { method: 'POST' })
      ));
    } catch (error) {
      console.error('Error archiving emails:', error);
      // Reload to get correct state
      loadEmails(activeFilter);
    }
  };

  const deleteEmails = async (emailIds: string[]) => {
    try {
      // Update UI optimistically
      setEmails(prev => prev.filter(email => !emailIds.includes(email.id)));
      setSelectedEmails([]);
      
      // Clear active email if it was deleted
      if (activeEmail && emailIds.includes(activeEmail.id)) {
        setActiveEmail(null);
      }
      
      // Call API for each email
      await Promise.all(emailIds.map(id => 
        fetch(`/api/inbox/threads/${id}/delete`, { method: 'DELETE' })
      ));
    } catch (error) {
      console.error('Error deleting emails:', error);
      // Reload to get correct state
      loadEmails(activeFilter);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'low': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lead': return 'bg-green-100 text-green-800';
      case 'business': return 'bg-blue-100 text-blue-800';
      case 'follow-up': return 'bg-yellow-100 text-yellow-800';
      case 'inquiry': return 'bg-purple-100 text-purple-800';
      case 'personal': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const unreadCount = emails.filter(e => !e.isRead).length;
  const starredCount = emails.filter(e => e.isStarred).length;
  const importantCount = emails.filter(e => e.isImportant).length;

  // Handle email sent callback
  const handleEmailSent = () => {
    // Refresh the inbox to show the latest emails
    loadEmails(activeFilter);
    setReplyToEmail(null);
  };

  // Mobile view
  if (isMobile) {
    return (
      <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
        <AppShell>
          <MobileInbox />
        </AppShell>
      </div>
    );
  }

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        {/* Header */}
        <div className="px-4 mt-4 mb-2 main-content-area">
          <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl glass-card">
                  <Inbox className="h-6 w-6" style={{ color: 'var(--glass-primary)' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--glass-text)' }}>
                    Inbox
                  </h1>
                  <p style={{ color: 'var(--glass-text-secondary)' }}>
                    {filteredEmails.length} conversations • {unreadCount} unread
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="liquid" size="sm" onClick={() => loadEmails(activeFilter)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="liquid"
                size="lg"
                className="px-6"
                onClick={() => {
                  console.log('Compose button clicked in inbox');
                  setShowComposeModal(true);
                }}
              >
                <Edit3 className="h-5 w-5 mr-2" />
                Compose
              </Button>
            </div>
          </div>

          {/* Search and Filter Tabs */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 max-w-2xl relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" 
                style={{ color: 'var(--glass-text-muted)' }} />
              <Input
                variant="pill"
                placeholder="Search emails, contacts, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-sm"
              />
              {searchQuery && (
                <Button
                  variant="liquid"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="liquid" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveFilter('all')}>
                    All Mail
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter('unread')}>
                    Unread
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter('starred')}>
                    Starred
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter('important')}>
                    Important
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveFilter('lead')}>
                    Leads
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter('business')}>
                    Business
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter('follow-up')}>
                    Follow-ups
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: 'All Mail', count: emails.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'starred', label: 'Starred', count: starredCount },
              { key: 'important', label: 'Important', count: importantCount },
              { key: 'lead', label: 'Leads', count: emails.filter(e => e.type === 'lead').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeFilter === tab.key
                    ? "glass-badge"
                    : "glass-badge-muted"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant="liquid" className="ml-2 text-xs">
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 pb-4 main-content-area">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-full">
            {/* Email List */}
            <div className="xl:col-span-5 glass-card">
              {/* Selection Controls */}
              {selectedEmails.length > 0 && (
                <div className="p-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm" style={{ color: 'var(--glass-text-secondary)' }}>
                      {selectedEmails.length} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="liquid" size="sm" onClick={() => markAsRead(selectedEmails)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="liquid" size="sm" onClick={() => markAsUnread(selectedEmails)}>
                        <EyeOff className="h-4 w-4" />
                      </Button>
                      <Button variant="liquid" size="sm" onClick={() => archiveEmails(selectedEmails)}>
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button variant="liquid" size="sm" onClick={() => deleteEmails(selectedEmails)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="liquid" size="sm">
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Email List Header */}
              <div className="p-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedEmails.length === filteredEmails.length}
                    onChange={selectAllEmails}
                    className="rounded"
                  />
                  <span className="text-sm" style={{ color: 'var(--glass-text-secondary)' }}>
                    {filteredEmails.length} conversations
                  </span>
                </div>
              </div>

              {/* Email List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" 
                         style={{ borderColor: 'var(--glass-primary)' }}></div>
                    <p style={{ color: 'var(--glass-text-muted)' }}>Loading emails...</p>
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="p-8 text-center">
                    <Mail className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--glass-text-muted)' }} />
                    <h3 className="font-medium mb-2" style={{ color: 'var(--glass-text)' }}>
                      No emails found
                    </h3>
                    <p style={{ color: 'var(--glass-text-muted)' }}>
                      {searchQuery ? 'Try adjusting your search terms' : 'Your inbox is empty'}
                    </p>
                  </div>
                ) : (
                  filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      className={`p-4 border-b cursor-pointer transition-colors ${
                        activeEmail?.id === email.id ? 'bg-[var(--glass-surface-hover)]' : ''
                      } ${!email.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                      style={{ borderColor: 'var(--glass-border)' }}
                      onClick={() => setActiveEmail(email)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedEmails.includes(email.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleEmailSelection(email.id);
                          }}
                          className="mt-1 rounded"
                        />
                        
                        <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-sm font-medium">
                          {email.avatar}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span 
                              className={`font-medium truncate ${!email.isRead ? 'font-bold' : ''}`}
                              style={{ color: !email.isRead ? 'var(--glass-text)' : 'var(--glass-text-secondary)' }}
                            >
                              {email.from}
                            </span>
                            <div className="flex items-center gap-1">
                              {email.isStarred && (
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStar(email.id);
                                }}>
                                  <Star className="h-4 w-4" style={{ color: 'var(--glass-accent)', fill: 'var(--glass-accent)' }} />
                                </button>
                              )}
                              {getPriorityIcon(email.priority)}
                              <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                                {email.time}
                              </span>
                            </div>
                          </div>
                          
                          <p 
                            className={`text-sm mb-1 truncate ${!email.isRead ? 'font-medium' : ''}`}
                            style={{ color: !email.isRead ? 'var(--glass-text)' : 'var(--glass-text-secondary)' }}
                          >
                            {email.subject}
                          </p>
                          
                          <p className="text-xs truncate" style={{ color: 'var(--glass-text-muted)' }}>
                            {email.preview}
                          </p>
                          
                          <div className="flex items-center gap-1 mt-2">
                            <Badge className={`${getTypeColor(email.type)} text-xs border-0`}>
                              {email.type}
                            </Badge>
                            {email.attachments && email.attachments > 0 && (
                              <Badge variant="liquid" className="text-xs">
                                {email.attachments} attachments
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Email Detail View */}
            <div className="xl:col-span-7 glass-card">
              {activeEmail ? (
                <div className="h-full flex flex-col">
                  {/* Email Header */}
                  <div className="p-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center font-medium">
                          {activeEmail.avatar}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg" style={{ color: 'var(--glass-text)' }}>
                            {activeEmail.subject}
                          </h3>
                          <p style={{ color: 'var(--glass-text-secondary)' }}>
                            from {activeEmail.from} • {activeEmail.time}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="liquid" size="sm" onClick={() => {
                          setReplyToEmail({
                            email: activeEmail.fromEmail,
                            name: activeEmail.from,
                            subject: activeEmail.subject,
                            threadId: activeEmail.id
                          });
                          setShowComposeModal(true);
                        }}>
                          <Reply className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                        <Button variant="liquid" size="sm">
                          <Forward className="h-4 w-4 mr-1" />
                          Forward
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="liquid" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleStar(activeEmail.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              {activeEmail.isStarred ? 'Unstar' : 'Star'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => archiveEmails([activeEmail.id])}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Tag className="h-4 w-4 mr-2" />
                              Add Label
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteEmails([activeEmail.id])}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={`${getTypeColor(activeEmail.type)} text-xs border-0`}>
                        {activeEmail.type.charAt(0).toUpperCase() + activeEmail.type.slice(1)}
                      </Badge>
                      {activeEmail.priority === 'high' && (
                        <Badge className="bg-red-100 text-red-800 text-xs border-0">
                          High Priority
                        </Badge>
                      )}
                      {activeEmail.labels.map((label) => (
                        <Badge key={label} variant="liquid" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Email Content */}
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div 
                      className="prose max-w-none whitespace-pre-wrap"
                      style={{ color: 'var(--glass-text)' }}
                    >
                      {activeEmail.body}
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                      <h4 className="font-medium mb-3" style={{ color: 'var(--glass-text)' }}>
                        Quick Actions
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="liquid" className="justify-start" onClick={() => router.push('/app/calendar')}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Viewing
                        </Button>
                        <Button variant="liquid" className="justify-start" onClick={() => window.open(`tel:${activeEmail?.fromEmail}`)}>
                          <Phone className="h-4 w-4 mr-2" />
                          Call Client
                        </Button>
                        <Button variant="liquid" className="justify-start" onClick={() => router.push('/app/documents')}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Property Info
                        </Button>
                        <Button variant="liquid" className="justify-start" onClick={() => router.push('/app/contacts')}>
                          <User className="h-4 w-4 mr-2" />
                          Add to CRM
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Mail className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--glass-text-muted)' }} />
                    <h3 className="font-medium mb-2" style={{ color: 'var(--glass-text)' }}>
                      Select an email
                    </h3>
                    <p style={{ color: 'var(--glass-text-muted)' }}>
                      Choose an email from the list to view its contents
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>

      {/* Compose Email Modal */}
      <ComposeEmailModal
        trigger={null}
        threadId={replyToEmail?.threadId}
        defaultTo={replyToEmail?.email || ''}
        defaultSubject={replyToEmail?.subject || ''}
        onEmailSent={handleEmailSent}
        open={showComposeModal}
        onOpenChange={setShowComposeModal}
      />
    </div>
  );
}