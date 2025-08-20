"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Activity,
  Users,
  Mail,
  Phone,
  Calendar,
  Home,
  DollarSign,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  MessageSquare,
  FileText,
  Handshake,
  Eye,
  Filter,
  RefreshCw,
  Target,
  Plus
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'lead' | 'email' | 'call' | 'meeting' | 'showing' | 'deal_update' | 'property_view' | 'task' | 'contact';
  title: string;
  description: string;
  timestamp: Date;
  agent: string;
  client?: string;
  property?: string;
  value?: number;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  color: string;
}

interface ActivityFeedPanelProps {
  className?: string;
}

interface ApiActivity {
  id: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  leadId?: string;
  contactId?: string;
  threadId?: string;
  taskId?: string;
  metadata?: any;
}

export default function ActivityFeedPanel({ className = '' }: ActivityFeedPanelProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'leads' | 'meetings' | 'deals'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      // Fetch real activity data from multiple APIs
      const [activityRes, tasksRes, dashboardRes] = await Promise.all([
        fetch('/api/activity?limit=20').then(res => res.ok ? res.json() : null),
        fetch('/api/tasks?limit=10').then(res => res.ok ? res.json() : null),
        fetch('/api/dashboard').then(res => res.ok ? res.json() : null)
      ]);

      const realActivities: ActivityItem[] = [];

      // Process activity API data
      if (activityRes?.activities) {
        activityRes.activities.forEach((activity: ApiActivity) => {
          const timestamp = new Date(activity.createdAt);
          
          let activityItem: ActivityItem = {
            id: activity.id,
            type: 'contact',
            title: 'Activity',
            description: activity.description || 'No description',
            timestamp,
            agent: 'User', // In real app, would look up user name
            icon: <Activity className="h-4 w-4" />,
            color: 'blue'
          };

          // Map activity types to our format
          switch (activity.type) {
            case 'lead_created':
              activityItem = {
                ...activityItem,
                type: 'lead',
                title: 'New Lead Created',
                description: activity.description || 'A new lead was added to the pipeline',
                icon: <Users className="h-4 w-4" />,
                color: 'blue',
                priority: 'high'
              };
              break;
            case 'email_sent':
              activityItem = {
                ...activityItem,
                type: 'email',
                title: 'Email Sent',
                description: activity.description || 'Email communication sent',
                icon: <Mail className="h-4 w-4" />,
                color: 'green'
              };
              break;
            case 'task_completed':
              activityItem = {
                ...activityItem,
                type: 'task',
                title: 'Task Completed',
                description: activity.description || 'A task was marked as complete',
                icon: <Target className="h-4 w-4" />,
                color: 'purple'
              };
              break;
            case 'contact_updated':
              activityItem = {
                ...activityItem,
                type: 'contact',
                title: 'Contact Updated',
                description: activity.description || 'Contact information was updated',
                icon: <Users className="h-4 w-4" />,
                color: 'teal'
              };
              break;
            default:
              activityItem = {
                ...activityItem,
                title: activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                description: activity.description || 'Activity recorded'
              };
          }

          realActivities.push(activityItem);
        });
      }

      // Add recent tasks as activities
      if (tasksRes?.tasks) {
        tasksRes.tasks
          .filter((task: any) => task.status === 'completed')
          .slice(0, 3)
          .forEach((task: any) => {
            realActivities.push({
              id: `task-${task.id}`,
              type: 'task',
              title: 'Task Completed',
              description: task.title || 'Task marked as complete',
              timestamp: new Date(task.completedAt || task.updatedAt),
              agent: 'User',
              icon: <Target className="h-4 w-4" />,
              color: 'indigo'
            });
          });
      }

      // Add email activities from dashboard
      if (dashboardRes?.recentThreads) {
        dashboardRes.recentThreads.slice(0, 3).forEach((thread: any) => {
          realActivities.push({
            id: `email-${thread.id}`,
            type: 'email',
            title: 'Email Thread Updated',
            description: thread.subject || 'Email conversation updated',
            timestamp: new Date(thread.lastMessageAt),
            agent: 'User',
            client: thread.participants || 'Contact',
            icon: <Mail className="h-4 w-4" />,
            color: 'green'
          });
        });
      }

      // If no real activities, create helpful placeholder activities
      if (realActivities.length === 0) {
        const welcomeActivities: ActivityItem[] = [
          {
            id: 'welcome-1',
            type: 'contact',
            title: 'Welcome to Rivor',
            description: 'Your CRM is ready to track all your real estate activities',
            timestamp: new Date(),
            agent: 'System',
            icon: <Star className="h-4 w-4" />,
            color: 'blue',
            priority: 'medium'
          },
          {
            id: 'welcome-2',
            type: 'lead',
            title: 'Getting Started',
            description: 'Add your first lead to see activity tracking in action',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            agent: 'System',
            icon: <Plus className="h-4 w-4" />,
            color: 'teal'
          }
        ];
        realActivities.push(...welcomeActivities);
      }

      // Sort by timestamp (newest first)
      realActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setActivities(realActivities);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
      
      // Fallback activities
      const fallbackActivities: ActivityItem[] = [
        {
          id: 'fallback-1',
          type: 'contact',
          title: 'System Ready',
          description: 'Your activity feed will show real-time updates here',
          timestamp: new Date(),
          agent: 'System',
          icon: <Activity className="h-4 w-4" />,
          color: 'blue'
        }
      ];
      
      setActivities(fallbackActivities);
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchActivityData();
    setIsRefreshing(false);
  };

  const getFilteredActivities = () => {
    if (filter === 'all') return activities;
    if (filter === 'leads') return activities.filter(a => a.type === 'lead');
    if (filter === 'meetings') return activities.filter(a => ['meeting', 'showing'].includes(a.type));
    if (filter === 'deals') return activities.filter(a => a.type === 'deal_update');
    return activities;
  };

  const getTimeAgo = (timestamp: Date) => {
    const minutes = Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const getActivityColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      teal: 'bg-teal-50 border-teal-200 text-teal-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low': return 'bg-slate-100 text-slate-800 border-slate-300';
      default: return '';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-gradient-to-r from-white via-emerald-50/30 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-xl">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredActivities = getFilteredActivities();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-0 bg-gradient-to-r from-white via-emerald-50/30 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-xl backdrop-blur-sm">
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
                  Live Activity Stream
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Recent leads, activity updates, and live business feed
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Filter Buttons */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {['all', 'leads', 'meetings', 'deals'].map((filterType) => (
                    <Button
                      key={filterType}
                      variant={filter === filterType ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter(filterType as any)}
                      className="h-8 px-3 text-xs"
                    >
                      {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-4 max-h-96 overflow-y-auto pr-2"
          >
            <AnimatePresence>
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                    className="relative group"
                  >
                    <div className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${getActivityColor(activity.color)}`}>
                      {/* Activity Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getActivityColor(activity.color)} shadow-sm`}>
                            {activity.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                {activity.title}
                              </h4>
                              {activity.priority && (
                                <Badge className={`text-xs ${getPriorityBadge(activity.priority)}`}>
                                  <Star className="h-2 w-2 mr-1" />
                                  {activity.priority}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {activity.description}
                            </p>
                          </div>
                        </div>
                        
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          <Clock className="h-3 w-3 mr-1" />
                          {getTimeAgo(activity.timestamp)}
                        </Badge>
                      </div>

                      {/* Activity Details */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {activity.agent.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-slate-600 dark:text-slate-400">{activity.agent}</span>
                          </div>
                          
                          {activity.client && (
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <Users className="h-3 w-3" />
                              <span>{activity.client}</span>
                            </div>
                          )}
                          
                          {activity.property && (
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-32">{activity.property}</span>
                            </div>
                          )}
                          
                          {activity.value && (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                              <DollarSign className="h-3 w-3" />
                              <span>{formatCurrency(activity.value)}</span>
                            </div>
                          )}
                        </div>
                        
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                // Empty state for filtered results
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                    No {filter === 'all' ? '' : filter} activities
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {filter === 'all' 
                      ? 'Activities will appear here as you use the CRM'
                      : `No ${filter} activities found. Try changing the filter.`
                    }
                  </p>
                </div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Activity Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      {activities.filter(a => a.type === 'lead').length}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">New Leads</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-lg font-bold text-green-900 dark:text-green-100">
                      {activities.filter(a => a.type === 'email').length}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">Emails Sent</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      {activities.filter(a => a.type === 'task').length}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">Tasks Done</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                      {activities.length}
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">Total Actions</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}