"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload,
  Table,
  Grid3X3,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Star,
  User,
  Home,
  ArrowRight,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  Tag,
  MessageSquare,
  FileText,
  Settings,
  Eye,
  Edit,
  Trash2,
  Link,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  source: string;
  lastActivity: string;
  leadCount: number;
  tags: string[];
  avatar?: string;
  enriched?: {
    phone?: string;
    organization?: string;
    linkedin?: string;
    twitter?: string;
    location?: string;
  };
  timeline: Array<{
    id: string;
    type: 'email' | 'call' | 'meeting' | 'note' | 'lead';
    description: string;
    date: string;
    linkedEmailId?: string;
  }>;
  properties: Array<{
    key: string;
    value: string;
    source: 'manual' | 'enrichment' | 'signature';
  }>;
  linkedDeals: Array<{
    id: string;
    title: string;
    value: number;
    stage: string;
  }>;
}

interface DuplicateGroup {
  id: string;
  contacts: Contact[];
  confidence: number;
  reason: string;
}

interface Segment {
  id: string;
  name: string;
  count: number;
  color: string;
  criteria: string;
}

export default function EnhancedContacts() {
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showSideDrawer, setShowSideDrawer] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [showDedupeBanner, setShowDedupeBanner] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock data
  useEffect(() => {
    const mockContacts: Contact[] = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1 (555) 123-4567',
        company: 'Tech Corp',
        title: 'CTO',
        source: 'Email',
        lastActivity: '2 hours ago',
        leadCount: 3,
        tags: ['high-priority', 'decision-maker'],
        enriched: {
          phone: '+1 (555) 123-4567',
          organization: 'Tech Corp',
          linkedin: 'linkedin.com/in/johnsmith',
          location: 'San Francisco, CA'
        },
        timeline: [
          {
            id: '1',
            type: 'email',
            description: 'Property inquiry - 123 Main St',
            date: '2 hours ago',
            linkedEmailId: 'email-1'
          },
          {
            id: '2',
            type: 'lead',
            description: 'Created lead: Property inquiry',
            date: '2 hours ago'
          }
        ],
        properties: [
          { key: 'Phone', value: '+1 (555) 123-4567', source: 'enrichment' },
          { key: 'Company', value: 'Tech Corp', source: 'manual' },
          { key: 'Title', value: 'CTO', source: 'manual' },
          { key: 'Location', value: 'San Francisco, CA', source: 'enrichment' }
        ],
        linkedDeals: [
          { id: 'deal-1', title: 'Property inquiry - 123 Main St', value: 350000, stage: 'qualified' }
        ]
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        company: 'Startup Inc',
        title: 'CEO',
        source: 'Website',
        lastActivity: '1 day ago',
        leadCount: 1,
        tags: ['commercial', 'lease'],
        timeline: [
          {
            id: '3',
            type: 'email',
            description: 'Commercial property viewing request',
            date: '1 day ago',
            linkedEmailId: 'email-2'
          }
        ],
        properties: [
          { key: 'Company', value: 'Startup Inc', source: 'manual' },
          { key: 'Title', value: 'CEO', source: 'manual' }
        ],
        linkedDeals: [
          { id: 'deal-2', title: 'Commercial lease inquiry', value: 120000, stage: 'new' }
        ]
      },
      {
        id: '3',
        name: 'Mike Wilson',
        email: 'mike@email.com',
        phone: '+1 (555) 456-7890',
        company: 'Individual',
        source: 'Referral',
        lastActivity: '3 days ago',
        leadCount: 2,
        tags: ['seller', 'valuation'],
        enriched: {
          phone: '+1 (555) 456-7890',
          organization: 'Individual',
          location: 'Austin, TX'
        },
        timeline: [
          {
            id: '4',
            type: 'call',
            description: 'Initial consultation call',
            date: '3 days ago'
          },
          {
            id: '5',
            type: 'lead',
            description: 'Created lead: House valuation request',
            date: '3 days ago'
          }
        ],
        properties: [
          { key: 'Phone', value: '+1 (555) 456-7890', source: 'enrichment' },
          { key: 'Company', value: 'Individual', source: 'manual' },
          { key: 'Location', value: 'Austin, TX', source: 'enrichment' }
        ],
        linkedDeals: [
          { id: 'deal-3', title: 'House valuation request', value: 450000, stage: 'qualified' }
        ]
      }
    ];

    const mockDuplicates: DuplicateGroup[] = [
      {
        id: 'dup-1',
        contacts: [
          { ...mockContacts[0] },
          { ...mockContacts[0], id: '1b', email: 'john.smith@techcorp.com' }
        ],
        confidence: 95,
        reason: 'Same name, similar email domains'
      }
    ];

    const mockSegments: Segment[] = [
      { id: '1', name: 'New last 7d', count: 12, color: 'blue', criteria: 'created:last7days' },
      { id: '2', name: 'With Leads', count: 8, color: 'green', criteria: 'has:leads' },
      { id: '3', name: 'Dormant 30d', count: 15, color: 'orange', criteria: 'lastActivity:>30days' }
    ];

    setContacts(mockContacts);
    setDuplicateGroups(mockDuplicates);
    setSegments(mockSegments);
    setShowDedupeBanner(mockDuplicates.length > 0);
    setLoading(false);
  }, []);

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setShowSideDrawer(true);
  };

  const handleDedupeAccept = (groupId: string) => {
    setDuplicateGroups(prev => prev.filter(g => g.id !== groupId));
    setShowDedupeBanner(duplicateGroups.length > 1);
  };

  const handleDedupeReview = (groupId: string) => {
    // Open detailed review modal
    console.log('Review duplicates for group:', groupId);
  };

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-400">Name</th>
            <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-400">Email</th>
            <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-400">Source</th>
            <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-400">Last Activity</th>
            <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-400">Leads</th>
            <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-400">Tags</th>
            <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr
              key={contact.id}
              className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
              onClick={() => handleContactClick(contact)}
            >
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                      {contact.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {contact.name}
                    </div>
                    {contact.company && (
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {contact.company}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="p-4 text-slate-900 dark:text-slate-100">
                {contact.email}
              </td>
              <td className="p-4">
                <Badge variant="outline" className="text-xs">
                  {contact.source}
                </Badge>
              </td>
              <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                {contact.lastActivity}
              </td>
              <td className="p-4">
                <Badge variant="secondary" className="text-xs">
                  {contact.leadCount}
                </Badge>
              </td>
              <td className="p-4">
                <div className="flex gap-1 flex-wrap">
                  {contact.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {contact.tags.length > 2 && (
                    <span className="text-xs text-slate-500">
                      +{contact.tags.length - 2}
                    </span>
                  )}
                </div>
              </td>
              <td className="p-4">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {contacts.map((contact) => (
        <motion.div
          key={contact.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleContactClick(contact)}
        >
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={contact.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                {contact.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                {contact.name}
              </h3>
              {contact.company && (
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  {contact.company}
                </p>
              )}
              <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                {contact.email}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Last activity:</span>
              <span className="text-slate-900 dark:text-slate-100">{contact.lastActivity}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Leads:</span>
              <Badge variant="secondary" className="text-xs">
                {contact.leadCount}
              </Badge>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {contact.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {contact.tags.length > 3 && (
                <span className="text-xs text-slate-500">
                  +{contact.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderSideDrawer = () => (
    <AnimatePresence>
      {showSideDrawer && selectedContact && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 z-50 overflow-y-auto"
        >
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Contact Profile
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSideDrawer(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Contact Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedContact.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white text-lg">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {selectedContact.name}
                </h3>
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

            {/* Properties */}
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Properties</h4>
              <div className="space-y-2">
                {selectedContact.properties.map((prop) => (
                  <div key={prop.key} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{prop.key}:</span>
                    <span className="text-sm text-slate-900 dark:text-slate-100">{prop.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Timeline</h4>
              <div className="space-y-2">
                {selectedContact.timeline.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-900 dark:text-slate-100">{item.description}</p>
                      <p className="text-xs text-slate-500">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Deals */}
            {selectedContact.linkedDeals.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Linked Deals</h4>
                <div className="space-y-2">
                  {selectedContact.linkedDeals.map((deal) => (
                    <div key={deal.id} className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{deal.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          ${deal.value.toLocaleString()}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {deal.stage}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-6">
      {/* Dedupe Banner */}
      <AnimatePresence>
        {showDedupeBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GlassCard variant="gradient" intensity="medium" className="border-yellow-200 dark:border-yellow-800">
              <GlassCardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        {duplicateGroups.length} possible merges found
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Review and merge duplicate contacts to keep your data clean
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDedupeReview(duplicateGroups[0].id)}
                    >
                      Review
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDedupeAccept(duplicateGroups[0].id)}
                    >
                      Accept All
                    </Button>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <GlassCard variant="gradient" intensity="medium">
        <GlassCardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              
              <div className="flex items-center gap-1">
                <Button
                  variant={view === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('table')}
                >
                  <Table className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('cards')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button 
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Segments */}
      <GlassCard variant="gradient" intensity="light">
        <GlassCardContent className="p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Segments:
            </span>
            {segments.map((segment) => (
              <Button
                key={segment.id}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {segment.name}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {segment.count}
                </Badge>
              </Button>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Content */}
      <GlassCard variant="gradient" intensity="medium" className="min-h-[600px]">
        <GlassCardContent className="p-6">
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No contacts yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Contacts auto-create from inbox — import CSV to get started
              </p>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </div>
          ) : (
            view === 'table' ? renderTableView() : renderCardsView()
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Side Drawer */}
      {renderSideDrawer()}
    </div>
  );
}
