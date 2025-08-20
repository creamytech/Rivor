"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Home,
  Star,
  Plus,
  Edit,
  Tag,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Eye,
  MessageSquare
} from 'lucide-react';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  type: 'buyer' | 'seller' | 'agent' | 'vendor' | 'investor';
  leadScore: number;
  stage: 'prospect' | 'qualified' | 'active' | 'under_contract' | 'closed' | 'inactive';
  tags: string[];
  properties: {
    interested?: string[];
    owned?: string[];
    sold?: string[];
  };
  preferences: {
    budget?: { min: number; max: number };
    location?: string[];
    propertyType?: string[];
    features?: string[];
  };
  interactions: {
    lastContact: Date;
    emailCount: number;
    callCount: number;
    showingCount: number;
    responseRate: number;
  };
  notes: string[];
  source: 'email' | 'website' | 'referral' | 'social' | 'import';
  createdAt: Date;
  updatedAt: Date;
}

interface ContactManagerProps {
  emailAddress?: string;
  autoCreate?: boolean;
  onContactSelect?: (contact: Contact) => void;
}

// Mock contact data generator
const generateMockContacts = (): Contact[] => {
  const names = [
    'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Wilson', 
    'Jessica Thompson', 'Robert Lee', 'Amanda Davis', 'Christopher Brown'
  ];
  
  const types: Contact['type'][] = ['buyer', 'seller', 'agent', 'investor'];
  const stages: Contact['stage'][] = ['prospect', 'qualified', 'active', 'under_contract', 'closed'];
  const locations = ['Downtown', 'Westside', 'North Hills', 'Marina District', 'Suburbs'];
  const propertyTypes = ['Condo', 'Single Family', 'Townhouse', 'Investment Property'];

  return names.map((name, index) => ({
    id: `contact-${index + 1}`,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
    phone: `(555) ${String(index + 100).padStart(3, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    type: types[index % types.length],
    leadScore: Math.floor(Math.random() * 100),
    stage: stages[index % stages.length],
    tags: [
      index % 3 === 0 ? 'First Time Buyer' : '',
      index % 4 === 0 ? 'Investment Ready' : '',
      index % 5 === 0 ? 'Relocation' : ''
    ].filter(Boolean),
    properties: {
      interested: index % 2 === 0 ? [`Property ${index + 1}`, `Property ${index + 5}`] : [],
      owned: index % 3 === 0 ? [`Current Home ${index}`] : [],
    },
    preferences: {
      budget: { min: 200000 + (index * 50000), max: 500000 + (index * 100000) },
      location: [locations[index % locations.length]],
      propertyType: [propertyTypes[index % propertyTypes.length]],
      features: ['Garage', 'Pool', 'Garden'].slice(0, (index % 3) + 1)
    },
    interactions: {
      lastContact: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)),
      emailCount: Math.floor(Math.random() * 20) + 1,
      callCount: Math.floor(Math.random() * 5),
      showingCount: Math.floor(Math.random() * 3),
      responseRate: Math.random() * 100
    },
    notes: [
      `Initial contact made via email`,
      index % 2 === 0 ? 'Showed interest in downtown properties' : 'Prefers suburban locations',
      index % 3 === 0 ? 'Pre-approved for financing' : ''
    ].filter(Boolean),
    source: ['email', 'website', 'referral'][index % 3] as Contact['source'],
    createdAt: new Date(Date.now() - (index * 7 * 24 * 60 * 60 * 1000)),
    updatedAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000))
  }));
};

export default function ContactManager({ emailAddress, autoCreate, onContactSelect }: ContactManagerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | Contact['type']>('all');
  const [filterStage, setFilterStage] = useState<'all' | Contact['stage']>('all');

  useEffect(() => {
    setContacts(generateMockContacts());
  }, []);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || contact.type === filterType;
    const matchesStage = filterStage === 'all' || contact.stage === filterStage;
    
    return matchesSearch && matchesType && matchesStage;
  });

  const getTypeColor = (type: Contact['type']) => {
    const colors = {
      buyer: 'bg-blue-100 text-blue-800',
      seller: 'bg-green-100 text-green-800',
      agent: 'bg-purple-100 text-purple-800',
      vendor: 'bg-orange-100 text-orange-800',
      investor: 'bg-red-100 text-red-800'
    };
    return colors[type];
  };

  const getStageColor = (stage: Contact['stage']) => {
    const colors = {
      prospect: 'bg-gray-100 text-gray-800',
      qualified: 'bg-blue-100 text-blue-800',
      active: 'bg-yellow-100 text-yellow-800',
      under_contract: 'bg-orange-100 text-orange-800',
      closed: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800'
    };
    return colors[stage];
  };

  const createContactFromEmail = (email: string) => {
    // Extract name from email (basic implementation)
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      name,
      email,
      type: 'buyer', // Default assumption
      leadScore: 50, // Default score
      stage: 'prospect',
      tags: ['Email Import'],
      properties: {},
      preferences: {},
      interactions: {
        lastContact: new Date(),
        emailCount: 1,
        callCount: 0,
        showingCount: 0,
        responseRate: 0
      },
      notes: ['Auto-created from email interaction'],
      source: 'email',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setContacts(prev => [newContact, ...prev]);
    return newContact;
  };

  useEffect(() => {
    if (emailAddress && autoCreate) {
      const existingContact = contacts.find(c => c.email === emailAddress);
      if (!existingContact) {
        const newContact = createContactFromEmail(emailAddress);
        setSelectedContact(newContact);
      }
    }
  }, [emailAddress, autoCreate, contacts]);

  return (
    <div className="space-y-4">
      {/* Contact Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Active Buyers</p>
                <p className="text-2xl font-bold text-blue-800">
                  {contacts.filter(c => c.type === 'buyer' && c.stage === 'active').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Active Sellers</p>
                <p className="text-2xl font-bold text-green-800">
                  {contacts.filter(c => c.type === 'seller' && c.stage === 'active').length}
                </p>
              </div>
              <Home className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Under Contract</p>
                <p className="text-2xl font-bold text-orange-800">
                  {contacts.filter(c => c.stage === 'under_contract').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">High Score Leads</p>
                <p className="text-2xl font-bold text-purple-800">
                  {contacts.filter(c => c.leadScore > 80).length}
                </p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md text-sm"
        />
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | Contact['type'])}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="all">All Types</option>
          <option value="buyer">Buyers</option>
          <option value="seller">Sellers</option>
          <option value="agent">Agents</option>
          <option value="investor">Investors</option>
        </select>

        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value as 'all' | Contact['stage'])}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="all">All Stages</option>
          <option value="prospect">Prospects</option>
          <option value="qualified">Qualified</option>
          <option value="active">Active</option>
          <option value="under_contract">Under Contract</option>
          <option value="closed">Closed</option>
        </select>

        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Contact List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredContacts.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedContact(contact)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-medium">{contact.name}</h3>
                        <p className="text-sm text-gray-600">{contact.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTypeColor(contact.type)}>{contact.type}</Badge>
                          <Badge className={getStageColor(contact.stage)}>{contact.stage}</Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-gray-600">{contact.leadScore}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.interactions.emailCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.interactions.callCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {contact.interactions.showingCount}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Last contact: {contact.interactions.lastContact.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Contact Detail Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedContact && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedContact.avatar} />
                    <AvatarFallback className="text-lg">
                      {selectedContact.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">{selectedContact.name}</DialogTitle>
                    <DialogDescription>{selectedContact.email}</DialogDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getTypeColor(selectedContact.type)}>{selectedContact.type}</Badge>
                      <Badge className={getStageColor(selectedContact.stage)}>{selectedContact.stage}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{selectedContact.leadScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Contact Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedContact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedContact.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedContact.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Created {selectedContact.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Interaction Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Emails:</span>
                      <span className="text-sm font-medium">{selectedContact.interactions.emailCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Calls:</span>
                      <span className="text-sm font-medium">{selectedContact.interactions.callCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Showings:</span>
                      <span className="text-sm font-medium">{selectedContact.interactions.showingCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Response Rate:</span>
                      <span className="text-sm font-medium">{selectedContact.interactions.responseRate.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preferences */}
              {selectedContact.preferences.budget && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Budget: ${selectedContact.preferences.budget.min.toLocaleString()} - 
                        ${selectedContact.preferences.budget.max.toLocaleString()}
                      </span>
                    </div>
                    {selectedContact.preferences.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedContact.preferences.location.join(', ')}</span>
                      </div>
                    )}
                    {selectedContact.preferences.propertyType && (
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedContact.preferences.propertyType.join(', ')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {selectedContact.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedContact.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedContact.notes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <div className="space-y-2">
                    {selectedContact.notes.map((note, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}