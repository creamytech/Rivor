"use client";

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import AppShell from "@/components/app/AppShell";
import MobileDashboard from "@/components/app/MobileDashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Home,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  MessageSquare,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Activity,
  Zap,
  Star,
  Filter,
  RefreshCw,
  MoreHorizontal
} from "lucide-react";

interface DashboardMetric {
  id: string;
  label: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
  period: string;
}

interface RecentActivity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'deal' | 'task';
  title: string;
  description: string;
  time: string;
  status: 'completed' | 'pending' | 'overdue';
  contact?: string;
  value?: number;
}

interface UpcomingTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  type: 'call' | 'meeting' | 'follow-up' | 'viewing' | 'paperwork';
  contact?: string;
  completed: boolean;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Mock data - in real app this would come from APIs
      const mockMetrics: DashboardMetric[] = [
        {
          id: 'active-leads',
          label: 'Active Leads',
          value: 24,
          change: 12.5,
          changeType: 'increase',
          icon: <Users className="h-5 w-5" />,
          color: 'from-blue-500 to-cyan-500',
          period: 'vs last month'
        },
        {
          id: 'properties-sold',
          label: 'Properties Sold',
          value: 8,
          change: 25.0,
          changeType: 'increase',
          icon: <Home className="h-5 w-5" />,
          color: 'from-green-500 to-emerald-500',
          period: 'this month'
        },
        {
          id: 'total-revenue',
          label: 'Total Revenue',
          value: '$245,000',
          change: 8.3,
          changeType: 'increase',
          icon: <DollarSign className="h-5 w-5" />,
          color: 'from-purple-500 to-pink-500',
          period: 'this quarter'
        },
        {
          id: 'avg-deal-size',
          label: 'Avg Deal Size',
          value: '$425,000',
          change: -5.2,
          changeType: 'decrease',
          icon: <Target className="h-5 w-5" />,
          color: 'from-orange-500 to-red-500',
          period: 'vs last quarter'
        },
        {
          id: 'unread-emails',
          label: 'Unread Emails',
          value: 12,
          change: 0,
          changeType: 'neutral',
          icon: <Mail className="h-5 w-5" />,
          color: 'from-indigo-500 to-blue-500',
          period: 'current'
        },
        {
          id: 'scheduled-meetings',
          label: 'Today\'s Meetings',
          value: 5,
          change: 15.4,
          changeType: 'increase',
          icon: <Calendar className="h-5 w-5" />,
          color: 'from-teal-500 to-green-500',
          period: 'today'
        }
      ];

      const mockActivities: RecentActivity[] = [
        {
          id: '1',
          type: 'email',
          title: 'New inquiry from Sarah Johnson',
          description: 'Interested in 123 Oak Street Property - wants to schedule viewing',
          time: '2 hours ago',
          status: 'pending',
          contact: 'Sarah Johnson',
          value: 450000
        },
        {
          id: '2',
          type: 'call',
          title: 'Follow-up call with Michael Chen',
          description: 'Discussed property appraisal timeline and closing details',
          time: '4 hours ago',
          status: 'completed',
          contact: 'Michael Chen'
        },
        {
          id: '3',
          type: 'deal',
          title: 'Offer accepted on Maple Street',
          description: 'Emma Rodriguez accepted our client\'s offer of $520,000',
          time: '1 day ago',
          status: 'completed',
          contact: 'Emma Rodriguez',
          value: 520000
        },
        {
          id: '4',
          type: 'meeting',
          title: 'Property showing scheduled',
          description: 'David Park - Investment portfolio review meeting',
          time: '2 days ago',
          status: 'completed',
          contact: 'David Park'
        },
        {
          id: '5',
          type: 'task',
          title: 'Market analysis report',
          description: 'Complete quarterly market analysis for downtown area',
          time: '3 days ago',
          status: 'overdue'
        }
      ];

      const mockTasks: UpcomingTask[] = [
        {
          id: '1',
          title: 'Property viewing with Johnson family',
          description: 'Show 123 Oak Street property at 2:00 PM',
          dueDate: 'Today, 2:00 PM',
          priority: 'high',
          type: 'viewing',
          contact: 'Sarah Johnson',
          completed: false
        },
        {
          id: '2',
          title: 'Follow up on Chen appraisal',
          description: 'Check status of property appraisal for Pine Avenue',
          dueDate: 'Today, 4:30 PM',
          priority: 'high',
          type: 'call',
          contact: 'Michael Chen',
          completed: false
        },
        {
          id: '3',
          title: 'Prepare closing documents',
          description: 'Finalize paperwork for Maple Street closing',
          dueDate: 'Tomorrow, 9:00 AM',
          priority: 'medium',
          type: 'paperwork',
          contact: 'Emma Rodriguez',
          completed: false
        },
        {
          id: '4',
          title: 'Investment property consultation',
          description: 'Meet with David Park to discuss new opportunities',
          dueDate: 'Tomorrow, 3:00 PM',
          priority: 'medium',
          type: 'meeting',
          contact: 'David Park',
          completed: false
        },
        {
          id: '5',
          title: 'Send weekly market update',
          description: 'Prepare and send market analysis to all clients',
          dueDate: 'Friday, 10:00 AM',
          priority: 'low',
          type: 'follow-up',
          completed: false
        }
      ];

      setTimeout(() => {
        setMetrics(mockMetrics);
        setRecentActivities(mockActivities);
        setUpcomingTasks(mockTasks);
        setLoading(false);
      }, 800);
    };

    fetchDashboardData();
  }, []);

  const toggleTask = (taskId: string) => {
    setUpcomingTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'deal': return <Home className="h-4 w-4" />;
      case 'task': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-600';
      case 'call': return 'bg-green-100 text-green-600';
      case 'meeting': return 'bg-purple-100 text-purple-600';
      case 'deal': return 'bg-emerald-100 text-emerald-600';
      case 'task': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'viewing': return <Eye className="h-4 w-4" />;
      case 'paperwork': return <CheckCircle className="h-4 w-4" />;
      case 'follow-up': return <MessageSquare className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (status === "loading") {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center ${
          theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'
        }`}
      >
        <div className="text-center glass-card p-8">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: 'var(--glass-primary)' }}
          ></div>
          <p style={{ color: 'var(--glass-text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session && process.env.NODE_ENV !== 'development') {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center ${
          theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'
        }`}
      >
        <div className="text-center glass-card p-8">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--glass-text)' }}>
            Not Authenticated
          </h1>
          <p style={{ color: 'var(--glass-text-muted)' }}>
            Please sign in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Mobile view
  if (isMobile) {
    return (
      <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
        <AppShell>
          <MobileDashboard />
        </AppShell>
      </div>
    );
  }

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        {/* Header */}
        <div className="px-4 mt-4 mb-2 main-content-area">
          <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl glass-card">
                  <BarChart3 className="h-6 w-6" style={{ color: 'var(--glass-primary)' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--glass-text)' }}>
                    Dashboard
                  </h1>
                  <p style={{ color: 'var(--glass-text-secondary)' }}>
                    Welcome back! Here's what's happening today.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="liquid" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="liquid" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </div>
          </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 pb-4 space-y-4 main-content-area">
          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))
            ) : (
              metrics.map((metric) => (
                <div
                  key={metric.id}
                  className={`glass-card p-6 cursor-pointer transition-all duration-200 ${
                    selectedMetric === metric.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedMetric(selectedMetric === metric.id ? null : metric.id)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${metric.color} text-white`}>
                      {metric.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--glass-text-secondary)' }}>
                        {metric.label}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {metric.changeType === 'increase' ? (
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                        ) : metric.changeType === 'decrease' ? (
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                        ) : null}
                        <span className={`text-xs font-medium ${
                          metric.changeType === 'increase' ? 'text-green-600' :
                          metric.changeType === 'decrease' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-2xl font-bold" style={{ color: 'var(--glass-text)' }}>
                      {metric.value}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                      {metric.period}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Activity */}
            <div className="lg:col-span-2 glass-card">
              <div className="p-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--glass-text)' }}>
                    Recent Activity
                  </h3>
                  <Button variant="liquid" size="sm" onClick={() => router.push('/app/inbox')}>
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 mx-auto mb-4" style={{ color: 'var(--glass-text-muted)' }} />
                    <p style={{ color: 'var(--glass-text-muted)' }}>No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate" style={{ color: 'var(--glass-text)' }}>
                                {activity.title}
                              </p>
                              <p className="text-sm truncate" style={{ color: 'var(--glass-text-muted)' }}>
                                {activity.description}
                              </p>
                              {activity.contact && (
                                <p className="text-xs" style={{ color: 'var(--glass-text-secondary)' }}>
                                  Contact: {activity.contact}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {activity.value && (
                                <Badge variant="liquid" className="text-xs">
                                  ${activity.value.toLocaleString()}
                                </Badge>
                              )}
                              <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                                {activity.time}
                              </span>
                              <Badge className={`${
                                activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                                activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              } text-xs border-0`}>
                                {activity.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="glass-card">
              <div className="p-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--glass-text)' }}>
                    Today's Tasks
                  </h3>
                  <Button variant="liquid" size="sm" onClick={() => router.push('/app/tasks')}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : upcomingTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-8 w-8 mx-auto mb-4" style={{ color: 'var(--glass-text-muted)' }} />
                    <p style={{ color: 'var(--glass-text-muted)' }}>No tasks for today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="space-y-2">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task.id)}
                            className="mt-1 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`p-1 rounded ${getActivityColor(task.type)}`}>
                                {getTaskIcon(task.type)}
                              </div>
                              <p className={`font-medium text-sm truncate ${
                                task.completed ? 'line-through opacity-60' : ''
                              }`} style={{ color: 'var(--glass-text)' }}>
                                {task.title}
                              </p>
                            </div>
                            <p className={`text-xs truncate ${
                              task.completed ? 'line-through opacity-60' : ''
                            }`} style={{ color: 'var(--glass-text-muted)' }}>
                              {task.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={`${getPriorityColor(task.priority)} text-xs border-0`}>
                                {task.priority}
                              </Badge>
                              <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                                {task.dueDate}
                              </span>
                              {task.contact && (
                                <span className="text-xs" style={{ color: 'var(--glass-text-secondary)' }}>
                                  {task.contact}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--glass-text)' }}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { icon: <Plus className="h-5 w-5" />, label: 'Add Contact', color: 'from-blue-500 to-cyan-500', route: '/app/contacts' },
                { icon: <Home className="h-5 w-5" />, label: 'New Listing', color: 'from-green-500 to-emerald-500', route: '/app/pipeline' },
                { icon: <Calendar className="h-5 w-5" />, label: 'Schedule Meeting', color: 'from-purple-500 to-pink-500', route: '/app/calendar' },
                { icon: <Mail className="h-5 w-5" />, label: 'Send Email', color: 'from-orange-500 to-red-500', route: '/app/inbox' },
                { icon: <Phone className="h-5 w-5" />, label: 'Make Call', color: 'from-teal-500 to-green-500', route: '/app/contacts' },
                { icon: <BarChart3 className="h-5 w-5" />, label: 'View Reports', color: 'from-indigo-500 to-blue-500', route: '/app/reporting' }
              ].map((action, index) => (
                <Button
                  key={index}
                  variant="liquid"
                  className="h-20 flex-col gap-2 p-4"
                  onClick={() => router.push(action.route)}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} text-white`}>
                    {action.icon}
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  );
}