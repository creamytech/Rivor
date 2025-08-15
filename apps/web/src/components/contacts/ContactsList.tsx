"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FlowCard from '@/components/river/FlowCard';
import PillFilter from '@/components/river/PillFilter';
import DataEmpty from '@/components/river/DataEmpty';
import SkeletonFlow from '@/components/river/SkeletonFlow';
import RiverTabs from '@/components/river/RiverTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Users, 
  Grid3X3, 
  List,
  Star,
  Building2,
  Mail,
  Calendar,
  Phone,
  MapPin,
  Clock,
  Activity,
  UserPlus,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Contact {
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

interface ContactsListProps {
  className?: string;
  onContactClick?: (contact: Contact) => void;
}

export default function ContactsList({ className, onContactClick }: ContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filters = [
    { id: 'all', label: 'All Contacts', count: contacts.length },
    { id: 'with-leads', label: 'With Leads', count: contacts.filter(c => c.leadCount > 0).length },
    { id: 'starred', label: 'Starred', count: contacts.filter(c => c.starred).length },
    { id: 'recent', label: 'Recent Activity', count: contacts.filter(c => 
      new Date(c.lastActivity).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length }
  ];

  const viewTabs = [
    { id: 'grid', label: 'Cards', icon: <Grid3X3 className="h-4 w-4" /> },
    { id: 'table', label: 'Table', icon: <List className="h-4 w-4" /> }
  ];

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a real implementation, this would trigger a server search
  };

  const handleStarContact = async (contactId: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/star`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setContacts(prev => prev.map(contact => 
          contact.id === contactId 
            ? { ...contact, starred: !contact.starred }
            : contact
        ));
      }
    } catch (error) {
      console.error('Failed to star contact:', error);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.title?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    // Apply category filter
    switch (currentFilter) {
      case 'with-leads':
        return contact.leadCount > 0;
      case 'starred':
        return contact.starred;
      case 'recent':
        return new Date(contact.lastActivity).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
      default:
        return true;
    }
  });

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-gradient-to-br from-teal-400 to-azure-400',
      'bg-gradient-to-br from-blue-400 to-indigo-400', 
      'bg-gradient-to-br from-purple-400 to-pink-400',
      'bg-gradient-to-br from-green-400 to-emerald-400',
      'bg-gradient-to-br from-orange-400 to-red-400'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <FlowCard className={className}>
        <div className="p-6">
          <SkeletonFlow variant="list" lines={8} />
        </div>
      </FlowCard>
    );
  }

  return (
    <FlowCard className={className}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Contacts
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your contact relationships and track interactions
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <RiverTabs
                tabs={viewTabs}
                value={viewMode}
                onChange={(value) => setViewMode(value as 'grid' | 'table')}
                variant="pills"
              />
              <Button className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Advanced
            </Button>
          </div>

          {/* Filters */}
          <PillFilter
            options={filters}
            value={currentFilter}
            onChange={setCurrentFilter}
          />
        </div>

        {/* Contacts List/Grid */}
        <div className="flex-1 overflow-auto p-6">
          {filteredContacts.length === 0 ? (
            <DataEmpty
              icon={<Users className="h-12 w-12" />}
              title={searchQuery ? 'No contacts found' : 'No contacts yet'}
              description={
                searchQuery 
                  ? `No contacts match "${searchQuery}". Try a different search term.`
                  : 'Contacts will be automatically created from your email interactions.'
              }
              action={!searchQuery ? {
                label: 'Import contacts',
                onClick: () => console.log('Import contacts')
              } : undefined}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {filteredContacts.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700',
                      'hover:shadow-md transition-shadow cursor-pointer'
                    )}
                    onClick={() => onContactClick?.(contact)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {contact.avatarUrl ? (
                          <img 
                            src={contact.avatarUrl} 
                            alt={contact.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm',
                            getAvatarColor(contact.name)
                          )}>
                            {getInitials(contact.name)}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {contact.name}
                          </h3>
                          {contact.title && (
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {contact.title}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStarContact(contact.id);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Star className={cn(
                          'h-4 w-4',
                          contact.starred 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-slate-400'
                        )} />
                      </button>
                    </div>

                    <div className="space-y-2 mb-3">
                      {contact.company && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">{contact.company}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{contact.email}</span>
                      </div>

                      {contact.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <Phone className="h-3 w-3" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Activity className="h-3 w-3" />
                        <span>{formatLastActivity(contact.lastActivity)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {contact.emailCount > 0 && (
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
                            {contact.emailCount} emails
                          </span>
                        )}
                        {contact.leadCount > 0 && (
                          <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full text-xs">
                            {contact.leadCount} leads
                          </span>
                        )}
                      </div>
                    </div>

                    {contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {contact.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {contact.tags.length > 2 && (
                          <span className="text-xs text-slate-500">
                            +{contact.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Company</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Activity</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Engagement</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact, index) => (
                    <motion.tr
                      key={contact.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                      onClick={() => onContactClick?.(contact)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {contact.avatarUrl ? (
                            <img 
                              src={contact.avatarUrl} 
                              alt={contact.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs',
                              getAvatarColor(contact.name)
                            )}>
                              {getInitials(contact.name)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {contact.name}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {contact.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          {contact.company && (
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {contact.company}
                            </div>
                          )}
                          {contact.title && (
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {contact.title}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {formatLastActivity(contact.lastActivity)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {contact.emailCount > 0 && (
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                              {contact.emailCount} emails
                            </span>
                          )}
                          {contact.leadCount > 0 && (
                            <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs">
                              {contact.leadCount} leads
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStarContact(contact.id);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Star className={cn(
                              'h-4 w-4',
                              contact.starred 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-slate-400'
                            )} />
                          </button>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </FlowCard>
  );
}
