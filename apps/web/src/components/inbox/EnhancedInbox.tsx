"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  X, 
  Mail, 
  Star, 
  Archive, 
  Trash2, 
  MoreHorizontal,
  User, 
  Building, 
  Home,
  Clock,
  Paperclip,
  Eye,
  MessageSquare,
  ArrowUp,
  Calendar,
  Phone,
  MapPin,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Bookmark,
  Settings,
  Download,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailItem {
  id: string;
  subject: string;
  sender: {
    name: string;
    email: string;
    avatar?: string;
  };
  snippet: string;
  timestamp: string;
  isUnread: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  intent: 'buyer' | 'seller' | 'renter' | 'other';
  confidence: number;
  stage: 'new' | 'qualified' | 'meeting' | 'closed';
  tags: string[];
  leadData?: {
    address?: string;
    priceRange?: string;
    bedrooms?: number;
    timeline?: string;
    phone?: string;
    reason: string;
  };
}

interface SearchChip {
  id: string;
  label: string;
  type: 'from' | 'has' | 'stage' | 'confidence' | 'custom';
  value: string;
}

export default function EnhancedInbox() {
  const [activeTab, setActiveTab] = useState('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchChips, setSearchChips] = useState<SearchChip[]>([]);
  const [selectedItem, setSelectedItem] = useState<EmailItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [items, setItems] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedFilters, setSavedFilters] = useState([
    { id: '1', name: 'New senders', query: 'from:new' },
    { id: '2', name: 'Has phone #', query: 'has:phone' },
    { id: '3', name: 'Has times', query: 'has:times' }
  ]);

  // Mock data
  useEffect(() => {
    const mockItems: EmailItem[] = [
      {
        id: '1',
        subject: 'Property inquiry - 123 Main St',
        sender: { name: 'John Smith', email: 'john@email.com' },
        snippet: 'Hi, I\'m interested in viewing the property at 123 Main St. Could you provide more details about the price and availability?',
        timestamp: '2 hours ago',
        isUnread: true,
        isStarred: false,
        hasAttachments: false,
        intent: 'buyer',
        confidence: 85,
        stage: 'new',
        tags: ['high-priority', 'first-time-buyer'],
        leadData: {
          address: '123 Main St, City, State',
          priceRange: '$300k - $400k',
          bedrooms: 3,
          timeline: '3-6 months',
          phone: '+1 (555) 123-4567',
          reason: 'Mentioned specific property address and asked about pricing'
        }
      },
      {
        id: '2',
        subject: 'Commercial property viewing request',
        sender: { name: 'Sarah Johnson', email: 'sarah@company.com' },
        snippet: 'We are looking to lease office space in the downtown area. Do you have any commercial properties available?',
        timestamp: '1 day ago',
        isUnread: false,
        isStarred: true,
        hasAttachments: true,
        intent: 'renter',
        confidence: 92,
        stage: 'qualified',
        tags: ['commercial', 'lease'],
        leadData: {
          address: 'Downtown area',
          priceRange: '$5k - $10k/month',
          timeline: '1-2 months',
          phone: '+1 (555) 987-6543',
          reason: 'Specific commercial leasing request with timeline'
        }
      },
      {
        id: '3',
        subject: 'Selling my house - need valuation',
        sender: { name: 'Mike Wilson', email: 'mike@email.com' },
        snippet: 'I\'m thinking of selling my house and would like to get a valuation. Can you help me understand the current market?',
        timestamp: '3 days ago',
        isUnread: false,
        isStarred: false,
        hasAttachments: false,
        intent: 'seller',
        confidence: 78,
        stage: 'new',
        tags: ['valuation', 'market-analysis'],
        leadData: {
          address: '456 Oak Ave, City, State',
          priceRange: 'TBD',
          bedrooms: 4,
          timeline: '6-12 months',
          phone: '+1 (555) 456-7890',
          reason: 'Explicitly mentioned selling and requested valuation'
        }
      }
    ];
    setItems(mockItems);
    setLoading(false);
  }, []);

  const addSearchChip = (type: SearchChip['type'], label: string, value: string) => {
    const chip: SearchChip = {
      id: Date.now().toString(),
      type,
      label,
      value
    };
    setSearchChips(prev => [...prev, chip]);
  };

  const removeSearchChip = (chipId: string) => {
    setSearchChips(prev => prev.filter(chip => chip.id !== chipId));
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'buyer': return <Home className="h-3 w-3" />;
      case 'seller': return <Building className="h-3 w-3" />;
      case 'renter': return <User className="h-3 w-3" />;
      default: return <Mail className="h-3 w-3" />;
    }
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'buyer': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'seller': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'renter': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'new': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'qualified': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'meeting': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'closed': return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const handleBulkAction = (action: 'promote' | 'dismiss' | 'assign') => {
    console.log(`Bulk ${action} for items:`, Array.from(selectedItems));
    setSelectedItems(new Set());
    setShowBulkActions(false);
  };

  const filteredItems = items.filter(item => {
    // Filter by tab
    if (activeTab === 'leads' && item.intent === 'other') return false;
    if (activeTab === 'review' && item.confidence < 70) return false;
    if (activeTab === 'other' && item.intent !== 'other') return false;

    // Filter by search chips
    return searchChips.every(chip => {
      switch (chip.type) {
        case 'from':
          return item.sender.email.toLowerCase().includes(chip.value.toLowerCase()) ||
                 item.sender.name.toLowerCase().includes(chip.value.toLowerCase());
        case 'has':
          if (chip.value === 'attachment') return item.hasAttachments;
          if (chip.value === 'phone') return item.leadData?.phone;
          return true;
        case 'stage':
          return item.stage === chip.value;
        case 'confidence':
          const threshold = parseInt(chip.value);
          return item.confidence >= threshold;
        default:
          return true;
      }
    });
  });

  const renderEmailRow = (item: EmailItem) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors cursor-pointer group',
        item.isUnread ? 'bg-blue-50/50 dark:bg-blue-900/20' : '',
        selectedItem?.id === item.id ? 'bg-teal-50/50 dark:bg-teal-900/20' : ''
      )}
      onClick={() => setSelectedItem(item)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          <AvatarImage src={item.sender.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {item.sender.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                'font-medium text-sm truncate',
                item.isUnread ? 'font-semibold' : ''
              )}>
                {item.subject}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                {item.sender.name} • {item.sender.email}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {item.timestamp}
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
            {item.snippet}
          </p>

          {/* Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="secondary" 
              className={`text-xs ${getIntentColor(item.intent)}`}
            >
              {getIntentIcon(item.intent)}
              <span className="ml-1 capitalize">{item.intent}</span>
            </Badge>
            
            <Badge 
              variant="outline" 
              className={`text-xs ${getConfidenceColor(item.confidence)}`}
            >
              {item.confidence}% confidence
            </Badge>

            <Badge 
              variant="secondary" 
              className={`text-xs ${getStageColor(item.stage)}`}
            >
              {item.stage}
            </Badge>

            {item.leadData?.address && (
              <Badge variant="outline" className="text-xs">
                📍 address found
              </Badge>
            )}

            {item.leadData?.phone && (
              <Badge variant="outline" className="text-xs">
                📞 times found
              </Badge>
            )}

            {item.hasAttachments && (
              <Badge variant="outline" className="text-xs">
                📎
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              // Handle reply
            }}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              // Handle promote
            }}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              // Handle dismiss
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              // Handle more
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const renderLeadSummary = (item: EmailItem) => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Lead Summary</h3>
        <Button variant="outline" size="sm">
          <Bookmark className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Entities */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-slate-600 dark:text-slate-400">Entities Found</h4>
        
        {item.leadData?.address && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <MapPin className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Address</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{item.leadData.address}</p>
            </div>
          </div>
        )}

        {item.leadData?.priceRange && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <DollarSign className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm font-medium">Price Range</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{item.leadData.priceRange}</p>
            </div>
          </div>
        )}

        {item.leadData?.bedrooms && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Home className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Bedrooms</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{item.leadData.bedrooms}</p>
            </div>
          </div>
        )}

        {item.leadData?.phone && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Phone className="h-4 w-4 text-teal-500" />
            <div>
              <p className="text-sm font-medium">Phone</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{item.leadData.phone}</p>
            </div>
          </div>
        )}

        {item.leadData?.timeline && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Clock className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-sm font-medium">Timeline</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{item.leadData.timeline}</p>
            </div>
          </div>
        )}
      </div>

      {/* Why Lead */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-slate-600 dark:text-slate-400">Why Lead</h4>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">{item.leadData?.reason}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-slate-600 dark:text-slate-400">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            <MessageSquare className="h-3 w-3 mr-1" />
            Reply
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            Schedule
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowUp className="h-3 w-3 mr-1" />
            Promote
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Assign
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* Header Tabs */}
      <GlassCard variant="gradient" intensity="medium" className="mb-4">
        <GlassCardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/10">
              <TabsTrigger value="leads" className="text-sm">
                Leads ({items.filter(i => i.intent !== 'other').length})
              </TabsTrigger>
              <TabsTrigger value="review" className="text-sm">
                Review ({items.filter(i => i.confidence < 70).length})
              </TabsTrigger>
              <TabsTrigger value="other" className="text-sm">
                Other ({items.filter(i => i.intent === 'other').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </GlassCardContent>
      </GlassCard>

      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-white/20 p-4 mb-4">
        <div className="space-y-3">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Saved
            </Button>
          </div>

          {/* Search Chips */}
          {searchChips.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {searchChips.map((chip) => (
                <Badge
                  key={chip.id}
                  variant="secondary"
                  className="text-xs"
                >
                  {chip.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => removeSearchChip(chip.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Saved Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Saved filters:</span>
            {savedFilters.map((filter) => (
              <Button
                key={filter.id}
                variant="ghost"
                size="sm"
                className="text-xs h-6"
                onClick={() => addSearchChip('custom', filter.name, filter.query)}
              >
                {filter.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Split Pane Layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Pane - Email List */}
        <div className="flex-1 flex flex-col min-w-0">
          <GlassCard variant="gradient" intensity="medium" className="flex-1 flex flex-col">
            <GlassCardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <GlassCardTitle className="text-lg">
                  {activeTab === 'leads' ? 'Lead Emails' : 
                   activeTab === 'review' ? 'Review Queue' : 'Other Emails'}
                </GlassCardTitle>
                <div className="flex items-center gap-2">
                  {selectedItems.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {selectedItems.size} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkActions(!showBulkActions)}
                      >
                        Bulk Actions
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </GlassCardHeader>

            <GlassCardContent className="flex-1 p-0 overflow-hidden">
              <div className="h-full overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center">
                    <Mail className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                      No {activeTab} emails found
                    </p>
                    <p className="text-xs text-slate-500">
                      {searchChips.length > 0 ? 'Try adjusting your search filters' : 'New emails will appear here'}
                    </p>
                  </div>
                ) : (
                  filteredItems.map(renderEmailRow)
                )}
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Right Pane - Lead Summary */}
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="w-80 flex-shrink-0"
          >
            <GlassCard variant="gradient" intensity="medium" className="h-full">
              <GlassCardContent className="p-0 h-full overflow-y-auto">
                {renderLeadSummary(selectedItem)}
              </GlassCardContent>
            </GlassCard>
          </motion.div>
        )}
      </div>

      {/* Bulk Actions Modal */}
      <AnimatePresence>
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <GlassCard variant="gradient" intensity="medium">
              <GlassCardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {selectedItems.size} items selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('promote')}
                  >
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Promote
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('dismiss')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Dismiss
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('assign')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBulkActions(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
