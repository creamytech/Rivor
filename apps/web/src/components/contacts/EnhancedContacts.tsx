"use client";
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  Copy,
  Share2,
  Star,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronRight,
  Download,
  Upload,
  Tag,
  Hash,
  TrendingUp,
  TrendingDown,
  Activity,
  MessageSquare,
  FileText,
  Settings
} from 'lucide-react';

interface Contact {
  id: string;
  nameEnc: any;
  emailEnc: any;
  companyEnc: any;
  phoneEnc: any;
  createdAt: string;
  updatedAt: string;
  leads: Array<{
    id: string;
    title: string | null;
    status: string;
    stage?: {
      name: string;
      color: string | null;
    } | null;
    assignedTo?: {
      user: {
        name: string | null;
        email: string;
      };
    } | null;
    tasks?: Array<{
      id: string;
      title: string;
      dueAt: string | null;
      done: boolean;
    }>;
  }>;
  _count: {
    leads: number;
  };
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
  description: string;
  count: number;
  criteria: string[];
}

interface EnhancedContactsProps {
  className?: string;
}

export default function EnhancedContacts({ className = '' }: EnhancedContactsProps) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDedupeBanner, setShowDedupeBanner] = useState(true);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set());
  const [activeSegment, setActiveSegment] = useState<string>('all');

  // Fetch real data from tRPC
  const { data: contactsData, isLoading: contactsLoading, refetch: refetchContacts } = trpc.contacts.list.useQuery({
    search: searchQuery || undefined,
    limit: 100
  });

  const { data: selectedContactData } = trpc.contacts.get.useQuery(
    { id: selectedContact?.id || '' },
    { enabled: !!selectedContact?.id }
  );

  const contacts = contactsData || [];

  // Mock data for duplicates and segments (these would come from tRPC in a real implementation)
  const duplicateGroups: DuplicateGroup[] = [
    {
      id: '1',
      contacts: contacts.slice(0, 2),
      confidence: 95,
      reason: 'Same email address'
    }
  ];

  const segments: Segment[] = [
    {
      id: 'new',
      name: 'New last 7d',
      description: 'Contacts added in the last 7 days',
      count: contacts.filter(c => {
        const created = new Date(c.createdAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return created > weekAgo;
      }).length,
      criteria: ['created_at > 7 days ago']
    },
    {
      id: 'with-leads',
      name: 'With Leads',
      description: 'Contacts that have associated leads',
      count: contacts.filter(c => c._count.leads > 0).length,
      criteria: ['has_leads = true']
    },
    {
      id: 'dormant',
      name: 'Dormant 30d',
      description: 'Contacts with no activity in 30 days',
      count: contacts.filter(c => {
        const updated = new Date(c.updatedAt);
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return updated < monthAgo;
      }).length,
      criteria: ['last_activity < 30 days ago']
    }
  ];

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleDuplicateAction = (action: 'accept' | 'review' | 'dismiss', groupId: string) => {
    if (action === 'accept') {
      // This would merge the contacts
      setShowDedupeBanner(false);
    } else if (action === 'review') {
      setSelectedDuplicates(prev => {
        const newSet = new Set(prev);
        newSet.add(groupId);
        return newSet;
      });
    } else {
      // Dismiss the duplicate group
      setShowDedupeBanner(false);
    }
  };

  const handleEnrichment = (contactId: string) => {
    // This would trigger contact enrichment
    console.log('Enriching contact:', contactId);
  };

  const handleExport = () => {
    // This would export contacts
    console.log('Exporting contacts');
  };

  const handleImport = () => {
    // This would import contacts
    console.log('Importing contacts');
  };

  const getLastActivity = (contact: Contact) => {
    const updated = new Date(contact.updatedAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getContactInitials = (contact: Contact) => {
    if (contact.nameEnc) {
      // In a real implementation, this would decrypt the name
      return 'CN'; // Contact Name initials
    }
    if (contact.emailEnc) {
      // In a real implementation, this would decrypt the email
      return 'CE'; // Contact Email initials
    }
    return 'C';
  };

  if (contactsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
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
            Contacts
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your contacts and relationships
          </p>
        </div>

        {/* Dedupe Banner */}
        {showDedupeBanner && duplicateGroups.length > 0 && (
          <div className="mb-6">
            <GlassCard variant="gradient" intensity="medium" className="border-yellow-200 dark:border-yellow-800">
              <GlassCardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        {duplicateGroups.length} possible duplicate{duplicateGroups.length !== 1 ? 's' : ''} found
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
                      onClick={() => handleDuplicateAction('review', duplicateGroups[0].id)}
                    >
                      Review
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDuplicateAction('accept', duplicateGroups[0].id)}
                    >
                      Accept All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateAction('dismiss', duplicateGroups[0].id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                >
                  Cards
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>

          {/* Segments */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Segments:
            </span>
            <Button
              variant={activeSegment === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSegment('all')}
            >
              All ({contacts.length})
            </Button>
            {segments.map((segment) => (
              <Button
                key={segment.id}
                variant={activeSegment === segment.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSegment(segment.id)}
              >
                {segment.name} ({segment.count})
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {viewMode === 'table' ? (
              <GlassCard variant="gradient" intensity="medium">
                <GlassCardHeader>
                  <GlassCardTitle>Contacts</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left p-3 font-medium text-slate-700 dark:text-slate-300">Contact</th>
                          <th className="text-left p-3 font-medium text-slate-700 dark:text-slate-300">Company</th>
                          <th className="text-left p-3 font-medium text-slate-700 dark:text-slate-300">Leads</th>
                          <th className="text-left p-3 font-medium text-slate-700 dark:text-slate-300">Last Activity</th>
                          <th className="text-left p-3 font-medium text-slate-700 dark:text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((contact) => (
                          <tr
                            key={contact.id}
                            className="border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                            onClick={() => handleContactSelect(contact)}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                    {getContactInitials(contact)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-slate-900 dark:text-slate-100">
                                    {contact.nameEnc ? 'Contact Name' : 'Unknown'}
                                  </div>
                                  <div className="text-sm text-slate-600 dark:text-slate-400">
                                    {contact.emailEnc ? 'contact@email.com' : 'No email'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="text-slate-900 dark:text-slate-100">
                                {contact.companyEnc ? 'Company Name' : 'No company'}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {contact._count.leads} leads
                                </Badge>
                                {contact.leads.length > 0 && (
                                  <div className="flex -space-x-1">
                                    {contact.leads.slice(0, 3).map((lead, index) => (
                                      <div
                                        key={lead.id}
                                        className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-xs text-white"
                                        title={lead.title || 'Untitled Lead'}
                                      >
                                        {index + 1}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {getLastActivity(contact)}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCardContent>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contacts.map((contact) => (
                  <GlassCard
                    key={contact.id}
                    variant="gradient"
                    intensity="medium"
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => handleContactSelect(contact)}
                  >
                    <GlassCardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {getContactInitials(contact)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {contact.nameEnc ? 'Contact Name' : 'Unknown'}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                            {contact.emailEnc ? 'contact@email.com' : 'No email'}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                            {contact.companyEnc ? 'Company Name' : 'No company'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {contact._count.leads} leads
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>

          {/* Right Rail */}
          <div className="space-y-6">
            {/* Contact Profile */}
            {selectedContact && (
              <GlassCard variant="gradient" intensity="medium">
                <GlassCardHeader>
                  <GlassCardTitle>Contact Profile</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                          {getContactInitials(selectedContact)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">
                          {selectedContact.nameEnc ? 'Contact Name' : 'Unknown'}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedContact.emailEnc ? 'contact@email.com' : 'No email'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-400">
                          {selectedContact.companyEnc ? 'Company Name' : 'No company'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-400">
                          {selectedContact.emailEnc ? 'contact@email.com' : 'No email'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-400">
                          {selectedContact.phoneEnc ? 'Phone Number' : 'No phone'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Leads ({selectedContact._count.leads})
                        </span>
                        <Button variant="outline" size="sm" className="text-xs">
                          View All
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {selectedContact.leads.slice(0, 3).map((lead) => (
                          <div
                            key={lead.id}
                            className="p-2 bg-white/10 rounded text-xs"
                          >
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {lead.title || 'Untitled Lead'}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {lead.stage && (
                                <Badge variant="outline" className="text-xs">
                                  {lead.stage.name}
                                </Badge>
                              )}
                              <span className="text-slate-600 dark:text-slate-400">
                                {lead.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            )}

            {/* Quick Actions */}
            <GlassCard variant="gradient" intensity="medium">
              <GlassCardHeader>
                <GlassCardTitle>Quick Actions</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Add Contact
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={handleImport}
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    Import CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={handleExport}
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Export Contacts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                  >
                    <Tag className="h-3 w-3 mr-2" />
                    Manage Tags
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Enrichment Suggestions */}
            <GlassCard variant="gradient" intensity="medium">
              <GlassCardHeader>
                <GlassCardTitle>Enrichment</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Phone Found
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Phone number found in email signature
                    </p>
                    <Button variant="outline" size="sm" className="mt-2 w-full text-xs">
                      Add Phone
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Company Found
                      </span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Company info found from email domain
                    </p>
                    <Button variant="outline" size="sm" className="mt-2 w-full text-xs">
                      Add Company
                    </Button>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
