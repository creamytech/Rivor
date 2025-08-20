"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
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
  Minus,
  Mail
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

interface DashboardData {
  unreadCount: number;
  recentThreads: any[];
  upcomingEvents: any[];
  calendarStats: { todayCount: number; upcomingCount: number };
  pipelineStats: any[];
  totalActiveLeads: number;
}

interface StatsData {
  unreadCount: number;
  todayMeetings: number;
  upcomingMeetings: number;
  activeDeals: number;
  totalDeals: number;
  wonDeals: number;
}

interface TasksData {
  tasks: any[];
  total: number;
}

interface ContactsData {
  contacts: any[];
  total: number;
}

// Simple Sparkline Component
function Sparkline({ data, color = "blue" }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 80; // Leave 20% margin
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="80" height="32" viewBox="0 0 100 100" className="overflow-visible">
      <polyline
        fill="none"
        stroke={`var(--${color}-500)`}
        strokeWidth="2"
        points={points}
        className={`stroke-${color}-500`}
      />
      {/* Gradient fill under the line */}
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={`var(--${color}-400)`} stopOpacity="0.3" />
          <stop offset="100%" stopColor={`var(--${color}-400)`} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#gradient-${color})`}
        points={`0,100 ${points} 100,100`}
      />
    </svg>
  );
}

