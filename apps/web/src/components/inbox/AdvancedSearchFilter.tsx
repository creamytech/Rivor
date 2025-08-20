"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Building2,
  DollarSign,
  MapPin,
  Tag,
  Star,
  Clock,
  Mail,
  Phone,
  Eye,
  Save,
  Download,
  RefreshCw,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

export interface SearchFilter {
  id: string;
  name: string;
  query: string;
  filters: {
    // Email properties
    sender?: string[];
    subject?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    hasAttachments?: boolean;
    priority?: 'high' | 'normal' | 'low';
    status?: 'read' | 'unread' | 'archived';
    
    // Real estate specific
    emailType?: ('buyer_inquiry' | 'seller_lead' | 'showing_request' | 'property_inquiry' | 'market_question')[];
    propertyTypes?: string[];
    priceRange?: {
      min: number;
      max: number;
    };
    locations?: string[];
    leadScore?: {
      min: number;
      max: number;
    };
    clientType?: ('buyer' | 'seller' | 'investor' | 'renter')[];
    agentAssigned?: string[];
    
    // Interaction filters
    responseRequired?: boolean;
    followUpOverdue?: boolean;
    newContact?: boolean;
    hotLead?: boolean;
  };
  createdAt: Date;
  lastUsed?: Date;
  isDefault?: boolean;
}

interface AdvancedSearchFilterProps {
  onFilterApply?: (filter: SearchFilter) => void;
  onFilterSave?: (filter: SearchFilter) => void;
  savedFilters?: SearchFilter[];
  currentFilter?: SearchFilter;
}

// Mock data for filters
const PROPERTY_TYPES = [
  'Single Family Home', 'Condo', 'Townhouse', 'Multi-Family', 'Land', 'Commercial'
];

const LOCATIONS = [
  'Downtown', 'Westside', 'North Hills', 'Marina District', 'Suburbs', 'Hillcrest', 'Oceanview'
];

const AGENTS = [
  'John Smith', 'Mary Johnson', 'Tom Wilson', 'Lisa Davis', 'Mike Brown', 'Sarah Chen'
];

const EMAIL_TYPES = [
  { value: 'buyer_inquiry', label: 'Buyer Inquiry', color: 'bg-blue-100 text-blue-800' },
  { value: 'seller_lead', label: 'Seller Lead', color: 'bg-green-100 text-green-800' },
  { value: 'showing_request', label: 'Showing Request', color: 'bg-purple-100 text-purple-800' },
  { value: 'property_inquiry', label: 'Property Inquiry', color: 'bg-orange-100 text-orange-800' },
  { value: 'market_question', label: 'Market Question', color: 'bg-yellow-100 text-yellow-800' }
];

// Generate mock saved filters
const generateMockSavedFilters = (): SearchFilter[] => {
  return [
    {
      id: 'filter-1',
      name: 'High Priority Buyer Leads',
      query: 'buyer ready to purchase',
      filters: {
        emailType: ['buyer_inquiry'],
        clientType: ['buyer'],
        leadScore: { min: 80, max: 100 },
        priority: 'high',
        responseRequired: true
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isDefault: false
    },
    {
      id: 'filter-2',
      name: 'Downtown Properties',
      query: 'downtown condo',
      filters: {
        propertyTypes: ['Condo'],
        locations: ['Downtown'],
        priceRange: { min: 300000, max: 800000 }
      },
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isDefault: false
    },
    {
      id: 'filter-3',
      name: 'Follow-up Required',
      query: '',
      filters: {
        responseRequired: true,
        followUpOverdue: true,
        status: 'unread'
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 12 * 60 * 60 * 1000),
      isDefault: true
    },
    {
      id: 'filter-4',
      name: 'New Seller Leads',
      query: 'selling home',
      filters: {
        emailType: ['seller_lead'],
        clientType: ['seller'],
        newContact: true,
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      },
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 6 * 60 * 60 * 1000),
      isDefault: false
    }
  ];
};

