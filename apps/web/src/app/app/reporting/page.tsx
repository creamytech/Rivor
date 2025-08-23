"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '@/components/app/AppShell';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Home,
  Calendar,
  Target,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Share2,
  FileText,
  PieChart,
  LineChart,
  Activity,
  Zap,
  Star,
  Clock,
  MapPin,
  Building,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface ReportData {
  period: string;
  metrics: MetricCard[];
  chartData: any[];
  insights: string[];
  recommendations: string[];
}

export default function ReportingPage() {
  const { theme } = useTheme();
  const { isMobile } = useMobileDetection();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'deals', 'contacts', 'conversion']);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'insights'>('overview');

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    
    // Mock data for demonstration
    const mockData: ReportData = {
        period: selectedPeriod,
        metrics: [
          {
            id: 'revenue',
            title: 'Total Revenue',
            value: '$2,847,320',
            change: 12.5,
            trend: 'up',
            icon: <DollarSign className="h-5 w-5" />,
            color: 'green',
            description: 'Total commission and sales revenue'
          },
          {
            id: 'deals',
            title: 'Closed Deals',
            value: '47',
            change: 8.3,
            trend: 'up',
            icon: <Target className="h-5 w-5" />,
            color: 'blue',
            description: 'Successfully closed transactions'
          },
          {
            id: 'contacts',
            title: 'New Contacts',
            value: '289',
            change: -3.2,
            trend: 'down',
            icon: <Users className="h-5 w-5" />,
            color: 'purple',
            description: 'New leads and contacts added'
          },
          {
            id: 'conversion',
            title: 'Conversion Rate',
            value: '16.3%',
            change: 2.1,
            trend: 'up',
            icon: <TrendingUp className="h-5 w-5" />,
            color: 'orange',
            description: 'Lead to closed deal conversion'
          },
          {
            id: 'avgdeal',
            title: 'Avg Deal Size',
            value: '$60,580',
            change: 0,
            trend: 'neutral',
            icon: <Home className="h-5 w-5" />,
            color: 'teal',
            description: 'Average transaction value'
          },
          {
            id: 'pipeline',
            title: 'Pipeline Value',
            value: '$4,291,500',
            change: 15.8,
            trend: 'up',
            icon: <Activity className="h-5 w-5" />,
            color: 'indigo',
            description: 'Total value of open opportunities'
          }
        ],
        chartData: [
          { month: 'Jan', revenue: 185000, deals: 12, leads: 45 },
          { month: 'Feb', revenue: 220000, deals: 15, leads: 52 },
          { month: 'Mar', revenue: 195000, deals: 11, leads: 38 },
          { month: 'Apr', revenue: 285000, deals: 18, leads: 67 },
          { month: 'May', revenue: 312000, deals: 21, leads: 73 },
          { month: 'Jun', revenue: 275000, deals: 16, leads: 59 }
        ],
        insights: [
          'Revenue increased by 12.5% compared to last period',
          'Commercial properties showing strong performance',
          'Lead conversion rate improved significantly',
          'Pipeline value at all-time high'
        ],
        recommendations: [
          'Focus on luxury residential market expansion',
          'Increase follow-up frequency for warm leads',
          'Consider additional marketing in high-growth areas',
          'Optimize pricing strategy for faster closes'
        ]
      };

    try {
      // Fetch real reporting data from API
      const response = await fetch(`/api/reporting/overview?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        console.error('Failed to fetch reporting data');
        // Use mock data if API fails
        setReportData(mockData);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      // Use mock data if fetch fails
      setReportData(mockData);
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-3 w-3 text-green-500" />;
      case 'down': return <ArrowDown className="h-3 w-3 text-red-500" />;
      case 'neutral': return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
    }
  };

  const exportReport = () => {
    console.log('Exporting report...');
  };

  const shareReport = () => {
    console.log('Sharing report...');
  };

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        <div className="px-4 mt-4 mb-2 main-content-area">
          {/* Liquid Glass Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card glass-border-active mb-6"
            style={{ 
              backgroundColor: 'var(--glass-surface)', 
              color: 'var(--glass-text)',
              backdropFilter: 'var(--glass-blur)'
            }}
          >
            <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex items-center justify-between'} mb-6`}>
                <div className="flex items-center gap-4">
                  <div className="glass-icon-container">
                    <BarChart3 className="h-6 w-6" style={{ color: 'var(--glass-primary)' }} />
                  </div>
                  <div>
                    <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold glass-text-gradient`}>
                      {isMobile ? 'Analytics' : 'Analytics & Reporting'}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                      {isMobile ? 'Performance insights' : 'Performance insights and business analytics'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="glass-button-secondary"
                    onClick={shareReport}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="glass-button-secondary"
                    onClick={exportReport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button 
                    variant="liquid"
                    size="lg"
                    className="glass-hover-glow"
                    onClick={fetchReportData}
                  >
                    <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 mb-4">
                {/* Period Selector */}
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-48 glass-input">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent className="glass-dropdown">
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="glass-pill-container">
                  {['overview', 'detailed', 'insights'].map((mode) => (
                    <Button
                      key={mode}
                      variant={viewMode === mode ? 'liquid' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode(mode as any)}
                      className="glass-pill-button"
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Metrics Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="glass-button-secondary">
                      <Filter className="h-4 w-4 mr-2" />
                      Metrics ({selectedMetrics.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="glass-dropdown w-56">
                    <DropdownMenuLabel>Show Metrics</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {reportData?.metrics.map((metric) => (
                      <DropdownMenuItem
                        key={metric.id}
                        onClick={() => {
                          setSelectedMetrics(prev => 
                            prev.includes(metric.id) 
                              ? prev.filter(id => id !== metric.id)
                              : [...prev, metric.id]
                          );
                        }}
                        className="flex items-center gap-2"
                      >
                        <div className={cn(
                          "w-4 h-4 border rounded flex items-center justify-center",
                          selectedMetrics.includes(metric.id) && "bg-blue-500 border-blue-500"
                        )}>
                          {selectedMetrics.includes(metric.id) && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        {metric.icon}
                        {metric.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="glass-spinner-large"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPI Metrics Grid */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {reportData?.metrics
                  .filter(metric => selectedMetrics.includes(metric.id))
                  .map((metric, index) => (
                  <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-metric-card"
                    style={{ backgroundColor: 'var(--glass-surface)' }}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn(
                          'glass-icon-container-small',
                          `text-${metric.color}-500`
                        )}>
                          {metric.icon}
                        </div>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(metric.trend)}
                          <span className={cn('text-xs font-medium', getTrendColor(metric.trend))}>
                            {metric.change > 0 ? '+' : ''}{metric.change}%
                          </span>
                        </div>
                      </div>

                      <div className="mb-2">
                        <h3 className="text-sm font-medium" style={{ color: 'var(--glass-text-muted)' }}>
                          {metric.title}
                        </h3>
                        <p className="text-2xl font-bold" style={{ color: 'var(--glass-text)' }}>
                          {metric.value}
                        </p>
                      </div>

                      <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                        {metric.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <div className="grid grid-cols-12 gap-6">
                {/* Main Chart Area */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="col-span-8"
                >
                  <div className="glass-card glass-border-active"
                       style={{ backgroundColor: 'var(--glass-surface)' }}>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold glass-text-gradient">
                          Performance Trends
                        </h3>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="glass-button-small">
                            <LineChart className="h-4 w-4 mr-2" />
                            Line
                          </Button>
                          <Button variant="ghost" size="sm" className="glass-button-small">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Bar
                          </Button>
                        </div>
                      </div>

                      {/* Mock Chart Area */}
                      <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                          <p className="text-lg font-semibold" style={{ color: 'var(--glass-text)' }}>
                            Revenue trending upward
                          </p>
                          <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                            Interactive chart would be rendered here
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Insights Panel */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="col-span-4 space-y-6"
                >
                  {/* AI Insights */}
                  <div className="glass-card glass-border"
                       style={{ backgroundColor: 'var(--glass-surface-subtle)' }}>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="glass-icon-container-small">
                          <Sparkles className="h-4 w-4" style={{ color: 'var(--glass-accent)' }} />
                        </div>
                        <span className="text-sm font-semibold glass-text-gradient">
                          AI Insights
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {reportData?.insights.map((insight, index) => (
                          <div key={index} className="glass-suggestion-pill">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="glass-card glass-border"
                       style={{ backgroundColor: 'var(--glass-surface)' }}>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="glass-icon-container-small">
                          <Target className="h-4 w-4" style={{ color: 'var(--glass-primary)' }} />
                        </div>
                        <span className="text-sm font-semibold glass-text-gradient">
                          Recommendations
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {reportData?.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20">
                            <Zap className="h-4 w-4 text-blue-500 mt-0.5" />
                            <span className="text-xs" style={{ color: 'var(--glass-text)' }}>
                              {rec}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="glass-card glass-border"
                       style={{ backgroundColor: 'var(--glass-surface)' }}>
                    <div className="p-4">
                      <h4 className="text-sm font-semibold mb-4 glass-text-gradient">
                        Quick Stats
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-green-500" />
                            <span className="text-xs" style={{ color: 'var(--glass-text)' }}>
                              Avg Days to Close
                            </span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: 'var(--glass-text)' }}>
                            28 days
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-xs" style={{ color: 'var(--glass-text)' }}>
                              Active Clients
                            </span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: 'var(--glass-text)' }}>
                            156
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-purple-500" />
                            <span className="text-xs" style={{ color: 'var(--glass-text)' }}>
                              Top Market
                            </span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: 'var(--glass-text)' }}>
                            Downtown
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-orange-500" />
                            <span className="text-xs" style={{ color: 'var(--glass-text)' }}>
                              Property Types
                            </span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: 'var(--glass-text)' }}>
                            Residential
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Detailed View */}
              {viewMode === 'detailed' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="glass-card glass-border-active"
                  style={{ backgroundColor: 'var(--glass-surface)' }}
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-6 glass-text-gradient">
                      Detailed Analysis
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { title: 'Lead Sources', value: '8 Active', icon: <Target className="h-5 w-5" />, color: 'blue' },
                        { title: 'Market Segments', value: '12 Areas', icon: <MapPin className="h-5 w-5" />, color: 'green' },
                        { title: 'Avg Response Time', value: '2.3 hours', icon: <Clock className="h-5 w-5" />, color: 'orange' },
                        { title: 'Client Satisfaction', value: '4.8/5', icon: <Star className="h-5 w-5" />, color: 'yellow' }
                      ].map((item, index) => (
                        <div key={index} className="text-center p-4 rounded-lg bg-white/30 dark:bg-black/20">
                          <div className={`glass-icon-container-small mx-auto mb-3 text-${item.color}-500`}>
                            {item.icon}
                          </div>
                          <p className="text-sm font-medium" style={{ color: 'var(--glass-text-muted)' }}>
                            {item.title}
                          </p>
                          <p className="text-lg font-bold" style={{ color: 'var(--glass-text)' }}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </AppShell>
    </div>
  );
}