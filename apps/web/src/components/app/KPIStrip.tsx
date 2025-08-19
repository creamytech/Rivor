"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Target, Trophy, DollarSign, Percent, CheckSquare, Plus, ArrowRight, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  target?: number;
  icon: React.ReactNode;
  color: string;
  trend: 'up' | 'down' | 'stable';
  period: string;
  action?: { label: string; onClick: () => void; icon: React.ReactNode; };
}

interface KPIStripProps {
  className?: string;
  showActions?: boolean;
  compact?: boolean;
}

export default function KPIStrip({ className, showActions = true, compact = false }: KPIStripProps) {
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const data = await response.json();
          
          // Transform real data into KPI metrics
          const realMetrics: KPIMetric[] = [
            {
              id: 'leads',
              label: 'Active Leads',
              value: data.totalActiveLeads || 0,
              change: 0, // We'll need to calculate this from historical data
              changeType: 'neutral',
              icon: <Target className="h-4 w-4" />,
              color: 'bg-blue-500',
              trend: 'stable',
              period: 'vs last week'
            },
            {
              id: 'deals',
              label: 'Pipeline Value',
              value: data.pipelineStats?.totalValue ? `$${(data.pipelineStats.totalValue / 1000).toFixed(0)}k` : '$0',
              change: 0,
              changeType: 'neutral',
              icon: <Trophy className="h-4 w-4" />,
              color: 'bg-green-500',
              trend: 'stable',
              period: 'vs last week'
            },
            {
              id: 'revenue',
              label: 'Revenue',
              value: data.pipelineStats?.closedValue ? `$${(data.pipelineStats.closedValue / 1000).toFixed(0)}k` : '$0',
              change: 0,
              changeType: 'neutral',
              icon: <DollarSign className="h-4 w-4" />,
              color: 'bg-emerald-500',
              trend: 'stable',
              period: 'this month'
            },
            {
              id: 'conversion',
              label: 'Win Rate',
              value: data.pipelineStats?.winRate ? `${data.pipelineStats.winRate}%` : '0%',
              change: 0,
              changeType: 'neutral',
              icon: <Percent className="h-4 w-4" />,
              color: 'bg-purple-500',
              trend: 'stable',
              period: 'vs last month'
            },
            {
              id: 'tasks',
              label: 'Tasks Due',
              value: data.tasksDue || 0,
              change: 0,
              changeType: 'neutral',
              icon: <CheckSquare className="h-4 w-4" />,
              color: 'bg-orange-500',
              trend: 'stable',
              period: 'today'
            }
          ];
          
          setMetrics(realMetrics);
        } else {
          // Fallback to empty metrics if API fails
          setMetrics([]);
        }
      } catch (error) {
        console.error('Failed to fetch KPI data:', error);
        setMetrics([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKPIData();
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-slate-400" />;
    }
  };

  const getProgressColor = (change: number) => {
    if (change > 0) return 'bg-green-500';
    if (change < 0) return 'bg-red-500';
    return 'bg-slate-300';
  };

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-slate-200 rounded mb-2"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-slate-500">No KPI data available</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", className)}>
      <AnimatePresence>
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className={cn("p-4", compact && "p-3")}>
                {/* Background accent */}
                <div className={cn("absolute top-0 left-0 w-1 h-full", metric.color)} />
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Label */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("p-1.5 rounded-lg", metric.color.replace('bg-', 'bg-').replace('-500', '-100'))}>
                        <div className={cn("text-white", metric.color)}>
                          {metric.icon}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {metric.label}
                      </span>
                    </div>
                    
                    {/* Value */}
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                      {metric.value}
                    </div>
                    
                    {/* Change indicator */}
                    <div className="flex items-center gap-2">
                      {getTrendIcon(metric.trend)}
                      <span className={cn(
                        "text-xs font-medium",
                        metric.changeType === 'increase' && "text-green-600 dark:text-green-400",
                        metric.changeType === 'decrease' && "text-red-600 dark:text-red-400",
                        metric.changeType === 'neutral' && "text-slate-500 dark:text-slate-400"
                      )}>
                        {metric.change > 0 ? '+' : ''}{metric.change}% {metric.period}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action button */}
                  {showActions && metric.action && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={metric.action.onClick}
                      className="ml-2"
                    >
                      {metric.action.icon}
                    </Button>
                  )}
                </div>
                
                {/* Progress bar for target */}
                {metric.target && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((Number(metric.value) / metric.target) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className={cn("h-1.5 rounded-full transition-all", getProgressColor(metric.change))}
                        style={{ width: `${Math.min((Number(metric.value) / metric.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