export default function AdvancedSearchFilter({ onFilterApply, onFilterSave, savedFilters, currentFilter }: AdvancedSearchFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilter[]>(savedFilters || generateMockSavedFilters());
  const [activeFilter, setActiveFilter] = useState<SearchFilter>(currentFilter || {
    id: 'new',
    name: '',
    query: '',
    filters: {},
    createdAt: new Date()
  });
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const updateFilter = (path: string, value: any) => {
    setActiveFilter(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current: any = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      if (value === undefined || value === null) {
        delete current[keys[keys.length - 1]];
      } else {
        current[keys[keys.length - 1]] = value;
      }
      
      return updated;
    });
  };

  const clearFilter = () => {
    setActiveFilter({
      id: 'new',
      name: '',
      query: '',
      filters: {},
      createdAt: new Date()
    });
  };

  const applyFilter = () => {
    onFilterApply?.(activeFilter);
    setIsOpen(false);
  };

  const saveFilter = () => {
    if (!saveFilterName.trim()) return;

    const savedFilter: SearchFilter = {
      ...activeFilter,
      id: `filter-${Date.now()}`,
      name: saveFilterName,
      createdAt: new Date(),
      lastUsed: new Date()
    };

    setFilters(prev => [savedFilter, ...prev]);
    onFilterSave?.(savedFilter);
    setShowSaveDialog(false);
    setSaveFilterName('');
  };

  const loadSavedFilter = (filter: SearchFilter) => {
    setActiveFilter({
      ...filter,
      lastUsed: new Date()
    });
    setFilters(prev => prev.map(f => 
      f.id === filter.id ? { ...f, lastUsed: new Date() } : f
    ));
  };

  const getActiveFilterCount = () => {
    const filterObj = activeFilter.filters;
    let count = 0;
    
    if (activeFilter.query) count++;
    if (filterObj.sender?.length) count++;
    if (filterObj.subject) count++;
    if (filterObj.dateRange) count++;
    if (filterObj.emailType?.length) count++;
    if (filterObj.propertyTypes?.length) count++;
    if (filterObj.priceRange) count++;
    if (filterObj.locations?.length) count++;
    if (filterObj.leadScore) count++;
    if (filterObj.clientType?.length) count++;
    if (filterObj.agentAssigned?.length) count++;
    if (filterObj.responseRequired) count++;
    if (filterObj.followUpOverdue) count++;
    if (filterObj.newContact) count++;
    if (filterObj.hotLead) count++;
    if (filterObj.hasAttachments) count++;
    if (filterObj.priority && filterObj.priority !== 'normal') count++;
    if (filterObj.status && filterObj.status !== 'read') count++;
    
    return count;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Advanced Search
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-1">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search & Filters
          </DialogTitle>
          <DialogDescription>
            Create powerful searches for real estate emails and contacts
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6">
          {/* Saved Filters Sidebar */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">Saved Filters</h3>
              <div className="space-y-2">
                {filters.map(filter => (
                  <Card 
                    key={filter.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      activeFilter.id === filter.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => loadSavedFilter(filter)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{filter.name}</h4>
                      {filter.isDefault && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{filter.query || 'No search query'}</p>
                    {filter.lastUsed && (
                      <p className="text-xs text-gray-500 mt-1">
                        Used {filter.lastUsed.toLocaleDateString()}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowSaveDialog(true)}
                disabled={!activeFilter.query && getActiveFilterCount() === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Current Filter
              </Button>
              <Button variant="outline" className="w-full" onClick={clearFilter}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Filter Configuration */}
          <div className="col-span-2 space-y-4">
            {/* Basic Search */}
            <Collapsible 
              open={expandedSections.includes('basic')} 
              onOpenChange={() => toggleSection('basic')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span className="font-medium">Basic Search</span>
                  </div>
                  {expandedSections.includes('basic') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-3 space-y-3">
                <div>
                  <label className="text-sm font-medium">Search Query</label>
                  <Input
                    value={activeFilter.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    placeholder="Search emails, contacts, content..."
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">From</label>
                    <Input
                      value={activeFilter.filters.sender?.join(', ') || ''}
                      onChange={(e) => updateFilter('filters.sender', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="email@domain.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject Contains</label>
                    <Input
                      value={activeFilter.filters.subject || ''}
                      onChange={(e) => updateFilter('filters.subject', e.target.value)}
                      placeholder="Subject keywords"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select 
                      value={activeFilter.filters.status || ''} 
                      onValueChange={(value) => updateFilter('filters.status', value || undefined)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Any status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any status</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="unread">Unread</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select 
                      value={activeFilter.filters.priority || ''} 
                      onValueChange={(value) => updateFilter('filters.priority', value || undefined)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Any priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any priority</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center mt-6">
                    <Checkbox
                      id="hasAttachments"
                      checked={activeFilter.filters.hasAttachments || false}
                      onCheckedChange={(checked) => updateFilter('filters.hasAttachments', checked || undefined)}
                    />
                    <label htmlFor="hasAttachments" className="ml-2 text-sm">
                      Has attachments
                    </label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Real Estate Filters */}
            <Collapsible 
              open={expandedSections.includes('realestate')} 
              onOpenChange={() => toggleSection('realestate')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">Real Estate Filters</span>
                  </div>
                  {expandedSections.includes('realestate') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-3 space-y-3">
                <div>
                  <label className="text-sm font-medium">Email Type</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {EMAIL_TYPES.map(type => (
                      <Button
                        key={type.value}
                        variant={activeFilter.filters.emailType?.includes(type.value as any) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const current = activeFilter.filters.emailType || [];
                          const updated = current.includes(type.value as any)
                            ? current.filter(t => t !== type.value)
                            : [...current, type.value as any];
                          updateFilter('filters.emailType', updated.length ? updated : undefined);
                        }}
                        className="text-xs"
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Property Type</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {PROPERTY_TYPES.map(type => (
                      <Button
                        key={type}
                        variant={activeFilter.filters.propertyTypes?.includes(type) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const current = activeFilter.filters.propertyTypes || [];
                          const updated = current.includes(type)
                            ? current.filter(t => t !== type)
                            : [...current, type];
                          updateFilter('filters.propertyTypes', updated.length ? updated : undefined);
                        }}
                        className="text-xs"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Location</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {LOCATIONS.map(location => (
                      <Button
                        key={location}
                        variant={activeFilter.filters.locations?.includes(location) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const current = activeFilter.filters.locations || [];
                          const updated = current.includes(location)
                            ? current.filter(l => l !== location)
                            : [...current, location];
                          updateFilter('filters.locations', updated.length ? updated : undefined);
                        }}
                        className="text-xs"
                      >
                        {location}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Price Range</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder="Min price"
                        value={activeFilter.filters.priceRange?.min || ''}
                        onChange={(e) => updateFilter('filters.priceRange.min', e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                      <Input
                        type="number"
                        placeholder="Max price"
                        value={activeFilter.filters.priceRange?.max || ''}
                        onChange={(e) => updateFilter('filters.priceRange.max', e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Lead Score Range</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder="Min score"
                        min="0"
                        max="100"
                        value={activeFilter.filters.leadScore?.min || ''}
                        onChange={(e) => updateFilter('filters.leadScore.min', e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                      <Input
                        type="number"
                        placeholder="Max score"
                        min="0"
                        max="100"
                        value={activeFilter.filters.leadScore?.max || ''}
                        onChange={(e) => updateFilter('filters.leadScore.max', e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Client Type</label>
                  <div className="mt-1 flex gap-2">
                    {['buyer', 'seller', 'investor', 'renter'].map(type => (
                      <Button
                        key={type}
                        variant={activeFilter.filters.clientType?.includes(type as any) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const current = activeFilter.filters.clientType || [];
                          const updated = current.includes(type as any)
                            ? current.filter(t => t !== type)
                            : [...current, type as any];
                          updateFilter('filters.clientType', updated.length ? updated : undefined);
                        }}
                        className="text-xs capitalize"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Smart Filters */}
            <Collapsible 
              open={expandedSections.includes('smart')} 
              onOpenChange={() => toggleSection('smart')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">Smart Filters</span>
                  </div>
                  {expandedSections.includes('smart') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="responseRequired"
                      checked={activeFilter.filters.responseRequired || false}
                      onCheckedChange={(checked) => updateFilter('filters.responseRequired', checked || undefined)}
                    />
                    <label htmlFor="responseRequired" className="text-sm">
                      Response required
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="followUpOverdue"
                      checked={activeFilter.filters.followUpOverdue || false}
                      onCheckedChange={(checked) => updateFilter('filters.followUpOverdue', checked || undefined)}
                    />
                    <label htmlFor="followUpOverdue" className="text-sm">
                      Follow-up overdue
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="newContact"
                      checked={activeFilter.filters.newContact || false}
                      onCheckedChange={(checked) => updateFilter('filters.newContact', checked || undefined)}
                    />
                    <label htmlFor="newContact" className="text-sm">
                      New contact
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hotLead"
                      checked={activeFilter.filters.hotLead || false}
                      onCheckedChange={(checked) => updateFilter('filters.hotLead', checked || undefined)}
                    />
                    <label htmlFor="hotLead" className="text-sm">
                      Hot lead
                    </label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Date Range */}
            <Collapsible 
              open={expandedSections.includes('date')} 
              onOpenChange={() => toggleSection('date')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Date Range</span>
                  </div>
                  {expandedSections.includes('date') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">From Date</label>
                    <Input
                      type="date"
                      value={activeFilter.filters.dateRange?.start?.toISOString().split('T')[0] || ''}
                      onChange={(e) => updateFilter('filters.dateRange.start', e.target.value ? new Date(e.target.value) : undefined)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">To Date</label>
                    <Input
                      type="date"
                      value={activeFilter.filters.dateRange?.end?.toISOString().split('T')[0] || ''}
                      onChange={(e) => updateFilter('filters.dateRange.end', e.target.value ? new Date(e.target.value) : undefined)}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                      updateFilter('filters.dateRange', { start: yesterday, end: today });
                    }}
                  >
                    Last 24h
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                      updateFilter('filters.dateRange', { start: weekAgo, end: today });
                    }}
                  >
                    Last Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                      updateFilter('filters.dateRange', { start: monthAgo, end: today });
                    }}
                  >
                    Last Month
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyFilter}>
              Apply Filter
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Save Filter Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Give your filter a name to save it for future use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Filter Name</label>
              <Input
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                placeholder="Enter filter name"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveFilter} disabled={!saveFilterName.trim()}>
                Save Filter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}