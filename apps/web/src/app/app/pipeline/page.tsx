"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from "@/components/app/AppShell";
import MobilePipeline from "@/components/app/MobilePipeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Search,
  Filter,
  Plus,
  BarChart3,
  Grid3X3,
  List,
  Activity,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Target,
  Sparkles,
  Zap,
  ArrowRight,
  X
} from "lucide-react";
import PipelineKanbanView from "@/components/pipeline/PipelineKanbanView";
import PipelineListView from "@/components/pipeline/PipelineListView";
import PipelineAnalyticsView from "@/components/pipeline/PipelineAnalyticsView";
import CreateDealModal from "@/components/pipeline/CreateDealModal";

interface PipelineStats {
  totalDeals: number;
  totalValue: number;
  averageDealSize: number;
  conversionRate: number;
  averageCycleTime: number;
  hotLeads: number;
}

interface QuickFilter {
  id: string;
  label: string;
  count: number;
  active: boolean;
  color: string;
  icon: React.ReactNode;
}

type ViewMode = 'kanban' | 'list' | 'analytics';

export default function PipelinePage() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const [stats, setStats] = useState<PipelineStats>({
    totalDeals: 0,
    totalValue: 0,
    averageDealSize: 0,
    conversionRate: 0,
    averageCycleTime: 0,
    hotLeads: 0
  });

  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([
    { 
      id: 'hot-leads', 
      label: "Hot Leads", 
      count: 8, 
      active: false, 
      color: 'from-red-500/20 to-orange-500/20 border-red-500/30',
      icon: <Zap className="h-3 w-3" />
    },
    { 
      id: 'high-value', 
      label: "High Value", 
      count: 12, 
      active: false, 
      color: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
      icon: <DollarSign className="h-3 w-3" />
    },
    { 
      id: 'overdue', 
      label: "Overdue", 
      count: 3, 
      active: false, 
      color: 'from-red-500/20 to-pink-500/20 border-red-500/30',
      icon: <Clock className="h-3 w-3" />
    },
    { 
      id: 'this-week', 
      label: "This Week", 
      count: 15, 
      active: false, 
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
      icon: <Target className="h-3 w-3" />
    },
    { 
      id: 'new-leads', 
      label: "New Leads", 
      count: 6, 
      active: false, 
      color: 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
      icon: <Sparkles className="h-3 w-3" />
    }
  ]);

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Fetch pipeline stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/pipeline/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch pipeline stats:', error);
      }
    };

    fetchStats();
  }, []);

  const toggleQuickFilter = (filterId: string) => {
    setQuickFilters(prev => 
      prev.map(filter => 
        filter.id === filterId 
          ? { ...filter, active: !filter.active }
          : filter
      )
    );
    
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const clearAllFilters = () => {
    setQuickFilters(prev => prev.map(filter => ({ ...filter, active: false })));
    setActiveFilters([]);
    setSearchQuery("");
  };

  const getViewIcon = (view: ViewMode) => {
    switch (view) {
      case 'kanban':
        return <Grid3X3 className="h-4 w-4" />;
      case 'list':
        return <List className="h-4 w-4" />;
      case 'analytics':
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const hasActiveFilters = quickFilters.some(f => f.active) || searchQuery.length > 0;

  // Mobile view
  if (isMobile) {
    return (
      <div className={`min-h-screen ${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
        <AppShell>
          <MobilePipeline />
        </AppShell>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        <div className="flex-1 overflow-hidden">
          {/* Liquid Glass Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-teal-500/5" />
            
            <div className="relative glass-card glass-border-subtle m-6 mb-4">
              <div className="p-8">
                {/* Main Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-6">
                    <div className="p-4 rounded-2xl glass-surface glass-border glass-hover-glow">
                      <Activity className="h-8 w-8" style={{ color: 'var(--glass-primary)' }} />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold glass-text-glow mb-2">
                        Sales Pipeline
                      </h1>
                      <p className="text-lg" style={{ color: 'var(--glass-text-secondary)' }}>
                        Track deals and opportunities with precision
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="liquid"
                      size="lg"
                      className="px-8 py-3 text-lg font-medium glass-click-ripple"
                      onClick={() => setShowCreateDeal(true)}
                    >
                      <Plus className="h-5 w-5 mr-3" />
                      New Deal
                    </Button>
                  </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                  {[
                    { 
                      label: 'Total Deals', 
                      value: stats.totalDeals.toString(), 
                      icon: Users,
                      color: 'from-blue-500 to-cyan-500',
                      change: '+12%'
                    },
                    { 
                      label: 'Pipeline Value', 
                      value: `$${(stats.totalValue / 1000000).toFixed(1)}M`, 
                      icon: DollarSign,
                      color: 'from-emerald-500 to-green-500',
                      change: '+8%'
                    },
                    { 
                      label: 'Avg Deal Size', 
                      value: `$${(stats.averageDealSize / 1000).toFixed(0)}K`, 
                      icon: Target,
                      color: 'from-purple-500 to-violet-500',
                      change: '+15%'
                    },
                    { 
                      label: 'Conversion', 
                      value: `${stats.conversionRate.toFixed(1)}%`, 
                      icon: TrendingUp,
                      color: 'from-orange-500 to-yellow-500',
                      change: '+5%'
                    },
                    { 
                      label: 'Avg Cycle', 
                      value: `${stats.averageCycleTime}d`, 
                      icon: Clock,
                      color: 'from-cyan-500 to-blue-500',
                      change: '-3d'
                    },
                    { 
                      label: 'Hot Leads', 
                      value: stats.hotLeads.toString(), 
                      icon: Zap,
                      color: 'from-red-500 to-orange-500',
                      change: '+6'
                    }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group"
                    >
                      <div className="glass-surface glass-border glass-hover-pulse rounded-xl p-4 transition-all duration-200 group-hover:glass-hover-glow">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}/20`}>
                            <stat.icon className="h-4 w-4" style={{ color: 'var(--glass-primary)' }} />
                          </div>
                          <span className="text-xs glass-badge px-2 py-1 rounded-full">
                            {stat.change}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold glass-text-glow">
                            {stat.value}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                            {stat.label}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Search and Controls */}
                <div className="flex items-center gap-4 mb-6">
                  {/* Enhanced Search */}
                  <div className="flex-1 max-w-2xl relative group">
                    <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-200" 
                      style={{ color: searchQuery ? 'var(--glass-primary)' : 'var(--glass-text-muted)' }} />
                    <Input
                      variant="pill"
                      placeholder="Search deals, clients, properties..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-16 pr-12 py-4 text-base glass-hover-glow transition-all duration-300"
                    />
                    <AnimatePresence>
                      {searchQuery && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        >
                          <Button
                            variant="liquid"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full glass-click-ripple"
                            onClick={() => setSearchQuery('')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* View Mode Toggle */}
                  <div className="glass-surface glass-border rounded-xl p-1 flex">
                    {(['kanban', 'list', 'analytics'] as ViewMode[]).map((view) => (
                      <button
                        key={view}
                        onClick={() => setViewMode(view)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 glass-hover-pulse flex items-center gap-2 ${
                          viewMode === view
                            ? "glass-surface-strong glass-text-glow shadow-lg"
                            : "glass-hover-subtle"
                        }`}
                      >
                        {getViewIcon(view)}
                        <span className="capitalize">{view}</span>
                      </button>
                    ))}
                  </div>

                  {/* Filter Toggle */}
                  <Button 
                    variant="liquid" 
                    size="sm" 
                    className="glass-click-ripple"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilters.length > 0 && (
                      <span className="ml-2 glass-badge px-2 py-0.5 rounded-full text-xs">
                        {activeFilters.length}
                      </span>
                    )}
                  </Button>
                </div>

                {/* Quick Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 pb-6">
                        <span className="text-sm font-medium flex-shrink-0" style={{ color: 'var(--glass-text-secondary)' }}>
                          Quick filters:
                        </span>
                        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
                          {quickFilters.map((filter, index) => (
                            <motion.button
                              key={filter.id}
                              initial={{ opacity: 0, scale: 0.9, x: 20 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => toggleQuickFilter(filter.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap glass-click-ripple ${
                                filter.active 
                                  ? `glass-surface-strong glass-text-glow bg-gradient-to-r ${filter.color} shadow-lg scale-105` 
                                  : 'glass-surface glass-hover-pulse'
                              }`}
                            >
                              {filter.icon}
                              {filter.label}
                              <span className={`glass-badge-muted px-1.5 py-0.5 rounded-full text-xs ${filter.active ? 'glass-badge' : ''}`}>
                                {filter.count}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                        
                        {hasActiveFilters && (
                          <Button
                            variant="liquid"
                            size="sm"
                            onClick={clearAllFilters}
                            className="flex-shrink-0 glass-click-ripple"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Main Pipeline Content */}
          <div className="mx-6 mb-6">
            <div className="glass-card glass-border-subtle rounded-2xl overflow-hidden">
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {viewMode === 'kanban' && (
                    <motion.div
                      key="kanban"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PipelineKanbanView 
                        searchQuery={searchQuery}
                        quickFilters={quickFilters.filter(f => f.active)}
                        advancedFilters={{}}
                      />
                    </motion.div>
                  )}
                  
                  {viewMode === 'list' && (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PipelineListView 
                        searchQuery={searchQuery}
                        quickFilters={quickFilters.filter(f => f.active)}
                        advancedFilters={{}}
                      />
                    </motion.div>
                  )}
                  
                  {viewMode === 'analytics' && (
                    <motion.div
                      key="analytics"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PipelineAnalyticsView 
                        searchQuery={searchQuery}
                        quickFilters={quickFilters.filter(f => f.active)}
                        advancedFilters={{}}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Create Deal Modal */}
        <CreateDealModal
          open={showCreateDeal}
          onOpenChange={setShowCreateDeal}
        />
      </AppShell>
    </div>
  );
}