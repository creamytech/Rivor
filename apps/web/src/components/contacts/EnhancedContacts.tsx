"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  User, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  CheckSquare, 
  Star, 
  AlertTriangle, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Tag, 
  Users, 
  Briefcase, 
  Clock, 
  Target, 
  Zap, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Phone as PhoneIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  Calendar as CalendarIcon,
  MessageSquare as MessageIcon,
  CheckSquare as TaskIcon,
  Star as StarIcon,
  AlertTriangle as AlertIcon,
  MoreHorizontal as MoreIcon,
  Edit as EditIcon,
  Trash2 as TrashIcon,
  Copy as CopyIcon,
  ExternalLink as ExternalLinkIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Tag as TagIcon,
  Users as UsersIcon,
  Briefcase as BriefcaseIcon,
  Clock as ClockIcon,
  Target as TargetIcon,
  Zap as ZapIcon,
  Sparkles as SparklesIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  starred: boolean;
  tags: string[];
  lastActivity: string;
  emailCount: number;
  leadCount: number;
  source: 'email' | 'manual' | 'import';
  createdAt: string;
  updatedAt: string;
}

interface EnhancedContactsProps {
  className?: string;
  searchQuery?: string;
  selectedFilters?: string[];
}

export default function EnhancedContacts({ className, searchQuery = '', selectedFilters = [] }: EnhancedContactsProps) {
  // All hooks must be called at the top level
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDrawer, setShowContactDrawer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'lastActivity' | 'emailCount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedFilters.length > 0) params.append('filter', selectedFilters[0]); // API supports one filter at a time
        
        const response = await fetch(`/api/contacts?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setContacts(data.contacts || []);
        } else {
          setContacts([]);
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
        setContacts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [searchQuery, selectedFilters]);

  // Helper functions - moved outside of render to avoid recreation
  const getStatusColor = (source: string) => {
    switch (source) {
      case 'email':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'manual':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'import':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400';
    }
  };

  const getHealthColor = (health: 'good' | 'warning' | 'poor') => {
    switch (health) {
      case 'good':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'poor':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400';
    }
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <MailIcon className="h-4 w-4" />;
      case 'call':
        return <PhoneIcon className="h-4 w-4" />;
      case 'meeting':
        return <CalendarIcon className="h-4 w-4" />;
      case 'note':
        return <MessageIcon className="h-4 w-4" />;
      case 'task':
        return <TaskIcon className="h-4 w-4" />;
      default:
        return <MessageIcon className="h-4 w-4" />;
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = searchQuery === '' || 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilters = selectedFilters.length === 0 || 
      selectedFilters.some(filter => contact.tags.includes(filter) || contact.source === filter);
    
    return matchesSearch && matchesFilters;
  });

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'company':
        aValue = a.company || '';
        bValue = b.company || '';
        break;
      case 'lastActivity':
        aValue = new Date(a.lastActivity);
        bValue = new Date(b.lastActivity);
        break;
      case 'emailCount':
        aValue = a.emailCount;
        bValue = b.emailCount;
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Error boundary - if anything fails, show a simple loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex", className)}>
      {/* Contact List */}
      <div className="flex-1 flex flex-col">


        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {viewMode === 'list' ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {sortedContacts.map(contact => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedContact(contact);
                    setShowContactDrawer(true);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contact.avatarUrl} />
                      <AvatarFallback>
                        {contact.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">
                          {contact.name}
                        </h3>
                        {contact.starred && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(contact.source))}>
                          {contact.source}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        {contact.company && (
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {contact.company}
                          </div>
                        )}
                        {contact.title && (
                          <span>{contact.title}</span>
                        )}
                        {contact.location && (
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="h-4 w-4" />
                            {contact.location}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {contact.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {contact.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{contact.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {formatDate(contact.lastActivity)}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {contact.emailCount} emails
                      </div>
                      {contact.leadCount > 0 && (
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          {contact.leadCount} leads
                        </div>
                      )}
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {sortedContacts.map(contact => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedContact(contact);
                    setShowContactDrawer(true);
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.avatarUrl} />
                      <AvatarFallback>
                        {contact.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {contact.name}
                      </h3>
                      {contact.company && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                          {contact.company}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(contact.source))}>
                        {contact.source}
                      </Badge>
                      {contact.starred && (
                        <Star className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {contact.email}
                    </div>
                    
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {contact.emailCount} emails • {contact.leadCount} leads
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Detail Drawer */}
      <AnimatePresence>
        {showContactDrawer && selectedContact && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="w-96 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContactDrawer(false)}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedContact.avatarUrl} />
                  <AvatarFallback className="text-lg">
                    {selectedContact.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">
                    {selectedContact.name}
                  </h2>
                  {selectedContact.title && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedContact.title}
                    </p>
                  )}
                  {selectedContact.company && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedContact.company}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Contact Details */}
              <div>
                <h3 className="font-medium mb-3">Contact Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{selectedContact.email}</span>
                  </div>
                  {selectedContact.phone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{selectedContact.phone}</span>
                    </div>
                  )}
                  {selectedContact.location && (
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{selectedContact.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {selectedContact.tags.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedContact.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Summary */}
              <div>
                <h3 className="font-medium mb-3">Activity Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Count</span>
                    <span className="text-sm font-medium">{selectedContact.emailCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lead Count</span>
                    <span className="text-sm font-medium">{selectedContact.leadCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Activity</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(selectedContact.lastActivity)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Source</span>
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(selectedContact.source))}>
                      {selectedContact.source}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact History */}
              <div>
                <h3 className="font-medium mb-3">Contact History</h3>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p>Created: {formatDate(selectedContact.createdAt)}</p>
                  <p>Updated: {formatDate(selectedContact.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4" />
                  Email
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4" />
                  Call
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Meeting
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <TaskIcon className="h-4 w-4" />
                  Task
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
