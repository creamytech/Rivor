"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Users,
  Calendar,
  ArrowRight,
  Percent,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';

interface PipelineStage {
  stage: string;
  deals: number;
  value: number;
  conversion: number;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

interface PipelineOverviewPanelProps {
  className?: string;
}

export default function PipelineOverviewPanel({ className = '' }: PipelineOverviewPanelProps) {
  const [pipelineData, setPipelineData] = useState<PipelineStage[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'funnel'>('bar');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockPipelineData: PipelineStage[] = [
          {
            stage: 'Lead',
            deals: 89,
            value: 2650000,
            conversion: 45,
            color: '#64748b',
            trend: 'up'
          },
          {
            stage: 'Qualified',
            deals: 42,
            value: 1890000,
            conversion: 65,
            color: '#3b82f6',
            trend: 'up'
          },
          {
            stage: 'Showing',
            deals: 28,
            value: 1340000,
            conversion: 75,
            color: '#8b5cf6',
            trend: 'stable'
          },
          {
            stage: 'Offer Made',
            deals: 18,
            value: 950000,
            conversion: 85,
            color: '#f59e0b',
            trend: 'up'
          },
          {
            stage: 'Under Contract',
            deals: 12,
            value: 680000,
            conversion: 90,
            color: '#f97316',
            trend: 'down'
          },
          {
            stage: 'Closed',
            deals: 8,
            value: 475000,
            conversion: 100,
            color: '#10b981',
            trend: 'up'
          }
        ];

        setPipelineData(mockPipelineData);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch pipeline data:', error);
        setIsLoading(false);
      }
    };

    fetchPipelineData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return formatCurrency(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Target className="h-4 w-4 text-slate-400" />;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border shadow-xl">
          <CardContent className="p-4">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-600 dark:text-slate-400">Deals:</span>
                <span className="font-medium">{payload[0]?.value} deals</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-600 dark:text-slate-400">Value:</span>
                <span className="font-medium">{formatCurrency(payload[1]?.value)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-gradient-to-r from-white via-purple-50/30 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-xl">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3" />
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalValue = pipelineData.reduce((sum, stage) => sum + stage.value, 0);
  const totalDeals = pipelineData.reduce((sum, stage) => sum + stage.deals, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-0 bg-gradient-to-r from-white via-purple-50/30 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-xl backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Pipeline Overview
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Deal progression and conversion analytics
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={chartType === 'bar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartType('bar')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Bar Chart
                  </Button>
                  <Button
                    variant={chartType === 'funnel' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartType('funnel')}
                  >
                    <PieChartIcon className="h-4 w-4 mr-2" />
                    Funnel
                  </Button>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant="outline" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {formatCompactCurrency(totalValue)} total
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {totalDeals} deals
                  </Badge>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chart Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="h-64 mb-8"
          >
            {chartType === 'bar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="stage" 
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                  />
                  <YAxis 
                    yAxisId="deals"
                    orientation="left"
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                  />
                  <YAxis 
                    yAxisId="value"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                    tickFormatter={(value) => formatCompactCurrency(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    yAxisId="deals"
                    dataKey="deals" 
                    fill="url(#dealsGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    yAxisId="value"
                    dataKey="value" 
                    fill="url(#valueGradient)"
                    radius={[4, 4, 0, 0]}
                    opacity={0.7}
                  />
                  
                  <defs>
                    <linearGradient id="dealsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Funnel
                    dataKey="deals"
                    data={pipelineData}
                    isAnimationActive
                  >
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Funnel>
                  <Tooltip content={<CustomTooltip />} />
                </FunnelChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Pipeline Stage Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {pipelineData.map((stage, index) => (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                className="relative p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 group"
              >
                {/* Stage Progress Indicator */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{ backgroundColor: stage.color }}
                />
                
                <div className="space-y-3">
                  {/* Stage Name */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {stage.stage}
                    </h4>
                    {getTrendIcon(stage.trend)}
                  </div>
                  
                  {/* Deals Count */}
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {stage.deals}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      deals
                    </div>
                  </div>
                  
                  {/* Value */}
                  <div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatCompactCurrency(stage.value)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      total value
                    </div>
                  </div>
                  
                  {/* Conversion Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Conversion</span>
                      <span className="font-medium">{stage.conversion}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.conversion}%` }}
                        transition={{ delay: 0.5 + (index * 0.1), duration: 0.8 }}
                        className="h-1.5 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Hover Overlay */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl pointer-events-none"
                  style={{ background: `linear-gradient(135deg, ${stage.color}40, ${stage.color}20)` }}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Pipeline Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Average Conversion */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <Percent className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                      {Math.round(pipelineData.reduce((sum, stage) => sum + stage.conversion, 0) / pipelineData.length)}%
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">Avg Conversion</div>
                  </div>
                </div>
              </div>

              {/* Pipeline Velocity */}
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-xl font-bold text-green-900 dark:text-green-100">
                      18 days
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">Avg Deal Time</div>
                  </div>
                </div>
              </div>

              {/* Weekly Target */}
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                      $380K
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">Weekly Target</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );

  function formatCompactCurrency(amount: number) {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}