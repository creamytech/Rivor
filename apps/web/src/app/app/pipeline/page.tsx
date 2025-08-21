"use client";
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { motion } from 'framer-motion';
import AppShell from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Settings,
  BarChart3,
  Calendar,
  DollarSign,
  User,
  Grid3X3,
  List,
  Activity,
  Home,
  MapPin,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X
} from "lucide-react";
import PipelineKanbanView from "@/components/pipeline/PipelineKanbanView";
import PipelineListView from "@/components/pipeline/PipelineListView";
import PipelineTimelineView from "@/components/pipeline/PipelineTimelineView";
import PipelineAnalyticsSidebar from "@/components/pipeline/PipelineAnalyticsSidebar";
import CreateDealModal from "@/components/pipeline/CreateDealModal";
import AdvancedFiltersModal from "@/components/pipeline/AdvancedFiltersModal";
import PipelineFunnelViz from "@/components/pipeline/PipelineFunnelViz";

interface FilterPill {
  id: string;
  label: string;
  count: number;
  active: boolean;
  color: string;
}

type ViewMode = 'kanban' | 'list' | 'timeline';

export default function PipelinePage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [quickFilters, setQuickFilters] = useState<FilterPill[]>([
    { id: 'high-value', label: "High Value", count: 12, active: false, color: 'bg-green-100 text-green-800' },
    { id: 'overdue', label: "Overdue", count: 3, active: false, color: 'bg-red-100 text-red-800' },
    { id: 'this-week', label: "This Week", count: 8, active: false, color: 'bg-blue-100 text-blue-800' },
    { id: 'hot-leads', label: "Hot Leads", count: 5, active: false, color: 'bg-orange-100 text-orange-800' },
    { id: 'showing-scheduled', label: "Showing Scheduled", count: 7, active: false, color: 'bg-purple-100 text-purple-800' },
    { id: 'first-time-buyer', label: "First Time Buyer", count: 9, active: false, color: 'bg-teal-100 text-teal-800' }
  ]);

  const [advancedFilters, setAdvancedFilters] = useState({
    dealStage: '',
    propertyType: '',
    priceRange: { min: '', max: '' },
    daysInStage: '',
    assignedAgent: '',
    leadSource: '',
    dealProbability: '',
    lastActivity: ''
  });

  const toggleQuickFilter = (filterId: string) => {
    setQuickFilters(prev => 
      prev.map(filter => 
        filter.id === filterId 
          ? { ...filter, active: !filter.active }
          : filter
      )
    );
  };

  const removeFilter = (filterId: string) => {
    setQuickFilters(prev => 
      prev.map(filter => 
        filter.id === filterId 
          ? { ...filter, active: false }
          : filter
      )
    );
  };

  const clearAllFilters = () => {
    setQuickFilters(prev => prev.map(filter => ({ ...filter, active: false })));
    setAdvancedFilters({
      dealStage: '',
      propertyType: '',
      priceRange: { min: '', max: '' },
      daysInStage: '',
      assignedAgent: '',
      leadSource: '',
      dealProbability: '',
      lastActivity: ''
    });
    setSelectedFilters([]);
  };

  const activeQuickFilters = quickFilters.filter(filter => filter.active);
  const hasActiveFilters = activeQuickFilters.length > 0 || selectedFilters.length > 0;

  const getViewIcon = (view: ViewMode) => {
    switch (view) {
      case 'kanban':
        return <Grid3X3 className="h-4 w-4" />;
      case 'list':
        return <List className="h-4 w-4" />;
      case 'timeline':
        return <Activity className="h-4 w-4" />;
    }
  };

  const renderPipelineView = () => {
    const commonProps = {
      searchQuery,
      quickFilters: activeQuickFilters,
      advancedFilters,
    };

    switch (viewMode) {
      case 'kanban':
        return <PipelineKanbanView {...commonProps} />;
      case 'list':
        return <PipelineListView {...commonProps} />;
      case 'timeline':
        return <PipelineTimelineView {...commonProps} />;
      default:
        return <PipelineKanbanView {...commonProps} />;
    }
  };

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        {/* Liquid Glass Header */}
        <div className="px-4 mt-4 mb-2 main-content-area">
          <div className="glass-card glass-hover-pulse p-6">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl glass-card glass-hover-tilt">
                  <Activity className="h-6 w-6" style={{ color: 'var(--glass-primary)' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold glass-text-glow">Pipeline</h1>
                  <p style={{ color: 'var(--glass-text-secondary)' }}>
                    Manage your deals and opportunities
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              variant="liquid"
              size="lg"
              className="px-6"
              onClick={() => setShowCreateDeal(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              New Deal
            </Button>
          </div>

          {/* Search and Controls */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" 
                  style={{ color: 'var(--glass-text-muted)' }} />
                <Input
                  variant="pill"
                  placeholder="Search deals, properties, or contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-sm glass-hover-pulse"
                />
                {searchQuery && (
                  <Button
                    variant="liquid"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="liquid" size="sm" className="glass-click-ripple" onClick={() => setShowAdvancedFilters(true)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {selectedFilters.length > 0 && (
                  <Badge variant="liquid" className="ml-2 text-xs">
                    {selectedFilters.length}
                  </Badge>
                )}
              </Button>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                {(['kanban', 'list', 'timeline'] as ViewMode[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setViewMode(view)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 glass-hover-pulse ${
                      viewMode === view
                        ? "glass-badge glass-text-glow"
                        : "glass-badge-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getViewIcon(view)}
                      <span className="capitalize">{view}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              <Button variant="liquid" size="sm" className="glass-click-ripple" onClick={() => setShowAnalytics(!showAnalytics)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              
              <Button variant="liquid" size="sm" className="glass-click-ripple" onClick={() => router.push('/app/reporting')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium flex-shrink-0" style={{ color: 'var(--glass-text-secondary)' }}>Quick filters:</span>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              {quickFilters.map((filter) => (
                <motion.button
                  key={filter.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => toggleQuickFilter(filter.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 glass-click-ripple ${
                    filter.active 
                      ? 'glass-badge glass-text-glow' 
                      : 'glass-badge-muted'
                  }`}
                >
                  {filter.label}
                  <Badge 
                    variant="liquid" 
                    className="text-xs h-5 px-1.5"
                  >
                    {filter.count}
                  </Badge>
                </motion.button>
              ))}
            </div>
            
            {hasActiveFilters && (
              <Button
                variant="liquid"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs h-8 flex-shrink-0 glass-click-ripple"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          </div>
        </div>

        {/* Pipeline Metrics Overview */}
        <div className="px-4 pb-4 main-content-area">
          <div className="glass-card glass-hover-tilt p-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
              {[
                { title: 'New Leads', count: 24, value: '$2.4M', color: 'from-blue-500 to-cyan-500', icon: <User className="h-5 w-5" /> },
                { title: 'Qualified', count: 18, value: '$1.98M', color: 'from-green-500 to-emerald-500', icon: <CheckCircle className="h-5 w-5" /> },
                { title: 'Showing', count: 12, value: '$1.56M', color: 'from-orange-500 to-yellow-500', icon: <Calendar className="h-5 w-5" /> },
                { title: 'Offer Made', count: 8, value: '$1.2M', color: 'from-purple-500 to-pink-500', icon: <TrendingUp className="h-5 w-5" /> },
                { title: 'Contract', count: 5, value: '$750K', color: 'from-yellow-500 to-orange-500', icon: <Home className="h-5 w-5" /> },
                { title: 'Closed', count: 3, value: '$450K', color: 'from-emerald-500 to-teal-500', icon: <DollarSign className="h-5 w-5" /> }
              ].map((stage, index) => (
                <div key={stage.title} className="text-center glass-hover-pulse">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stage.color} mx-auto mb-3 flex items-center justify-center text-white`}>
                    {stage.icon}
                  </div>
                  <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--glass-text-secondary)' }}>
                    {stage.title}
                  </h3>
                  <p className="text-2xl font-bold mb-1 glass-text-glow">
                    {stage.count}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                    {stage.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 pb-4 main-content-area">
          <div className="glass-card">
            {renderPipelineView()}
          </div>
        </div>

        {/* Analytics Sidebar */}
        {showAnalytics && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-4 top-24 bottom-4 w-80 glass-card glass-hover-tilt shadow-xl z-10 overflow-y-auto"
          >
            <div className="p-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2 glass-text-glow">
                  <BarChart3 className="h-5 w-5" style={{ color: 'var(--glass-primary)' }} />
                  Pipeline Analytics
                </h3>
                <Button
                  variant="liquid"
                  size="sm"
                  onClick={() => setShowAnalytics(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <PipelineAnalyticsSidebar 
                onClose={() => setShowAnalytics(false)}
                activeFilters={activeQuickFilters}
                searchQuery={searchQuery}
              />
            </div>
          </motion.div>
        )}

        {/* Modals */}
        <CreateDealModal
          open={showCreateDeal}
          onOpenChange={setShowCreateDeal}
        />

        <AdvancedFiltersModal
          open={showAdvancedFilters}
          onOpenChange={setShowAdvancedFilters}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          onApplyFilters={setSelectedFilters}
        />
      </AppShell>
    </div>
  );
}