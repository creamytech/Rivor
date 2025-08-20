"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppShell from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Timeline,
  Home,
  MapPin,
  Clock,
  TrendingUp,
  AlertTriangle,
  X
} from "lucide-react";
import PipelineKanbanView from "@/components/pipeline/PipelineKanbanView";
import PipelineListView from "@/components/pipeline/PipelineListView";
import PipelineTimelineView from "@/components/pipeline/PipelineTimelineView";
import PipelineAnalyticsSidebar from "@/components/pipeline/PipelineAnalyticsSidebar";
import CreateDealModal from "@/components/pipeline/CreateDealModal";
import AdvancedFiltersModal from "@/components/pipeline/AdvancedFiltersModal";

interface FilterPill {
  id: string;
  label: string;
  count: number;
  active: boolean;
  color: string;
}

type ViewMode = 'kanban' | 'list' | 'timeline';

export default function PipelinePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showAnalytics, setShowAnalytics] = useState(true);
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
        return <Timeline className="h-4 w-4" />;
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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppShell>
        {/* Enhanced Header Section */}
        <div className="sticky top-[calc(56px+80px)] z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="px-6 py-4">
            {/* Main Toolbar */}
            <div className="flex items-center justify-between w-full mb-4">
              {/* Left Group - Search and Core Actions */}
              <div className="flex items-center gap-4">
                {/* Enhanced Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search deals, properties, or contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-80 bg-background border-input focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {/* Advanced Filters */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAdvancedFilters(true)}
                  className={selectedFilters.length > 0 ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : ""}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                  {selectedFilters.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedFilters.length}
                    </Badge>
                  )}
                </Button>
              </div>
              
              {/* Right Group - View Controls and Actions */}
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center border border-border rounded-lg p-1 bg-muted/30">
                  {(['kanban', 'list', 'timeline'] as ViewMode[]).map((view) => (
                    <Button
                      key={view}
                      variant={viewMode === view ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode(view)}
                      className="flex items-center gap-2 px-3 h-8"
                    >
                      {getViewIcon(view)}
                      <span className="capitalize hidden sm:inline">{view}</span>
                    </Button>
                  ))}
                </div>

                {/* Analytics Toggle */}
                <Button
                  variant={showAnalytics ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Analytics</span>
                </Button>

                {/* Action Buttons */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                    <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                    <DropdownMenuItem>Export Pipeline Report</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setShowCreateDeal(true)}
                  className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Deal
                </Button>
              </div>
            </div>

            {/* Quick Filters Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground mr-2">Quick filters:</span>
              {quickFilters.map((filter) => (
                <motion.div
                  key={filter.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Button
                    variant={filter.active ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleQuickFilter(filter.id)}
                    className={`text-xs h-8 relative ${filter.active ? filter.color.replace('text-', 'border-').replace('100', '300') : ''}`}
                  >
                    {filter.label}
                    <span className="ml-1 text-xs opacity-70">({filter.count})</span>
                    {filter.active && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFilter(filter.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              ))}
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex gap-6 p-6 ${showAnalytics ? 'mr-80' : ''} transition-all duration-300`}>
          {/* Pipeline View */}
          <div className="flex-1 min-w-0">
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
            className="fixed right-0 top-[calc(56px+80px+88px)] bottom-0 w-80 bg-white dark:bg-slate-900 border-l border-border shadow-xl z-10 overflow-y-auto"
          >
            <PipelineAnalyticsSidebar 
              onClose={() => setShowAnalytics(false)}
              activeFilters={activeQuickFilters}
              searchQuery={searchQuery}
            />
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