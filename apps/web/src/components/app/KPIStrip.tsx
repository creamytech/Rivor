"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Trophy, 
  DollarSign, 
  Percent, 
  CheckSquare,
  Plus,
  ArrowRight,
  AlertTriangle,
  Clock
} from 'lucide-react';
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
  action?: {
    label: string;
    onClick: () => void;
    icon: React.ReactNode;
  };
}

interface KPIStripProps {
  className?: string;
  showActions?: boolean;
  compact?: boolean;
}

export default function KPIStrip({ className, showActions = true, compact = false }: KPIStripProps) {
  const [metrics, setMetrics] = useState<KPIMetric[]>([
    {
      id: 'leads',
      label: 'Leads',
      value: 247,
      change: 12.5,
      changeType: 'increase',
      target: 300,
      icon: <Target className="h-4 w-4" />,
      color: 'blue',
      trend: 'up',
      period: 'vs last week',
      action: {
        label: 'Add Lead',
        onClick: () => console.log('Add lead'),
        icon: <Plus className="h-3 w-3" />
      }
    },
    {
      id: 'deals',
      label: 'Deals',
      value: 89,
      change: 8.2,
      changeType: 'increase',
      target: 120,
      icon: <Trophy className="h-4 w-4" />,
      color: 'green',
      trend: 'up',
      period: 'vs last week',
      action: {
        label: 'Create Deal',
        onClick: () => console.log('Create deal'),
        icon: <Plus className="h-3 w-3" />
      }
    },
    {
      id: 'revenue',
      label: 'Revenue',
      value: '$2.4M',
      change: 15.3,
      changeType: 'increase',
      target: 3000000,
      icon: <DollarSign className="h-4 w-4" />,
      color: 'purple',
      trend: 'up',
      period: 'vs last month',
      action: {
        label: 'View Forecast',
        onClick: () => console.log('View forecast'),
        icon: <ArrowRight className="h-3 w-3" />
      }
    },
    {
      id: 'conversion',
      label: 'Conversion',
      value: '23.4%',
      change: -2.1,
      changeType: 'decrease',
      target: 25,
      icon: <Percent className="h-4 w-4" />,
      color: 'orange',
      trend: 'down',
      period: 'vs last month',
      action: {
        label: 'Analyze',
        onClick: () => console.log('Analyze conversion'),
        icon: <ArrowRight className="h-3 w-3" />
      }
    },
    {
      id: 'tasks',
      label: 'Tasks Due',
      value: 12,
      change: 3,
      changeType: 'increase',
      target: 5,
      icon: <CheckSquare className="h-4 w-4" />,
      color: 'red',
      trend: 'up',
      period: 'today',
      action: {
        label: 'View All',
        onClick: () => console.log('View tasks'),
        icon: <ArrowRight className="h-3 w-3" />
      }
    }
  ]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <div className="h-3 w-3" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600 dark:text-green-400';
      case 'decrease':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getProgressPercentage = (value: number | string, target?: number) => {
    if (!target) return 0;
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
    return Math.min((numValue / target) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
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
            <Card className={cn(
              "relative overflow-hidden transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
              compact ? "p-3" : "p-4"
            )}>
              <CardContent className={cn("p-0", compact ? "space-y-2" : "space-y-3")}>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-2 rounded-lg",
                      `bg-${metric.color}-100 dark:bg-${metric.color}-900/20`,
                      `text-${metric.color}-600 dark:text-${metric.color}-400`
                    )}>
                      {metric.icon}
                    </div>
                    <span className={cn(
                      "font-medium text-slate-700 dark:text-slate-300",
                      compact ? "text-sm" : "text-base"
                    )}>
                      {metric.label}
                    </span>
                  </div>
                  {showActions && metric.action && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={metric.action.onClick}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {metric.action.icon}
                    </Button>
                  )}
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-2">
                  <span className={cn(
                    "font-bold text-slate-900 dark:text-slate-100",
                    compact ? "text-xl" : "text-2xl"
                  )}>
                    {metric.value}
                  </span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend)}
                    <span className={cn(
                      "text-xs font-medium",
                      getChangeColor(metric.changeType)
                    )}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {metric.target && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Progress</span>
                      <span>{Math.round(getProgressPercentage(metric.value, metric.target))}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          `bg-${metric.color}-500`
                        )}
                        style={{ width: `${getProgressPercentage(metric.value, metric.target)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Period */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {metric.period}
                  </span>
                  {metric.id === 'tasks' && metric.value > 5 && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                </div>

                {/* Action Button */}
                {showActions && metric.action && !compact && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={metric.action.onClick}
                    className="w-full mt-2 text-xs"
                  >
                    {metric.action.icon}
                    <span className="ml-1">{metric.action.label}</span>
                  </Button>
                )}
              </CardContent>

              {/* Background Pattern */}
              <div className={cn(
                "absolute top-0 right-0 w-16 h-16 opacity-5",
                `bg-${metric.color}-500`
              )} />
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
