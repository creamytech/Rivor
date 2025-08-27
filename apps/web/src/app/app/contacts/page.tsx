"use client";

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import AppShell from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload,
  Phone,
  Mail,
  MapPin,
  Building,
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  CheckCircle,
  CheckSquare,
  Clock,
  Target,
  Tag
} from 'lucide-react';
import CreateContactModal from "@/components/contacts/CreateContactModal";
import { LeadScoreWidget } from "@/components/intelligence/LeadScoreWidget";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  location?: string;
  status: 'lead' | 'prospect' | 'customer';
  lastActivity: string;
  tags: string[];
  avatar?: string;
  value?: number;
}

export default function ContactsPage() {
  const { theme } = useTheme();
  const { isMobile } = useMobileDetection();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedContactForDetails, setSelectedContactForDetails] = useState<Contact | null>(null);
  const [contactRelations, setContactRelations] = useState<any>(null);
  const [loadingRelations, setLoadingRelations] = useState(false);

  // Apply dashboard modal blur effects when any modal is open
  useEffect(() => {
    const isModalOpen = showCreateModal || showDetailsModal;
    
    if (isModalOpen) {
      document.body.classList.add('dashboard-modal-open');
    } else {
      document.body.classList.remove('dashboard-modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('dashboard-modal-open');
    };
  }, [showCreateModal, showDetailsModal]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real contacts from API
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch('/api/contacts');
        if (response.ok) {
          const data = await response.json();
          setContacts(data.contacts || []);
        } else {
          console.error('Failed to fetch contacts');
          setContacts([]);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setContacts([]);
      }
      setLoading(false);
    };
    
    fetchContacts();
    
    // Keep the old mock data as fallback (commented out)
    /*const mockContacts: Contact[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1 (555) 123-4567',
        company: 'Tech Innovations Inc',
        position: 'CEO',
        location: 'San Francisco, CA',
        status: 'lead',
        lastActivity: '2 hours ago',
        tags: ['high-value', 'decision-maker'],
        value: 250000
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'mchen@startup.io',
        phone: '+1 (555) 987-6543',
        company: 'StartupIO',
        position: 'CTO',
        location: 'New York, NY',
        status: 'prospect',
        lastActivity: '1 day ago',
        tags: ['tech', 'qualified'],
        value: 150000
      },
      {
        id: '3',
        name: 'Emma Rodriguez',
        email: 'emma.r@corporate.com',
        phone: '+1 (555) 456-7890',
        company: 'Corporate Solutions',
        position: 'VP Marketing',
        location: 'Austin, TX',
        status: 'customer',
        lastActivity: '3 days ago',
        tags: ['enterprise', 'marketing'],
        value: 500000
      },
      {
        id: '4',
        name: 'David Park',
        email: 'd.park@investments.com',
        phone: '+1 (555) 321-6547',
        company: 'Investment Group',
        position: 'Portfolio Manager',
        location: 'Chicago, IL',
        status: 'lead',
        lastActivity: '1 week ago',
        tags: ['finance', 'high-engagement'],
        value: 800000
      },
      {
        id: '5',
        name: 'Lisa Thompson',
        email: 'lisa.t@agency.com',
        company: 'Creative Agency',
        position: 'Creative Director',
        location: 'Los Angeles, CA',
        status: 'prospect',
        lastActivity: '4 days ago',
        tags: ['creative', 'needs-follow-up'],
        value: 75000
      }
    ];

    */
  }, []);

  const filteredContacts = contacts.filter(contact => {
    if (selectedFilter !== 'all' && contact.status !== selectedFilter) return false;
    if (searchQuery) {
      return contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (contact.company && contact.company.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return true;
  });

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectAllContacts = () => {
    setSelectedContacts(
      selectedContacts.length === filteredContacts.length 
        ? [] 
        : filteredContacts.map(c => c.id)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead': return 'bg-blue-100 text-blue-800';
      case 'prospect': return 'bg-yellow-100 text-yellow-800';
      case 'customer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatValue = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const fetchContactRelations = async (contactId: string, contactEmail: string) => {
    setLoadingRelations(true);
    try {
      const response = await fetch(`/api/integration/contact-relations?contactId=${contactId}&email=${encodeURIComponent(contactEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setContactRelations(data);
      } else {
        console.error('Failed to fetch contact relations');
        setContactRelations(null);
      }
    } catch (error) {
      console.error('Error fetching contact relations:', error);
      setContactRelations(null);
    } finally {
      setLoadingRelations(false);
    }
  };

  const handleViewContactDetails = (contact: Contact) => {
    setSelectedContactForDetails(contact);
    setShowDetailsModal(true);
    // Fetch related data
    fetchContactRelations(contact.id, contact.email);
  };

  const createTaskForContact = async (contact: Contact) => {
    try {
      const response = await fetch('/api/integration/task-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Follow up with ${contact.name}`,
          description: `Follow up with ${contact.name} from ${contact.company || 'Unknown Company'}`,
          priority: 'medium',
          linkedContactId: contact.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Task created successfully: ${result.task.title}`);
      } else {
        alert('Failed to create task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    }
  };

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        {/* Header */}
        <div className="px-4 mt-4 mb-2 main-content-area">
          <div className={`glass-card ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex items-center justify-between'} mb-6`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl glass-card">
                  <Users className="h-6 w-6" style={{ color: 'var(--glass-primary)' }} />
                </div>
                <div>
                  <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: 'var(--glass-text)' }}>
                    Contacts
                  </h1>
                  <p style={{ color: 'var(--glass-text-secondary)' }}>
                    {filteredContacts.length} contacts • {selectedContacts.length} selected
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              variant="liquid"
              size={isMobile ? "default" : "lg"}
              className={`${isMobile ? 'w-full' : 'px-6'}`}
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Contact
            </Button>
          </div>

          {/* Search and Filters */}
          <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex items-center gap-4'} mb-6`}>
            <div className={`${isMobile ? 'w-full' : 'flex-1 max-w-2xl'} relative`}>
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5" 
                style={{ color: 'var(--glass-text-muted)' }} />
              <Input
                variant="pill"
                placeholder={isMobile ? "Search contacts..." : "Search contacts, companies, or emails..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-4 py-3 text-sm"
              />
            </div>
            
            <div className={`${isMobile ? 'flex flex-col gap-2 w-full' : 'flex items-center gap-2'}`}>
              {isMobile ? (
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="liquid" size="sm" className="flex-1">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSelectedFilter('all')}>
                        All Contacts
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFilter('lead')}>
                        Leads
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFilter('prospect')}>
                        Prospects
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFilter('customer')}>
                        Customers
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button variant="liquid" size="sm" className="flex-1" onClick={() => alert('Export functionality coming soon!')}>
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="liquid" size="sm" className="flex-1" onClick={() => alert('Import functionality coming soon!')}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="liquid" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSelectedFilter('all')}>
                        All Contacts
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFilter('lead')}>
                        Leads
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFilter('prospect')}>
                        Prospects
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFilter('customer')}>
                        Customers
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button variant="liquid" size="sm" onClick={() => alert('Export functionality coming soon!')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  
                  <Button variant="liquid" size="sm" onClick={() => alert('Import functionality coming soon!')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className={`${isMobile ? 'overflow-x-auto scrollbar-hide' : ''} flex items-center gap-2`}>
            {[
              { key: 'all', label: 'All Contacts', count: contacts.length },
              { key: 'lead', label: 'Leads', count: contacts.filter(c => c.status === 'lead').length },
              { key: 'prospect', label: 'Prospects', count: contacts.filter(c => c.status === 'prospect').length },
              { key: 'customer', label: 'Customers', count: contacts.filter(c => c.status === 'customer').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedFilter(tab.key)}
                className={`${isMobile ? 'flex-shrink-0' : ''} px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedFilter === tab.key
                    ? "glass-badge"
                    : "glass-badge-muted"
                }`}
              >
                {isMobile ? tab.label.split(' ')[0] : tab.label}
                <Badge variant="liquid" className="ml-2 text-xs">
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 pb-4 main-content-area">
          <div className="glass-card">
            {/* Bulk Actions Bar */}
            {selectedContacts.length > 0 && (
              <div className={`${isMobile ? 'px-4' : 'px-6'} py-4 border-b`} style={{ borderColor: 'var(--glass-border)' }}>
                <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex items-center justify-between'}`}>
                  <span className="text-sm" style={{ color: 'var(--glass-text-secondary)' }}>
                    {selectedContacts.length} contacts selected
                  </span>
                  <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex items-center gap-2'}`}>
                    <Button variant="liquid" size="sm" className={isMobile ? 'w-full' : ''} onClick={() => router.push('/app/inbox')}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                    <Button variant="liquid" size="sm" className={isMobile ? 'w-full' : ''} onClick={() => alert('Tag functionality coming soon!')}>
                      <Tag className="h-4 w-4 mr-2" />
                      Add Tags
                    </Button>
                    <Button variant="liquid" size="sm" className={isMobile ? 'w-full' : ''} onClick={() => {
                      // Create tasks for all selected contacts
                      Promise.all(selectedContacts.map(contactId => {
                        const contact = contacts.find(c => c.id === contactId);
                        return contact ? createTaskForContact(contact) : null;
                      })).then(() => {
                        alert(`Created tasks for ${selectedContacts.length} contacts`);
                        setSelectedContacts([]);
                      });
                    }}>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Create Tasks
                    </Button>
                    <Button variant="liquid" size="sm" className={isMobile ? 'w-full' : ''} onClick={() => setSelectedContacts([])}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Table Header */}
            {!isMobile && (
              <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === filteredContacts.length}
                    onChange={selectAllContacts}
                    className="mr-4 rounded"
                  />
                  <div className="grid grid-cols-12 gap-4 w-full text-sm font-medium" 
                       style={{ color: 'var(--glass-text-secondary)' }}>
                    <div className="col-span-3">Contact</div>
                    <div className="col-span-2">Company</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Last Activity</div>
                    <div className="col-span-2">Value</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact List */}
            <div className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
              {loading ? (
                <div className="px-6 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" 
                       style={{ borderColor: 'var(--glass-primary)' }}></div>
                  <p style={{ color: 'var(--glass-text-muted)' }}>Loading contacts...</p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--glass-text-muted)' }} />
                  <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--glass-text)' }}>
                    No contacts found
                  </h3>
                  <p style={{ color: 'var(--glass-text-muted)' }}>
                    {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first contact'}
                  </p>
                  {!searchQuery && (
                    <Button 
                      variant="liquid" 
                      className="mt-4"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  )}
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  isMobile ? (
                    // Mobile Card Layout
                    <div 
                      key={contact.id} 
                      className="p-4 hover:bg-[var(--glass-surface-hover)] transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => handleSelectContact(contact.id)}
                          className="mt-1 rounded"
                        />
                        
                        <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {getInitials(contact.name)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate" style={{ color: 'var(--glass-text)' }}>
                                {contact.name}
                              </p>
                              <p className="text-sm truncate" style={{ color: 'var(--glass-text-muted)' }}>
                                {contact.email}
                              </p>
                              {contact.phone && (
                                <p className="text-xs truncate" style={{ color: 'var(--glass-text-muted)' }}>
                                  {contact.phone}
                                </p>
                              )}
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="liquid" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewContactDetails(contact)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowCreateModal(true)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Contact
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/app/inbox')}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/app/calendar')}>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Schedule Meeting
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => handleSelectContact(contact.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Contact
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={`${getStatusColor(contact.status)} border-0 text-xs`}>
                                {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                              </Badge>
                              {contact.company && (
                                <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                                  {contact.company}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-1">
                                {contact.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="liquid" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {contact.tags.length > 2 && (
                                  <Badge variant="liquid" className="text-xs">
                                    +{contact.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <p className="text-xs font-medium" style={{ color: 'var(--glass-text)' }}>
                                  {formatValue(contact.value)}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                                  {contact.lastActivity}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Desktop Table Layout
                    <div 
                      key={contact.id} 
                      className="px-6 py-4 hover:bg-[var(--glass-surface-hover)] transition-colors"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => handleSelectContact(contact.id)}
                          className="mr-4 rounded"
                        />
                        
                        <div className="grid grid-cols-12 gap-4 w-full items-center">
                          {/* Contact Info */}
                          <div className="col-span-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-sm font-medium">
                              {getInitials(contact.name)}
                            </div>
                            <div>
                              <p className="font-medium" style={{ color: 'var(--glass-text)' }}>
                                {contact.name}
                              </p>
                              <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                                {contact.email}
                              </p>
                              {contact.phone && (
                                <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                                  {contact.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Company */}
                          <div className="col-span-2">
                            <p className="font-medium" style={{ color: 'var(--glass-text)' }}>
                              {contact.company || '-'}
                            </p>
                            {contact.position && (
                              <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                                {contact.position}
                              </p>
                            )}
                          </div>
                          
                          {/* Status */}
                          <div className="col-span-2">
                            <Badge className={`${getStatusColor(contact.status)} border-0`}>
                              {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                            </Badge>
                            <div className="flex items-center gap-1 mt-1">
                              {contact.tags.map((tag) => (
                                <Badge key={tag} variant="liquid" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {/* Last Activity */}
                          <div className="col-span-2">
                            <p className="text-sm" style={{ color: 'var(--glass-text)' }}>
                              {contact.lastActivity}
                            </p>
                          </div>
                          
                          {/* Value */}
                          <div className="col-span-2">
                            <p className="font-medium" style={{ color: 'var(--glass-text)' }}>
                              {formatValue(contact.value)}
                            </p>
                          </div>
                          
                          {/* Actions */}
                          <div className="col-span-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="liquid" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewContactDetails(contact)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowCreateModal(true)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Contact
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/app/inbox')}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/app/calendar')}>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Schedule Meeting
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => handleSelectContact(contact.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Contact
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ))
              )}
            </div>
          </div>
        </div>

        {/* Contact Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl glass-modal">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3" style={{ color: 'var(--glass-text)' }}>
                <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center font-medium text-lg">
                  {selectedContactForDetails?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{selectedContactForDetails?.name}</h2>
                  <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                    {selectedContactForDetails?.position && selectedContactForDetails?.company 
                      ? `${selectedContactForDetails.position} at ${selectedContactForDetails.company}`
                      : selectedContactForDetails?.company || 'Contact Details'
                    }
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedContactForDetails && (
              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--glass-text)' }}>Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="h-5 w-5" style={{ color: 'var(--glass-primary)' }} />
                        <span className="font-medium" style={{ color: 'var(--glass-text)' }}>Email</span>
                      </div>
                      <p style={{ color: 'var(--glass-text-secondary)' }}>{selectedContactForDetails.email}</p>
                    </div>

                    {selectedContactForDetails.phone && (
                      <div className="glass-card p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Phone className="h-5 w-5" style={{ color: 'var(--glass-primary)' }} />
                          <span className="font-medium" style={{ color: 'var(--glass-text)' }}>Phone</span>
                        </div>
                        <p style={{ color: 'var(--glass-text-secondary)' }}>{selectedContactForDetails.phone}</p>
                      </div>
                    )}

                    {selectedContactForDetails.location && (
                      <div className="glass-card p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <MapPin className="h-5 w-5" style={{ color: 'var(--glass-primary)' }} />
                          <span className="font-medium" style={{ color: 'var(--glass-text)' }}>Location</span>
                        </div>
                        <p style={{ color: 'var(--glass-text-secondary)' }}>{selectedContactForDetails.location}</p>
                      </div>
                    )}

                    {selectedContactForDetails.company && (
                      <div className="glass-card p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Building className="h-5 w-5" style={{ color: 'var(--glass-primary)' }} />
                          <span className="font-medium" style={{ color: 'var(--glass-text)' }}>Company</span>
                        </div>
                        <p style={{ color: 'var(--glass-text-secondary)' }}>
                          {selectedContactForDetails.company}
                          {selectedContactForDetails.position && (
                            <span className="block text-sm opacity-70">{selectedContactForDetails.position}</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Status & Tags */}
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--glass-text)' }}>Status & Tags</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={`${
                      selectedContactForDetails.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedContactForDetails.status === 'lead' ? 'bg-blue-100 text-blue-800' :
                      selectedContactForDetails.status === 'prospect' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    } border-0`}>
                      {selectedContactForDetails.status.charAt(0).toUpperCase() + selectedContactForDetails.status.slice(1)}
                    </Badge>
                    {selectedContactForDetails.tags?.map((tag) => (
                      <Badge key={tag} variant="liquid" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Lead Intelligence */}
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--glass-text)' }}>Lead Intelligence</h3>
                  <LeadScoreWidget 
                    contactId={selectedContactForDetails.id}
                    autoRefresh={true}
                    className="mb-4"
                  />
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--glass-text)' }}>Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button 
                      variant="liquid" 
                      className="justify-start" 
                      onClick={() => window.open(`mailto:${selectedContactForDetails.email}`)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <Button 
                      variant="liquid" 
                      className="justify-start" 
                      onClick={() => window.open(`tel:${selectedContactForDetails.phone}`)}
                      disabled={!selectedContactForDetails.phone}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button 
                      variant="liquid" 
                      className="justify-start" 
                      onClick={() => {
                        setShowDetailsModal(false);
                        router.push('/app/calendar');
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                    <Button 
                      variant="liquid" 
                      className="justify-start" 
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowCreateModal(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>

                {/* Related Tasks */}
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--glass-text)' }}>
                    Related Tasks 
                    {contactRelations?.tasks && (
                      <Badge variant="outline" className="ml-2">
                        {contactRelations.tasks.length}
                      </Badge>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {loadingRelations ? (
                      <div className="glass-card p-4">
                        <div className="animate-pulse flex space-x-4">
                          <div className="rounded-full bg-slate-200 h-4 w-4"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    ) : contactRelations?.tasks?.length > 0 ? (
                      contactRelations.tasks.map((task: any) => (
                        <div key={task.id} className="glass-card p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{task.title}</p>
                              <p className="text-xs text-gray-500">
                                {task.status} • {task.priority} priority
                                {task.dueAt && ` • Due ${new Date(task.dueAt).toLocaleDateString()}`}
                              </p>
                            </div>
                            <Badge className={
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="glass-card p-4">
                        <div className="flex items-center justify-between">
                          <p style={{ color: 'var(--glass-text-muted)' }} className="text-sm">
                            No related tasks found
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => selectedContactForDetails && createTaskForContact(selectedContactForDetails)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Create Task
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Related Email Threads */}
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--glass-text)' }}>
                    Email Threads 
                    {contactRelations?.emailThreads && (
                      <Badge variant="outline" className="ml-2">
                        {contactRelations.emailThreads.length}
                      </Badge>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {loadingRelations ? (
                      <div className="glass-card p-4">
                        <div className="animate-pulse flex space-x-4">
                          <div className="rounded-full bg-slate-200 h-4 w-4"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    ) : contactRelations?.emailThreads?.length > 0 ? (
                      contactRelations.emailThreads.map((thread: any) => (
                        <div key={thread.id} className="glass-card p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{thread.subject}</p>
                              <p className="text-xs text-gray-500">
                                {thread.messageCount} messages • {new Date(thread.updatedAt).toLocaleDateString()}
                                {thread.category && (
                                  <span className="ml-2">
                                    <Badge variant="outline" className="text-xs">
                                      {thread.category.replace('_', ' ')}
                                    </Badge>
                                  </span>
                                )}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push(`/app/inbox?thread=${thread.id}`)}
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="glass-card p-4">
                        <p style={{ color: 'var(--glass-text-muted)' }} className="text-sm">
                          No email correspondence found
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Related Calendar Events */}
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--glass-text)' }}>
                    Calendar Events 
                    {contactRelations?.calendarEvents && (
                      <Badge variant="outline" className="ml-2">
                        {contactRelations.calendarEvents.length}
                      </Badge>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {loadingRelations ? (
                      <div className="glass-card p-4">
                        <div className="animate-pulse flex space-x-4">
                          <div className="rounded-full bg-slate-200 h-4 w-4"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    ) : contactRelations?.calendarEvents?.length > 0 ? (
                      contactRelations.calendarEvents.map((event: any) => (
                        <div key={event.id} className="glass-card p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{event.title}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push('/app/calendar')}
                            >
                              <Calendar className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="glass-card p-4">
                        <div className="flex items-center justify-between">
                          <p style={{ color: 'var(--glass-text-muted)' }} className="text-sm">
                            No calendar events found
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push('/app/calendar')}
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Schedule Meeting
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Contact Modal */}
        <CreateContactModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onContactCreated={(contact) => {
            setContacts(prev => [...prev, contact]);
          }}
        />

      </AppShell>
    </div>
  );
}