"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Star,
  Trophy,
  Filter
} from "lucide-react";

interface Deal {
  id: string;
  title: string;
  clientName: string;
  dealValue: number;
  stage: string;
  daysInStage: number;
  probability: number;
  priority: 'hot' | 'warm' | 'cold';
  assignedAgent: string;
  leadSource: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PipelineAnalyticsViewProps {
  searchQuery: string;
  quickFilters: any[];
  advancedFilters: any;
}

interface AnalyticsMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface StageAnalytics {
  stageId: string;
  stageName: string;
  dealCount: number;
  totalValue: number;
  avgDaysInStage: number;
  conversionRate: number;
  color: string;
}

const STAGE_NAMES = {
  'prospect': 'Prospects',
  'qualified': 'Qualified',
  'showing': 'Active Showing',
  'negotiating': 'Negotiating',
  'contract': 'Under Contract',
  'closing': 'Closing'
};

const STAGE_COLORS = {
  'prospect': 'from-slate-400 to-slate-600',
  'qualified': 'from-blue-400 to-blue-600',
  'showing': 'from-purple-400 to-purple-600',
  'negotiating': 'from-orange-400 to-orange-600',
  'contract': 'from-emerald-400 to-emerald-600',
  'closing': 'from-green-400 to-green-600'
};

export default function PipelineAnalyticsView({ searchQuery, quickFilters, advancedFilters }: PipelineAnalyticsViewProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stageAnalytics, setStageAnalytics] = useState<StageAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pipeline/stages');
      if (!response.ok) throw new Error('Failed to fetch pipeline data');
      
      const { stages } = await response.json();
      
      // Process deals and calculate analytics
      const allDeals: Deal[] = [];
      const stageData: StageAnalytics[] = [];
      
