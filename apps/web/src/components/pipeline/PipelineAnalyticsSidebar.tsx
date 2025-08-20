"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  FunnelChart,
  Funnel
} from 'recharts';
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  Target,
  Users,
  AlertTriangle,
  CheckCircle,
  Star,
  Award,
  Activity,
  Zap,
  ArrowRight,
  ChevronRight,
  BarChart3
} from "lucide-react";

interface PipelineAnalyticsSidebarProps {
  onClose: () => void;
  activeFilters: any[];
  searchQuery: string;
}

// Enhanced analytics data generator
const generateAnalyticsData = () => {
  return {
    overview: {
      totalDeals: 47,
      totalValue: 12750000,
      avgDealSize: 271277,
      conversionRate: 23.4,
      avgSalesCycle: 45,
      monthlyGrowth: 12.3,
      weeklyVelocity: 8.7,
      closingRatio: 18.5
    },
    stageConversion: [
      { stage: 'Lead', deals: 47, value: 12750000, conversionRate: 100, color: '#64748b' },
      { stage: 'Qualified', deals: 38, value: 10950000, conversionRate: 80.9, color: '#3b82f6' },
      { stage: 'Showing', deals: 28, value: 8750000, conversionRate: 73.7, color: '#8b5cf6' },
      { stage: 'Offer', deals: 18, value: 6250000, conversionRate: 64.3, color: '#f59e0b' },
      { stage: 'Contract', deals: 12, value: 4100000, conversionRate: 66.7, color: '#10b981' },
      { stage: 'Closed', deals: 11, value: 3750000, conversionRate: 91.7, color: '#059669' }
    ],
    monthlyTrends: [
      { month: 'Jan', deals: 8, value: 2100000, closed: 3, velocity: 6.2 },
      { month: 'Feb', deals: 12, value: 3200000, closed: 5, velocity: 7.1 },
      { month: 'Mar', deals: 15, value: 4100000, closed: 6, velocity: 8.3 },
      { month: 'Apr', deals: 18, value: 4800000, closed: 8, velocity: 9.1 },
      { month: 'May', deals: 22, value: 5900000, closed: 9, velocity: 8.8 },
      { month: 'Jun', deals: 25, value: 6750000, closed: 11, velocity: 8.7 }
    ],
    dealsBySource: [
      { name: 'Website', value: 35, color: '#3B82F6', count: 16 },
      { name: 'Referral', value: 28, color: '#10B981', count: 13 },
      { name: 'Social Media', value: 20, color: '#8B5CF6', count: 9 },
      { name: 'Cold Calls', value: 12, color: '#F59E0B', count: 6 },
      { name: 'Open House', value: 5, color: '#EF4444', count: 3 }
    ],
    topPerformers: [
      { name: 'John Smith', deals: 12, value: 3200000, conversionRate: 28.5, velocity: 32, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
      { name: 'Mary Johnson', deals: 10, value: 2800000, conversionRate: 25.8, velocity: 28, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mary' },
      { name: 'Tom Wilson', deals: 8, value: 2200000, conversionRate: 22.1, velocity: 24, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom' },
      { name: 'Lisa Davis', deals: 7, value: 1950000, conversionRate: 19.8, velocity: 22, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' }
    ],
    hotDeals: [
      { id: '1', client: 'Sarah Johnson', property: '123 Oak Street', value: 750000, probability: 85, daysInStage: 3, nextAction: 'Contract Review' },
      { id: '2', client: 'Michael Chen', property: '456 Pine Ave', value: 650000, probability: 78, daysInStage: 5, nextAction: 'Final Walkthrough' },
      { id: '3', client: 'Emily Rodriguez', property: '789 Maple Dr', value: 580000, probability: 72, daysInStage: 2, nextAction: 'Inspection' },
      { id: '4', client: 'David Wilson', property: '321 Cedar Ln', value: 820000, probability: 68, daysInStage: 7, nextAction: 'Offer Negotiation' }
    ],
    dealsNeedingAttention: [
      { id: '1', client: 'Lisa Thompson', property: '654 Elm Street', issue: 'No activity for 10 days', priority: 'high', value: 485000 },
      { id: '2', client: 'Robert Lee', property: '987 Birch Road', issue: 'Showing overdue by 3 days', priority: 'medium', value: 320000 },
      { id: '3', client: 'Amanda Davis', property: '147 Willow Way', issue: 'Follow-up call needed', priority: 'low', value: 275000 }
    ]
  };
};

export default function PipelineAnalyticsSidebar({ onClose, activeFilters, searchQuery }: PipelineAnalyticsSidebarProps) {
  const [data, setData] = useState(generateAnalyticsData());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'funnel' | 'trends' | 'performance'>('overview');

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setData(generateAnalyticsData());
      setIsLoading(false);
    }, 500);
  }, [activeFilters, searchQuery]);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="h-full bg-white dark:bg-slate-900 border-l border-border flex flex-col">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">Pipeline Analytics</h2>
            <p className="text-sm text-blue-600 dark:text-blue-300">Real-time insights & performance</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* View Tabs */}
        <div className="flex gap-1 bg-white/50 dark:bg-slate-800/50 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'funnel', label: 'Funnel', icon: Target },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'performance', label: 'Team', icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedView(id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                selectedView === id
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-blue-700 dark:text-blue-300 hover:bg-white/80 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {selectedView === 'overview' && (
              <OverviewSection data={data} formatValue={formatValue} isLoading={isLoading} />
            )}
            {selectedView === 'funnel' && (
              <FunnelSection data={data} formatValue={formatValue} isLoading={isLoading} />
            )}
            {selectedView === 'trends' && (
              <TrendsSection data={data} formatValue={formatValue} isLoading={isLoading} />
            )}
            {selectedView === 'performance' && (
              <PerformanceSection data={data} formatValue={formatValue} isLoading={isLoading} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Overview Section Component
function OverviewSection({ data, formatValue, isLoading }: { data: any; formatValue: (value: number) => string; isLoading: boolean }) {
  return (
    <div className="space-y-6">
      {/* Enhanced Key Metrics */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Activity className="h-5 w-5" />
            Pipeline Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{formatValue(data.overview.totalValue)}</div>
                  <div className="text-xs text-muted-foreground">Total Pipeline Value</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{data.overview.totalDeals}</div>
                  <div className="text-xs text-muted-foreground">Active Deals</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{data.overview.conversionRate}%</div>
                  <div className="text-xs text-muted-foreground">Conversion Rate</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{data.overview.avgSalesCycle}d</div>
                  <div className="text-xs text-muted-foreground">Avg Sales Cycle</div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Growth Indicators */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-green-100 dark:border-green-800"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Monthly Growth</span>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-sm font-bold">+{data.overview.monthlyGrowth}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(data.overview.monthlyGrowth * 2, 100)}%` }}
                />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Weekly Velocity</span>
                <div className="flex items-center gap-1 text-blue-600">
                  <Activity className="h-3 w-3" />
                  <span className="text-sm font-bold">{data.overview.weeklyVelocity}x</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(data.overview.weeklyVelocity * 10, 100)}%` }}
                />
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Hot Deals Alert */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-orange-900 dark:text-orange-100">
            <Zap className="h-4 w-4" />
            Hot Deals ({data.hotDeals.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.hotDeals.slice(0, 3).map((deal: any, index: number) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-orange-100 dark:border-orange-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm truncate">{deal.client}</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    deal.probability >= 80 ? 'bg-green-500' :
                    deal.probability >= 60 ? 'bg-yellow-500' : 'bg-orange-500'
                  }`} />
                  <span className="text-xs font-semibold">{deal.probability}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2 truncate">{deal.property}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-green-600">{formatValue(deal.value)}</span>
                <span className="text-xs text-muted-foreground">{deal.daysInStage}d in stage</span>
              </div>
              <div className="mt-2 pt-2 border-t border-orange-100">
                <span className="text-xs font-medium text-orange-700">Next: {deal.nextAction}</span>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Funnel Section Component
function FunnelSection({ data, formatValue, isLoading }: { data: any; formatValue: (value: number) => string; isLoading: boolean }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Conversion Funnel Story
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.stageConversion.map((stage: any, index: number) => {
              const prevStage = data.stageConversion[index - 1];
              const dropoff = prevStage ? ((prevStage.deals - stage.deals) / prevStage.deals * 100) : 0;
              const nextStage = data.stageConversion[index + 1];
              const progressToNext = nextStage ? (nextStage.deals / stage.deals * 100) : 100;
              
              return (
                <motion.div
                  key={stage.stage}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className={`p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md`} 
                       style={{ 
                         backgroundColor: `${stage.color}15`,
                         borderColor: `${stage.color}40`
                       }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="font-semibold text-lg">{stage.stage}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl">{stage.deals}</div>
                        <div className="text-xs text-muted-foreground">deals</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Value</div>
                        <div className="font-bold text-green-600">{formatValue(stage.value)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Conversion Rate</div>
                        <div className="font-bold">{stage.conversionRate.toFixed(1)}%</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="h-3 rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${stage.conversionRate}%`,
                          backgroundColor: stage.color
                        }}
                      />
                    </div>
                    
                    {nextStage && (
                      <div className="text-xs text-muted-foreground">
                        {progressToNext.toFixed(1)}% advance to {nextStage.stage}
                      </div>
                    )}
                  </div>
                  
                  {index > 0 && dropoff > 0 && (
                    <div className="flex items-center justify-center my-2">
                      <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {dropoff.toFixed(1)}% drop-off
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Trends Section Component  
function TrendsSection({ data, formatValue, isLoading }: { data: any; formatValue: (value: number) => string; isLoading: boolean }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'value' ? formatValue(value as number) : value,
                  name === 'value' ? 'Pipeline Value' : name === 'deals' ? 'New Deals' : name === 'closed' ? 'Closed Deals' : 'Velocity'
                ]} />
                <Area type="monotone" dataKey="value" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="deals" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="closed" stackId="3" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Key insights */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="text-lg font-bold text-blue-600">25</div>
              <div className="text-xs text-blue-600">Deals This Month</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <div className="text-lg font-bold text-green-600">11</div>
              <div className="text-xs text-green-600">Closed This Month</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
              <div className="text-lg font-bold text-orange-600">8.7x</div>
              <div className="text-xs text-orange-600">Current Velocity</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Lead Sources Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.dealsBySource}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.dealsBySource.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {data.dealsBySource.map((source: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                  <span className="text-sm font-medium">{source.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{source.count} deals</div>
                  <div className="text-xs text-muted-foreground">{source.value}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Performance Section Component
function PerformanceSection({ data, formatValue, isLoading }: { data: any; formatValue: (value: number) => string; isLoading: boolean }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Performers This Month
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.topPerformers.map((agent: any, index: number) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-100 dark:border-green-800 hover:shadow-md transition-shadow"
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={agent.avatar} />
                  <AvatarFallback>{agent.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                </Avatar>
                {index === 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Award className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg">{agent.name}</span>
                  <span className="text-lg font-bold text-green-600">{formatValue(agent.value)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Deals</div>
                    <div className="font-bold">{agent.deals}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Conversion</div>
                    <div className="font-bold">{agent.conversionRate}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Velocity</div>
                    <div className="font-bold">{agent.velocity}d</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
      
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-900 dark:text-red-100">
            <AlertTriangle className="h-4 w-4" />
            Deals Needing Attention ({data.dealsNeedingAttention.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.dealsNeedingAttention.map((deal: any, index: number) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
                deal.priority === 'high' ? 'bg-red-100 border-red-200 dark:bg-red-900 dark:border-red-800' :
                deal.priority === 'medium' ? 'bg-orange-100 border-orange-200 dark:bg-orange-900 dark:border-orange-800' :
                'bg-yellow-100 border-yellow-200 dark:bg-yellow-900 dark:border-yellow-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{deal.client}</span>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={deal.priority === 'high' ? 'destructive' : deal.priority === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {deal.priority}
                  </Badge>
                  <span className="text-xs font-bold text-green-600">{formatValue(deal.value)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2 truncate">{deal.property}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium flex-1">{deal.issue}</p>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}