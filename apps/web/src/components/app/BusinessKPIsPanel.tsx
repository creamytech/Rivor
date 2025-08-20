"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Home, 
  DollarSign, 
  Calendar, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
  sparklineData: number[];
  period: string;
}

interface BusinessKPIsPanelProps {
  className?: string;
}

export default function BusinessKPIsPanel({ className = '' }: BusinessKPIsPanelProps) {
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockMetrics: KPIMetric[] = [
          {
            id: 'leads',
            label: 'Active Leads',
            value: 247,
            change: 12.5,
            changeType: 'increase',
            icon: <Users className="h-5 w-5" />,
            color: 'from-blue-500 to-cyan-500',
            sparklineData: [45, 52, 48, 61, 55, 67, 73, 69, 76, 82, 78, 89, 95, 92, 98],
            period: 'vs last month'
          },
          {
            id: 'listings',
            label: 'Active Listings',
            value: 89,
            change: 8.3,
            changeType: 'increase',
            icon: <Home className="h-5 w-5" />,
            color: 'from-emerald-500 to-teal-500',
            sparklineData: [32, 28, 35, 31, 38, 42, 39, 45, 43, 48, 52, 49, 55, 58, 61],
            period: 'vs last month'
          },
          {
            id: 'pipeline',
            label: 'Pipeline Value',
            value: '$2.4M',
            change: 15.7,
            changeType: 'increase',
            icon: <DollarSign className="h-5 w-5" />,
            color: 'from-purple-500 to-pink-500',
            sparklineData: [180, 195, 210, 198, 225, 240, 235, 258, 275, 262, 290, 305, 298, 320, 335],
            period: 'vs last month'
          },
          {
            id: 'showings',
            label: 'Showings',
            value: 34,
            change: -2.1,
            changeType: 'decrease',
            icon: <Calendar className="h-5 w-5" />,
            color: 'from-orange-500 to-red-500',
            sparklineData: [28, 32, 29, 35, 31, 38, 34, 41, 37, 44, 39, 35, 32, 29, 34],
            period: 'this week'
          },
          {
            id: 'activity',
            label: 'Recent Activity',
            value: 156,
            change: 0,
            changeType: 'neutral',
            icon: <Activity className="h-5 w-5" />,
            color: 'from-indigo-500 to-blue-500',
            sparklineData: [145, 152, 148, 159, 156, 163, 158, 165, 161, 168, 164, 171, 167, 158, 156],
            period: 'this week'
          }
        ];

        setMetrics(mockMetrics);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch KPI data:', error);
        setIsLoading(false);
      }
    };

    fetchKPIData();
  }, []);

  const renderSparkline = (data: number[], color: string, isPositive: boolean) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    const height = 40;
    const width = 120;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={`stop-opacity-20 ${color.includes('blue') ? 'stop-blue-500' : 
                color.includes('emerald') ? 'stop-emerald-500' :
                color.includes('purple') ? 'stop-purple-500' :
                color.includes('orange') ? 'stop-orange-500' :
                'stop-indigo-500'}`} />
              <stop offset="100%" className={`stop-opacity-0 ${color.includes('blue') ? 'stop-cyan-500' : 
                color.includes('emerald') ? 'stop-teal-500' :
                color.includes('purple') ? 'stop-pink-500' :
                color.includes('orange') ? 'stop-red-500' :
                'stop-blue-500'}`} />
            </linearGradient>
          </defs>
          
          {/* Fill area */}
          <polygon
            points={`0,${height} ${points} ${width},${height}`}
            fill={`url(#gradient-${color})`}
            className="opacity-30"
          />
          
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />
          
          {/* End point */}
          <circle
            cx={width}
            cy={height - ((data[data.length - 1] - min) / range) * height}
            r="3"
            fill={isPositive ? '#10b981' : '#ef4444'}
            className="drop-shadow-sm"
          />
        </svg>
      </div>
    );
  };

  const getTrendIcon = (changeType: string, change: number) => {
    if (changeType === 'increase') return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (changeType === 'decrease') return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const getChangeColor = (changeType: string) => {
    if (changeType === 'increase') return 'text-green-600 bg-green-50 border-green-200';
    if (changeType === 'decrease') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-gradient-to-r from-white via-blue-50/30 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-xl">
        <CardContent className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6 w-1/3" />
            <div className="grid grid-cols-5 gap-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-0 bg-gradient-to-r from-white via-blue-50/30 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-xl backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Business Performance
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Real-time overview of your key business metrics and trends
            </p>
          </motion.div>

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                className="relative group"
              >
                {/* Metric Container */}
                <div className="relative p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/20 hover:shadow-lg transition-all duration-300 group-hover:bg-white/80 dark:group-hover:bg-slate-800/80">
                  {/* Icon and Label */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-r ${metric.color} shadow-lg`}>
                      <div className="text-white">
                        {metric.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {metric.label}
                      </h3>
                      <Badge variant="outline" className={`text-xs ${getChangeColor(metric.changeType)}`}>
                        {getTrendIcon(metric.changeType, metric.change)}
                        <span className="ml-1">
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </span>
                      </Badge>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                      {metric.value}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {metric.period}
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="flex justify-center">
                    {renderSparkline(
                      metric.sparklineData, 
                      metric.color, 
                      metric.changeType === 'increase'
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 pointer-events-none" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="text-slate-600 dark:text-slate-400">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {metrics.filter(m => m.changeType === 'increase').length} trending up
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {metrics.filter(m => m.changeType === 'decrease').length} needs attention
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}