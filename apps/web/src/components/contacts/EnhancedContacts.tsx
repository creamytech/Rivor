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
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  location?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'lead' | 'customer' | 'prospect';
  tags: string[];
  notes?: string;
  lastContact?: Date;
  nextFollowUp?: Date;
  dealValue?: number;
  dealStage?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  gdprOptIn: boolean;
  source: 'manual' | 'import' | 'website' | 'referral' | 'event';
  createdAt: Date;
  updatedAt: Date;
  health: {
    emailHealth: 'good' | 'warning' | 'poor';
    phoneHealth: 'good' | 'warning' | 'poor';
    engagementScore: number;
    lastActivity: Date;
  };
  activities: {
    id: string;
    type: 'email' | 'call' | 'meeting' | 'note' | 'task';
    title: string;
    date: Date;
    description?: string;
  }[];
  deals: {
    id: string;
    title: string;
    value: number;
    stage: string;
    probability: number;
    expectedClose: Date;
  }[];
}

interface EnhancedContactsProps {
  className?: string;
  searchQuery?: string;
  selectedFilters?: string[];
}

export default function EnhancedContacts({ className, searchQuery = '', selectedFilters = [] }: EnhancedContactsProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDrawer, setShowContactDrawer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'lastContact' | 'dealValue'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Mock contacts data
  const mockContacts: Contact[] = [
    {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@techcorp.com',
      phone: '+1 (555) 123-4567',
      company: 'TechCorp Inc.',
      title: 'VP of Engineering',
      location: 'San Francisco, CA',
      avatar: '/api/avatar/sarah',
      status: 'lead',
      tags: ['enterprise', 'tech', 'decision-maker'],
      notes: 'Interested in enterprise features. Prefers technical demos.',
      lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      nextFollowUp: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      dealValue: 50000,
      dealStage: 'Proposal',
      emailVerified: true,
      phoneVerified: true,
      gdprOptIn: true,
      source: 'website',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      health: {
        emailHealth: 'good',
        phoneHealth: 'good',
        engagementScore: 85,
        lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      activities: [
        {
          id: 'act1',
          type: 'email',
          title: 'Product Demo Follow-up',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          description: 'Sent demo recording and pricing information'
        },
        {
          id: 'act2',
          type: 'meeting',
          title: 'Product Demo',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          description: '45-minute demo of enterprise features'
        }
      ],
      deals: [
        {
          id: 'deal1',
          title: 'TechCorp Enterprise License',
          value: 50000,
          stage: 'Proposal',
          probability: 75,
          expectedClose: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ]
    },
    {
      id: '2',
      firstName: 'Mike',
      lastName: 'Chen',
      email: 'mike@startupxyz.com',
      phone: '+1 (555) 987-6543',
      company: 'StartupXYZ',
      title: 'Founder & CEO',
      location: 'Austin, TX',
      avatar: '/api/avatar/mike',
      status: 'customer',
      tags: ['startup', 'founder', 'early-adopter'],
      notes: 'Early customer. Very satisfied with the product.',
      lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      dealValue: 15000,
      dealStage: 'Closed Won',
      emailVerified: true,
      phoneVerified: false,
      gdprOptIn: true,
      source: 'referral',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      health: {
        emailHealth: 'good',
        phoneHealth: 'warning',
        engagementScore: 92,
        lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      activities: [
        {
          id: 'act3',
          type: 'call',
          title: 'Quarterly Check-in',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          description: 'Discussed upcoming features and renewal'
        }
      ],
      deals: [
        {
          id: 'deal2',
          title: 'StartupXYZ Annual License',
          value: 15000,
          stage: 'Closed Won',
          probability: 100,
          expectedClose: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      ]
    },
    {
      id: '3',
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@bigcorp.com',
      phone: '+1 (555) 456-7890',
      company: 'BigCorp Solutions',
      title: 'Director of Operations',
      location: 'New York, NY',
      avatar: '/api/avatar/emily',
      status: 'prospect',
      tags: ['enterprise', 'operations', 'evaluating'],
      notes: 'Currently evaluating our solution against competitors.',
      lastContact: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      nextFollowUp: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      dealValue: 75000,
      dealStage: 'Evaluation',
      emailVerified: true,
      phoneVerified: true,
      gdprOptIn: false,
      source: 'event',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      health: {
        emailHealth: 'good',
        phoneHealth: 'good',
        engagementScore: 78,
        lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      activities: [
        {
          id: 'act4',
          type: 'email',
          title: 'Trial Extension Request',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          description: 'Requested additional time for evaluation'
        }
      ],
      deals: [
        {
          id: 'deal3',
          title: 'BigCorp Enterprise Deployment',
          value: 75000,
          stage: 'Evaluation',
          probability: 60,
          expectedClose: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
        }
      ]
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setContacts(mockContacts);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'prospect':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'customer':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400';
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

  const formatDate = (date: Date) => {
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
      contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilters = selectedFilters.length === 0 || 
      selectedFilters.some(filter => contact.tags.includes(filter) || contact.status === filter);
    
    return matchesSearch && matchesFilters;
  });

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = `${a.firstName} ${a.lastName}`;
        bValue = `${b.firstName} ${b.lastName}`;
        break;
      case 'company':
        aValue = a.company || '';
        bValue = b.company || '';
        break;
      case 'lastContact':
        aValue = a.lastContact || new Date(0);
        bValue = b.lastContact || new Date(0);
        break;
      case 'dealValue':
        aValue = a.dealValue || 0;
        bValue = b.dealValue || 0;
        break;
      default:
        aValue = a.firstName;
        bValue = b.firstName;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

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
        {/* List Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Contacts ({sortedContacts.length})</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <UsersIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <BriefcaseIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <UploadIcon className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button size="sm" variant="outline">
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

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
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback>
                        {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(contact.status))}>
                          {contact.status}
                        </Badge>
                        {contact.emailVerified && (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                        )}
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
                        {contact.lastContact ? formatDate(contact.lastContact) : 'Never'}
                      </div>
                      {contact.dealValue && (
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(contact.dealValue)}
                        </div>
                      )}
                      <div className={cn("text-sm font-medium", getEngagementColor(contact.health.engagementScore))}>
                        {contact.health.engagementScore}% engaged
                      </div>
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
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback>
                        {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {contact.firstName} {contact.lastName}
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
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(contact.status))}>
                        {contact.status}
                      </Badge>
                      {contact.emailVerified && (
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Email
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {contact.email}
                    </div>
                    
                    {contact.dealValue && (
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(contact.dealValue)}
                      </div>
                    )}
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
                  <AvatarImage src={selectedContact.avatar} />
                  <AvatarFallback className="text-lg">
                    {selectedContact.firstName.charAt(0)}{selectedContact.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">
                    {selectedContact.firstName} {selectedContact.lastName}
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
              {/* Health Status */}
              <div>
                <h3 className="font-medium mb-3">Health Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Health</span>
                    <Badge variant="outline" className={cn("text-xs", getHealthColor(selectedContact.health.emailHealth))}>
                      {selectedContact.health.emailHealth}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Phone Health</span>
                    <Badge variant="outline" className={cn("text-xs", getHealthColor(selectedContact.health.phoneHealth))}>
                      {selectedContact.health.phoneHealth}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Engagement Score</span>
                    <span className={cn("text-sm font-medium", getEngagementColor(selectedContact.health.engagementScore))}>
                      {selectedContact.health.engagementScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div>
                <h3 className="font-medium mb-3">Contact Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{selectedContact.email}</span>
                    {selectedContact.emailVerified && (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {selectedContact.phone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{selectedContact.phone}</span>
                      {selectedContact.phoneVerified && (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      )}
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

              {/* Deals */}
              {selectedContact.deals.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Deals</h3>
                  <div className="space-y-2">
                    {selectedContact.deals.map(deal => (
                      <div key={deal.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{deal.title}</h4>
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(deal.value)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>{deal.stage}</span>
                          <span>{deal.probability}% probability</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {selectedContact.activities.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Recent Activity</h3>
                  <div className="space-y-2">
                    {selectedContact.activities.slice(0, 5).map(activity => (
                      <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                        <div className="p-1 rounded bg-slate-100 dark:bg-slate-800">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {formatDate(activity.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedContact.notes && (
                <div>
                  <h3 className="font-medium mb-3">Notes</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedContact.notes}
                  </p>
                </div>
              )}
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