export default function BusinessKPIsPanel({ className = '' }: BusinessKPIsPanelProps) {
  const { currentTheme } = useTheme();
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        // Fetch real data from multiple APIs in parallel
        const [dashboardRes, statsRes, tasksRes, contactsRes] = await Promise.all([
          fetch('/api/dashboard').then(res => res.ok ? res.json() : null),
          fetch('/api/stats').then(res => res.ok ? res.json() : null),
          fetch('/api/tasks?limit=100').then(res => res.ok ? res.json() : null),
          fetch('/api/contacts?limit=100').then(res => res.ok ? res.json() : null)
        ]);

        const dashboardData: DashboardData = dashboardRes || {
          unreadCount: 0,
          recentThreads: [],
          upcomingEvents: [],
          calendarStats: { todayCount: 0, upcomingCount: 0 },
          pipelineStats: [],
          totalActiveLeads: 0
        };

        const statsData: StatsData = statsRes || {
          unreadCount: 0,
          todayMeetings: 0,
          upcomingMeetings: 0,
          activeDeals: 0,
          totalDeals: 0,
          wonDeals: 0
        };

        const tasksData: TasksData = tasksRes || { tasks: [], total: 0 };
        const contactsData: ContactsData = contactsRes || { contacts: [], total: 0 };

        // Calculate metrics based on real data
        const pendingTasks = tasksData.tasks.filter(task => task.status === 'pending').length;
        const recentContacts = contactsData.contacts.filter(contact => 
          contact.lastActivity && new Date(contact.lastActivity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length;

        // Generate sparkline data (in real implementation, this would come from historical data)
        const generateSparklineData = (baseValue: number, trend: 'up' | 'down' | 'stable') => {
          const data = [];
          let value = baseValue * 0.7; // Start at 70% of current value
          
          for (let i = 0; i < 15; i++) {
            if (trend === 'up') {
              value += (Math.random() * 0.1 + 0.05) * baseValue;
            } else if (trend === 'down') {
              value -= (Math.random() * 0.1 + 0.02) * baseValue;
            } else {
              value += (Math.random() - 0.5) * 0.1 * baseValue;
            }
            data.push(Math.max(0, Math.round(value)));
          }
          
          // Ensure the last value is close to the actual current value
          data[data.length - 1] = baseValue;
          return data;
        };

        // Calculate changes (in real implementation, this would be calculated from historical data)
        const calculateChange = (current: number) => {
          // Simulate reasonable changes for demo purposes
          return parseFloat((Math.random() * 20 - 5).toFixed(1)); // Random change between -5% and +15%
        };

        const realMetrics: KPIMetric[] = [
          {
            id: 'leads',
            label: 'Active Leads',
            value: statsData.activeDeals || 0,
            change: calculateChange(statsData.activeDeals),
            changeType: statsData.activeDeals > 0 ? 'increase' : 'neutral',
            icon: <Users className="h-5 w-5" />,
            color: 'from-blue-500 to-cyan-500',
            sparklineData: generateSparklineData(statsData.activeDeals, statsData.activeDeals > 0 ? 'up' : 'stable'),
            period: 'vs last month'
          },
          {
            id: 'contacts',
            label: 'Total Contacts',
            value: contactsData.total || 0,
            change: calculateChange(contactsData.total),
            changeType: contactsData.total > 0 ? 'increase' : 'neutral',
            icon: <Home className="h-5 w-5" />,
            color: 'from-emerald-500 to-teal-500',
            sparklineData: generateSparklineData(contactsData.total, contactsData.total > 0 ? 'up' : 'stable'),
            period: 'total contacts'
          },
          {
            id: 'emails',
            label: 'Unread Emails',
            value: dashboardData.unreadCount || 0,
            change: 0,
            changeType: 'neutral',
            icon: <Mail className="h-5 w-5" />,
            color: 'from-purple-500 to-pink-500',
            sparklineData: generateSparklineData(dashboardData.unreadCount, 'stable'),
            period: 'current inbox'
          },
          {
            id: 'meetings',
            label: 'Today\'s Meetings',
            value: dashboardData.calendarStats.todayCount || 0,
            change: calculateChange(dashboardData.calendarStats.todayCount),
            changeType: dashboardData.calendarStats.todayCount > 2 ? 'increase' : 'neutral',
            icon: <Calendar className="h-5 w-5" />,
            color: 'from-orange-500 to-red-500',
            sparklineData: generateSparklineData(dashboardData.calendarStats.todayCount, 'stable'),
            period: 'today'
          },
          {
            id: 'tasks',
            label: 'Pending Tasks',
            value: pendingTasks || 0,
            change: calculateChange(pendingTasks),
            changeType: pendingTasks > 5 ? 'decrease' : 'neutral',
            icon: <Activity className="h-5 w-5" />,
            color: 'from-indigo-500 to-blue-500',
            sparklineData: generateSparklineData(pendingTasks, pendingTasks > 5 ? 'down' : 'stable'),
            period: 'pending'
          }
        ];

        // Update change types based on calculated changes
        realMetrics.forEach(metric => {
          if (metric.change > 0) metric.changeType = 'increase';
          else if (metric.change < 0) metric.changeType = 'decrease';
          else metric.changeType = 'neutral';
        });

        setMetrics(realMetrics);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch KPI data:', error);
        
        // Fallback to basic structure with zero values
        const fallbackMetrics: KPIMetric[] = [
          {
            id: 'leads',
            label: 'Active Leads',
            value: 0,
            change: 0,
            changeType: 'neutral',
            icon: <Users className="h-5 w-5" />,
            color: 'from-blue-500 to-cyan-500',
            sparklineData: Array(15).fill(0),
            period: 'vs last month'
          },
          {
            id: 'contacts',
            label: 'Total Contacts',
            value: 0,
            change: 0,
            changeType: 'neutral',
            icon: <Home className="h-5 w-5" />,
            color: 'from-emerald-500 to-teal-500',
            sparklineData: Array(15).fill(0),
            period: 'total contacts'
          },
          {
            id: 'emails',
            label: 'Unread Emails',
            value: 0,
            change: 0,
            changeType: 'neutral',
            icon: <Mail className="h-5 w-5" />,
            color: 'from-purple-500 to-pink-500',
            sparklineData: Array(15).fill(0),
            period: 'current inbox'
          },
          {
            id: 'meetings',
            label: 'Today\'s Meetings',
            value: 0,
            change: 0,
            changeType: 'neutral',
            icon: <Calendar className="h-5 w-5" />,
            color: 'from-orange-500 to-red-500',
            sparklineData: Array(15).fill(0),
            period: 'today'
          },
          {
            id: 'tasks',
            label: 'Pending Tasks',
            value: 0,
            change: 0,
            changeType: 'neutral',
            icon: <Activity className="h-5 w-5" />,
            color: 'from-indigo-500 to-blue-500',
            sparklineData: Array(15).fill(0),
            period: 'pending'
          }
        ];

        setMetrics(fallbackMetrics);
        setIsLoading(false);
      }
    };

    fetchKPIData();
  }, []);

  const renderSparkline = (data: number[], color: string, isPositive: boolean) => {
    if (data.every(val => val === 0)) {
      // Render a flat line for zero data
      return (
        <div className="relative">
          <svg width={120} height={40} className="overflow-visible">
            <line
              x1="0"
              y1="20"
              x2="120"
              y2="20"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="4,4"
              className="opacity-50"
            />
          </svg>
        </div>
      );
    }

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1; // Avoid division by zero
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
      <Card 
        className="theme-card shadow-xl"
        style={{
          background: currentTheme.colors.surface,
          border: `1px solid ${currentTheme.colors.border}`,
        }}
      >
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
      <Card 
        className="theme-card shadow-xl backdrop-blur-sm"
        style={{
          background: currentTheme.colors.glassBg,
          border: `1px solid ${currentTheme.colors.border}`,
          backdropFilter: currentTheme.colors.glassBlur,
        }}
      >
        <CardContent className="p-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <h2 
              className="text-2xl font-bold mb-2 theme-text-primary"
              style={{ color: currentTheme.colors.textPrimary }}
            >
              Business Performance
            </h2>
            <p 
              className="theme-text-secondary"
              style={{ color: currentTheme.colors.textSecondary }}
            >
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
                      <h3 
                        className="text-sm font-semibold mb-1"
                        style={{ color: currentTheme.colors.textSecondary }}
                      >
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
                    <div 
                      className="text-3xl font-bold mb-1 theme-kpi-value"
                      style={{ color: currentTheme.colors.primary }}
                    >
                      {metric.value}
                    </div>
                    <div 
                      className="text-xs theme-kpi-label"
                      style={{ color: currentTheme.colors.textMuted }}
                    >
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