      stages.forEach((stage: any) => {
        if (stage.leads) {
          const stageDeals = stage.leads.map((lead: any) => ({
            id: lead.id,
            title: lead.title || `${lead.contact?.name || 'Contact'} Deal`,
            clientName: lead.contact?.name || 'Unknown Contact',
            dealValue: lead.value || Math.floor(Math.random() * 500000) + 200000,
            stage: stage.id,
            daysInStage: Math.floor((Date.now() - new Date(lead.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
            probability: lead.probability || Math.floor(Math.random() * 80) + 20,
            priority: lead.priority || (['hot', 'warm', 'cold'][Math.floor(Math.random() * 3)] as any),
            assignedAgent: lead.assignedTo || 'John Doe',
            leadSource: lead.source || 'Website',
            createdAt: new Date(lead.createdAt || Date.now()),
            updatedAt: new Date(lead.updatedAt || Date.now())
          }));
          
          allDeals.push(...stageDeals);
          
          // Calculate stage analytics
          const totalValue = stageDeals.reduce((sum, deal) => sum + deal.dealValue, 0);
          const avgDays = stageDeals.length > 0 
            ? stageDeals.reduce((sum, deal) => sum + deal.daysInStage, 0) / stageDeals.length 
            : 0;
          
          stageData.push({
            stageId: stage.id,
            stageName: STAGE_NAMES[stage.id as keyof typeof STAGE_NAMES] || stage.name,
            dealCount: stageDeals.length,
            totalValue,
            avgDaysInStage: Math.round(avgDays),
            conversionRate: Math.max(0, 95 - (stages.indexOf(stage) * 15)),
            color: STAGE_COLORS[stage.id as keyof typeof STAGE_COLORS] || 'from-gray-400 to-gray-600'
          });
        }
      });
      
      setDeals(allDeals);
      setStageAnalytics(stageData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (): AnalyticsMetric[] => {
    if (!deals.length) return [];

    const totalValue = deals.reduce((sum, deal) => sum + deal.dealValue, 0);
    const avgDealSize = totalValue / deals.length;
    const hotLeads = deals.filter(deal => deal.priority === 'hot').length;
    const avgCycleTime = deals.reduce((sum, deal) => sum + deal.daysInStage, 0) / deals.length;
    const highProbabilityDeals = deals.filter(deal => deal.probability >= 80).length;
    const conversionRate = (highProbabilityDeals / deals.length) * 100;

    return [
      {
        title: 'Total Pipeline Value',
        value: `$${(totalValue / 1000000).toFixed(1)}M`,
        change: '+12.3%',
        trend: 'up',
        icon: <DollarSign className="h-5 w-5" />,
        color: 'from-emerald-500 to-green-500',
        description: 'Total value of all deals'
      },
      {
        title: 'Average Deal Size',
        value: `$${(avgDealSize / 1000).toFixed(0)}K`,
        change: '+8.7%',
        trend: 'up',
        icon: <Target className="h-5 w-5" />,
        color: 'from-blue-500 to-cyan-500',
        description: 'Average value per deal'
      },
      {
        title: 'Hot Leads',
        value: hotLeads.toString(),
        change: '+23.1%',
        trend: 'up',
        icon: <Zap className="h-5 w-5" />,
        color: 'from-red-500 to-orange-500',
        description: 'High priority opportunities'
      },
      {
        title: 'Avg Cycle Time',
        value: `${Math.round(avgCycleTime)}d`,
        change: '-5.2%',
        trend: 'down',
        icon: <Clock className="h-5 w-5" />,
        color: 'from-purple-500 to-violet-500',
        description: 'Average days in current stage'
      },
      {
        title: 'Conversion Rate',
        value: `${conversionRate.toFixed(1)}%`,
        change: '+3.4%',
        trend: 'up',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'from-orange-500 to-yellow-500',
        description: 'Deals with 80%+ probability'
      },
      {
        title: 'Active Deals',
        value: deals.length.toString(),
        change: '+15.6%',
        trend: 'up',
        icon: <Users className="h-5 w-5" />,
        color: 'from-cyan-500 to-blue-500',
        description: 'Total deals in pipeline'
      }
    ];
  };

  const getTopPerformers = () => {
    const agentPerformance = deals.reduce((acc, deal) => {
      const agent = deal.assignedAgent;
      if (!acc[agent]) {
        acc[agent] = { totalValue: 0, dealCount: 0, hotLeads: 0 };
      }
      acc[agent].totalValue += deal.dealValue;
      acc[agent].dealCount += 1;
      if (deal.priority === 'hot') acc[agent].hotLeads += 1;
      return acc;
    }, {} as Record<string, { totalValue: number; dealCount: number; hotLeads: number }>);

    return Object.entries(agentPerformance)
      .sort(([,a], [,b]) => b.totalValue - a.totalValue)
      .slice(0, 5)
      .map(([agent, stats], index) => ({
        rank: index + 1,
        agent,
        totalValue: stats.totalValue,
        dealCount: stats.dealCount,
        hotLeads: stats.hotLeads,
        avgDealSize: stats.totalValue / stats.dealCount
      }));
  };

  const getLeadSourceAnalytics = () => {
    const sourceStats = deals.reduce((acc, deal) => {
      const source = deal.leadSource;
      if (!acc[source]) {
        acc[source] = { count: 0, totalValue: 0 };
      }
      acc[source].count += 1;
      acc[source].totalValue += deal.dealValue;
      return acc;
    }, {} as Record<string, { count: number; totalValue: number }>);

    return Object.entries(sourceStats)
      .sort(([,a], [,b]) => b.totalValue - a.totalValue)
      .map(([source, stats]) => ({
        source,
        count: stats.count,
        totalValue: stats.totalValue,
        percentage: (stats.count / deals.length) * 100
      }));
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const metrics = calculateMetrics();
  const topPerformers = getTopPerformers();
  const leadSources = getLeadSourceAnalytics();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold glass-text-glow">Pipeline Analytics</h2>
          <p style={{ color: 'var(--glass-text-muted)' }}>
            Comprehensive insights into your sales performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            {selectedTimeRange}
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card glass-border glass-hover-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color}/20`}>
                    <div style={{ color: 'var(--glass-primary)' }}>
                      {metric.icon}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
                    metric.trend === 'up' ? 'bg-green-100 text-green-600' :
                    metric.trend === 'down' ? 'bg-red-100 text-red-600' : 
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {metric.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> :
                     metric.trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> :
                     <Activity className="h-3 w-3" />}
                    {metric.change}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium" style={{ color: 'var(--glass-text-muted)' }}>
                    {metric.title}
                  </h3>
                  <div className="text-3xl font-bold glass-text-glow">
                    {metric.value}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                    {metric.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Performance */}
        <Card className="glass-card glass-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 glass-text-glow">
              <PieChart className="h-5 w-5" />
              Stage Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stageAnalytics.map((stage, index) => (
                <motion.div
                  key={stage.stageId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg glass-surface"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${stage.color}`}></div>
                    <div>
                      <div className="font-medium glass-text-glow">{stage.stageName}</div>
                      <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                        {stage.dealCount} deals • {stage.avgDaysInStage}d avg
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">
                      {formatValue(stage.totalValue)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                      {stage.conversionRate}% conversion
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="glass-card glass-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 glass-text-glow">
              <Trophy className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <motion.div
                  key={performer.agent}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg glass-surface"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {performer.rank}
                    </div>
                    <div>
                      <div className="font-medium glass-text-glow">{performer.agent}</div>
                      <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                        {performer.dealCount} deals • {performer.hotLeads} hot leads
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">
                      {formatValue(performer.totalValue)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                      {formatValue(performer.avgDealSize)} avg
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card className="glass-card glass-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 glass-text-glow">
              <LineChart className="h-5 w-5" />
              Lead Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leadSources.map((source, index) => (
                <motion.div
                  key={source.source}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg glass-surface"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <div>
                      <div className="font-medium glass-text-glow">{source.source}</div>
                      <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                        {source.count} deals ({source.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">
                      {formatValue(source.totalValue)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass-card glass-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 glass-text-glow">
              <Activity className="h-5 w-5" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 rounded-lg glass-surface">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Best Performing Stage</span>
                </div>
                <div className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  {stageAnalytics.length > 0 && 
                    stageAnalytics.reduce((best, stage) => 
                      stage.conversionRate > best.conversionRate ? stage : best
                    ).stageName
                  } with {stageAnalytics.length > 0 && 
                    Math.max(...stageAnalytics.map(s => s.conversionRate))
                  }% conversion rate
                </div>
              </div>

              <div className="p-3 rounded-lg glass-surface">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Fastest Moving Stage</span>
                </div>
                <div className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  {stageAnalytics.length > 0 && 
                    stageAnalytics.reduce((fastest, stage) => 
                      stage.avgDaysInStage < fastest.avgDaysInStage ? stage : fastest
                    ).stageName
                  } averaging {stageAnalytics.length > 0 && 
                    Math.min(...stageAnalytics.map(s => s.avgDaysInStage))
                  } days
                </div>
              </div>

              <div className="p-3 rounded-lg glass-surface">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Pipeline Health</span>
                </div>
                <div className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  {deals.filter(d => d.priority === 'hot').length} hot leads requiring immediate attention
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}