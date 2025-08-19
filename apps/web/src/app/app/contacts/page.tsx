"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/app/PageHeader';
import { AppShell } from '@/components/app/AppShell';
import EnhancedContacts from '@/components/contacts/EnhancedContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Settings, 
  Download, 
  Upload,
  Tag,
  Building,
  MapPin,
  Calendar,
  Clock,
  Target,
  Zap,
  Sparkles,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Phone,
  Mail,
  MessageSquare,
  CheckSquare,
  Star,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
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
  Tag as TagIcon,
  Building as BuildingIcon,
  Clock as ClockIcon,
  Target as TargetIcon,
  Zap as ZapIcon,
  Sparkles as SparklesIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon
} from 'lucide-react';

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'leads' | 'customers' | 'prospects'>('all');
  const [lifecycleStage, setLifecycleStage] = useState<'all' | 'new' | 'engaged' | 'qualified' | 'customer'>('all');

  const availableFilters = [
    { id: 'enterprise', label: 'Enterprise', icon: BuildingIcon },
    { id: 'startup', label: 'Startup', icon: TargetIcon },
    { id: 'tech', label: 'Tech', icon: ZapIcon },
    { id: 'decision-maker', label: 'Decision Maker', icon: StarIcon },
    { id: 'verified-email', label: 'Verified Email', icon: CheckCircleIcon },
    { id: 'verified-phone', label: 'Verified Phone', icon: PhoneIcon },
    { id: 'high-engagement', label: 'High Engagement', icon: SparklesIcon },
    { id: 'needs-follow-up', label: 'Needs Follow-up', icon: AlertIcon },
  ];

  const lifecycleStages = [
    { id: 'all', label: 'All Stages', icon: Users },
    { id: 'new', label: 'New', icon: Plus },
    { id: 'engaged', label: 'Engaged', icon: MessageIcon },
    { id: 'qualified', label: 'Qualified', icon: TargetIcon },
    { id: 'customer', label: 'Customer', icon: CheckCircleIcon },
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getGreetingSubtitle = () => {
    const totalContacts = 1247; // Mock data
    const newThisWeek = 23; // Mock data
    return `${totalContacts} total contacts • ${newThisWeek} new this week`;
  };

  const sevenDayDeltas = [
    { label: 'Total Contacts', value: '1,247', color: 'blue' },
    { label: 'New This Week', value: '23', color: 'green' },
    { label: 'Needs Follow-up', value: '12', color: 'red' },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Contacts"
        subtitle="Manage your contacts and relationships"
        icon={<Users className="h-6 w-6" />}
        metaChips={sevenDayDeltas.map(delta => ({
          label: delta.label,
          value: delta.value,
          color: delta.color
        }))}
        gradientColors={{
          from: "from-emerald-600/12",
          via: "via-teal-600/12",
          to: "to-cyan-600/12"
        }}
      />

      {/* Search and Filter Bar */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search contacts, companies, or emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <Button
                variant={viewMode === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('all')}
                className="text-xs"
              >
                All
              </Button>
              <Button
                variant={viewMode === 'leads' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('leads')}
                className="text-xs"
              >
                Leads
              </Button>
              <Button
                variant={viewMode === 'prospects' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('prospects')}
                className="text-xs"
              >
                Prospects
              </Button>
              <Button
                variant={viewMode === 'customers' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('customers')}
                className="text-xs"
              >
                Customers
              </Button>
            </div>

            {/* Lifecycle Stage Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Stage:</span>
              <div className="flex items-center gap-1">
                {lifecycleStages.map(stage => (
                  <Button
                    key={stage.id}
                    variant={lifecycleStage === stage.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLifecycleStage(stage.id as any)}
                    className="text-xs h-8"
                  >
                    <stage.icon className="h-3 w-3 mr-1" />
                    {stage.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">Filters:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {availableFilters.map(filter => (
                <Button
                  key={filter.id}
                  variant={selectedFilters.includes(filter.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilter(filter.id)}
                  className="text-xs h-7"
                >
                  <filter.icon className="h-3 w-3 mr-1" />
                  {filter.label}
                </Button>
              ))}
            </div>
            {selectedFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFilters([])}
                className="text-xs h-7 text-slate-500 hover:text-slate-700"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Smart Suggestions */}
      <div className="px-6 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Smart Suggestions
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-700 dark:text-green-300">
                  12 contacts need follow-up
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-orange-600" />
                <span className="text-orange-700 dark:text-orange-300">
                  5 duplicate suggestions
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-purple-700 dark:text-purple-300">
                  Auto-enrichment available
                </span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="ml-auto">
              <Sparkles className="h-4 w-4 mr-2" />
              Enrich All
            </Button>
          </div>
        </div>
      </div>

      {/* Contacts Component */}
      <div className="flex-1 overflow-hidden">
        <EnhancedContacts 
          className="h-full" 
          searchQuery={searchQuery}
          selectedFilters={selectedFilters}
        />
      </div>
    </AppShell>
  );
}
