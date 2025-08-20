"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import AppShell from "@/components/app/AppShell";
import EnhancedContacts from "@/components/contacts/EnhancedContacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
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
  const { currentTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'leads' | 'customers' | 'prospects'>('all');
  const [lifecycleStage, setLifecycleStage] = useState<'all' | 'new' | 'engaged' | 'qualified' | 'customer'>('all');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const handleImport = async () => {
    try {
      setImporting(true);
      await fetch('/api/crm/import', { method: 'POST' });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await fetch('/api/crm/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contacts.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell>
      {/* Consolidated Sticky Filter Bar */}
      <div className="sticky top-0 z-30 px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
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

            {/* Horizontal Filter Chips */}
            <div className="flex items-center gap-2 flex-1">
              {/* View Mode */}
              <div className="flex items-center gap-1">
                {['all', 'leads', 'prospects', 'customers'].map(mode => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode(mode as any)}
                    className="text-xs h-7 px-2"
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                ))}
              </div>
              
              <div className="w-px h-6 bg-border" />
              
              {/* Lifecycle Stages */}
              <div className="flex items-center gap-1">
                {lifecycleStages.slice(1).map(stage => (
                  <Button
                    key={stage.id}
                    variant={lifecycleStage === stage.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLifecycleStage(stage.id as any)}
                    className="text-xs h-7 px-2"
                  >
                    <stage.icon className="h-3 w-3 mr-1" />
                    {stage.label}
                  </Button>
                ))}
              </div>
              
              <div className="w-px h-6 bg-border" />
              
              {/* Filter Tags */}
              <div className="flex items-center gap-1 flex-wrap">
                {availableFilters.slice(0, 4).map(filter => (
                  <Button
                    key={filter.id}
                    variant={selectedFilters.includes(filter.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleFilter(filter.id)}
                    className="text-xs h-7 px-2"
                  >
                    <filter.icon className="h-3 w-3 mr-1" />
                    {filter.label}
                  </Button>
                ))}
                {selectedFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFilters([])}
                    className="text-xs h-7 px-2 text-red-600 hover:text-red-700"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleImport} disabled={importing} className="h-7">
                <Upload className="h-3 w-3 mr-1" />
                Import
              </Button>
              <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting} className="h-7">
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Suggestions as Interactive Cards */}
      <div 
        className="px-6 py-4 border-b"
        style={{
          backgroundColor: currentTheme.colors.surfaceAlt,
          borderColor: currentTheme.colors.border
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Smart Suggestions - Take Action
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Follow-up Card */}
            <div className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm text-green-700 dark:text-green-300">Follow-up Needed</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">12</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Contacts haven't been contacted in 7+ days</p>
              <Button size="sm" variant="outline" className="w-full h-7 text-xs group-hover:bg-green-50 group-hover:border-green-300">
                Draft Follow-up Emails
              </Button>
            </div>
            
            {/* Duplicates Card */}
            <div className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-orange-200 dark:border-orange-800 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-sm text-orange-700 dark:text-orange-300">Duplicate Contacts</span>
                </div>
                <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-xs">5</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Potential duplicate contacts detected</p>
              <Button size="sm" variant="outline" className="w-full h-7 text-xs group-hover:bg-orange-50 group-hover:border-orange-300">
                Review & Merge
              </Button>
            </div>
            
            {/* Enrichment Card */}
            <div className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm text-purple-700 dark:text-purple-300">Data Enrichment</span>
                </div>
                <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs">23</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Contacts missing phone numbers or addresses</p>
              <Button size="sm" variant="outline" className="w-full h-7 text-xs group-hover:bg-purple-50 group-hover:border-purple-300">
                Auto-Enrich Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table View Contacts */}
      <div className="flex-1 overflow-hidden">
        <EnhancedContacts 
          className="h-full" 
          searchQuery={searchQuery}
          selectedFilters={selectedFilters}
          defaultView="table"
          showTableHeaders={true}
        />
      </div>
    </AppShell>
  );
}
