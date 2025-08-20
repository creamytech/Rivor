"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock,
  Mail,
  Calendar,
  Phone,
  AlertTriangle,
  Star,
  Users,
  Home,
  ArrowRight,
  CheckCircle2,
  Circle,
  Bell,
  Target
} from 'lucide-react';

interface FocusItem {
  id: string;
  type: 'lead' | 'reply' | 'meeting' | 'showing' | 'deadline' | 'task';
  title: string;
  description: string;
  time?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  completed: boolean;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface TodaysSummary {
  newLeads: number;
  repliesDue: number;
  meetingsScheduled: number;
  pendingTasks: number;
}

interface TodaysFocusPanelProps {
  className?: string;
}

export default function TodaysFocusPanel({ className = '' }: TodaysFocusPanelProps) {
  const [summary, setSummary] = useState<TodaysSummary>({ newLeads: 0, repliesDue: 0, meetingsScheduled: 0, pendingTasks: 0 });
  const [focusItems, setFocusItems] = useState<FocusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTodayData = async () => {
      try {
        // Fetch real data from multiple APIs in parallel
        const [dashboardRes, tasksRes, statsRes] = await Promise.all([
          fetch('/api/dashboard').then(res => res.ok ? res.json() : null),
          fetch('/api/tasks?limit=50').then(res => res.ok ? res.json() : null),
          fetch('/api/stats').then(res => res.ok ? res.json() : null)
        ]);

        const dashboardData = dashboardRes || {
          unreadCount: 0,
          recentThreads: [],
          upcomingEvents: [],
          calendarStats: { todayCount: 0, upcomingCount: 0 }
        };

        const tasksData = tasksRes || { tasks: [], total: 0 };
        const statsData = statsRes || { activeDeals: 0, todayMeetings: 0 };

        // Calculate today's data
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

        // Filter tasks for today
        const todayTasks = tasksData.tasks.filter((task: any) => {
          if (!task.dueAt) return false;
          const dueDate = new Date(task.dueAt);
          return dueDate >= startOfDay && dueDate < endOfDay && task.status === 'pending';
        });

        // Get urgent/overdue tasks
        const urgentTasks = tasksData.tasks.filter((task: any) => {
          if (task.status !== 'pending') return false;
          if (task.priority === 'high') return true;
          if (task.dueAt) {
            const dueDate = new Date(task.dueAt);
            return dueDate < new Date(); // Overdue
          }
          return false;
        });

        // Today's events
        const todayEvents = dashboardData.upcomingEvents.filter((event: any) => {
          const eventDate = new Date(event.start);
          return eventDate >= startOfDay && eventDate < endOfDay;
        });

        // Recent unread emails (simulate reply urgency)
        const recentThreads = dashboardData.recentThreads.slice(0, 3);

        // Build summary
        const realSummary: TodaysSummary = {
          newLeads: statsData.activeDeals || 0,
          repliesDue: Math.min(dashboardData.unreadCount || 0, 15), // Cap for display
          meetingsScheduled: dashboardData.calendarStats.todayCount || 0,
          pendingTasks: todayTasks.length
        };

        // Build focus items from real data
        const realFocusItems: FocusItem[] = [];

        // Add urgent tasks
        urgentTasks.slice(0, 3).forEach((task: any, index: number) => {
          realFocusItems.push({
            id: `task-${task.id}`,
            type: 'task',
            title: task.title || 'Untitled Task',
            description: task.description || 'No description available',
            time: task.dueAt ? new Date(task.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
            priority: task.priority === 'high' ? 'urgent' : 'high',
            completed: task.status === 'completed',
            icon: <Target className="h-4 w-4" />,
            action: { 
              label: 'View', 
              onClick: () => window.location.href = `/app/tasks/${task.id}` 
            }
          });
        });

        // Add recent email threads that need replies
        recentThreads.slice(0, 2).forEach((thread: any, index: number) => {
          realFocusItems.push({
            id: `email-${thread.id}`,
            type: 'reply',
            title: `Reply to ${thread.participants || 'Contact'}`,
            description: thread.subject || 'No subject',
            time: new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            priority: 'high',
            completed: false,
            icon: <Mail className="h-4 w-4" />,
            action: { 
              label: 'Reply', 
              onClick: () => window.location.href = `/app/inbox/${thread.id}` 
            }
          });
        });

        // Add today's meetings
        todayEvents.slice(0, 3).forEach((event: any, index: number) => {
          realFocusItems.push({
            id: `meeting-${event.id}`,
            type: 'meeting',
            title: event.title || 'Meeting',
            description: event.location ? `at ${event.location}` : 'No location specified',
            time: new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            priority: 'medium',
            completed: false,
            icon: <Calendar className="h-4 w-4" />,
            action: { 
              label: 'Details', 
              onClick: () => window.location.href = `/app/calendar` 
            }
          });
        });

        // Add today's tasks
        todayTasks.slice(0, 2).forEach((task: any, index: number) => {
          if (!realFocusItems.find(item => item.id === `task-${task.id}`)) {
            realFocusItems.push({
              id: `task-today-${task.id}`,
              type: 'task',
              title: task.title || 'Task',
              description: task.description || 'Scheduled for today',
              time: task.dueAt ? new Date(task.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
              priority: 'medium',
              completed: task.status === 'completed',
              icon: <CheckCircle2 className="h-4 w-4" />,
              action: { 
                label: 'Complete', 
                onClick: () => console.log('Complete task:', task.id) 
              }
            });
          }
        });

        // If no real data, add helpful placeholder items
        if (realFocusItems.length === 0) {
          realFocusItems.push({
            id: 'welcome',
            type: 'task',
            title: 'Welcome to Rivor',
            description: 'Set up your first lead or import contacts to get started',
            priority: 'medium',
            completed: false,
            icon: <Users className="h-4 w-4" />,
            action: { 
              label: 'Get Started', 
              onClick: () => window.location.href = '/app/contacts' 
            }
          });
        }

        setSummary(realSummary);
        setFocusItems(realFocusItems);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch today\'s data:', error);
        
        // Fallback data
        setSummary({ newLeads: 0, repliesDue: 0, meetingsScheduled: 0, pendingTasks: 0 });
        setFocusItems([{
          id: 'fallback',
          type: 'task',
          title: 'Connect your accounts',
          description: 'Connect email and calendar to see your daily priorities',
          priority: 'medium',
          completed: false,
          icon: <Users className="h-4 w-4" />,
          action: { 
            label: 'Settings', 
            onClick: () => window.location.href = '/app/settings' 
          }
        }]);
        setIsLoading(false);
      }
    };

    fetchTodayData();
  }, []);

  const toggleItemComplete = async (itemId: string) => {
    setFocusItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );

    // If it's a task, update the backend
    if (itemId.startsWith('task-')) {
      const taskId = itemId.replace('task-', '').replace('task-today-', '');
      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });
      } catch (error) {
        console.error('Failed to update task:', error);
        // Revert on error
        setFocusItems(prev => 
          prev.map(item => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
          )
        );
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-300 bg-red-50 text-red-700';
      case 'high': return 'border-orange-300 bg-orange-50 text-orange-700';
      case 'medium': return 'border-blue-300 bg-blue-50 text-blue-700';
      case 'low': return 'border-slate-300 bg-slate-50 text-slate-700';
      default: return 'border-slate-300 bg-slate-50 text-slate-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lead': return <Users className="h-5 w-5 text-blue-600" />;
      case 'reply': return <Mail className="h-5 w-5 text-green-600" />;
      case 'meeting': return <Calendar className="h-5 w-5 text-purple-600" />;
      case 'showing': return <Home className="h-5 w-5 text-orange-600" />;
      case 'deadline': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'task': return <Target className="h-5 w-5 text-indigo-600" />;
      default: return <Clock className="h-5 w-5 text-slate-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-gradient-to-r from-white via-emerald-50/30 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-xl">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3" />
            <div className="grid grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const urgentItems = focusItems.filter(item => item.priority === 'urgent' && !item.completed);
  const otherItems = focusItems.filter(item => item.priority !== 'urgent' && !item.completed);

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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Today's Focus
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Your priorities and action items for today
            </p>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{summary.newLeads}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">Active Leads</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{summary.repliesDue}</div>
                  <div className="text-xs text-green-600 dark:text-green-400">Unread Emails</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{summary.meetingsScheduled}</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">Today's Meetings</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-800"
            >
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{summary.pendingTasks}</div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">Pending Tasks</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* What Needs Your Attention */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="space-y-6"
          >
            {/* Urgent Items */}
            {urgentItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Needs Immediate Attention
                  </h3>
                  <Badge className="bg-red-100 text-red-800 border-red-300">
                    {urgentItems.length} urgent
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {urgentItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.5 }}
                      className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleItemComplete(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            {item.completed ? 
                              <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                              <Circle className="h-4 w-4 text-slate-400" />
                            }
                          </Button>
                          
                          <div className="flex items-center gap-3">
                            {getTypeIcon(item.type)}
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 dark:text-slate-100">{item.title}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                            </div>
                          </div>
                          
                          {item.time && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {item.time}
                            </Badge>
                          )}
                        </div>
                        
                        {item.action && (
                          <Button size="sm" variant="outline" onClick={item.action.onClick}>
                            {item.action.label}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Priority Items */}
            {otherItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Today's Schedule
                  </h3>
                  <Badge variant="outline">
                    {otherItems.length} items
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {otherItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.5 }}
                      className="p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleItemComplete(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            {item.completed ? 
                              <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                              <Circle className="h-4 w-4 text-slate-400" />
                            }
                          </Button>
                          
                          <div className="flex items-center gap-3">
                            {getTypeIcon(item.type)}
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 dark:text-slate-100">{item.title}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                            </div>
                          </div>
                          
                          {item.time && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {item.time}
                            </Badge>
                          )}
                        </div>
                        
                        {item.action && (
                          <Button size="sm" variant="outline" onClick={item.action.onClick}>
                            {item.action.label}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {urgentItems.length === 0 && otherItems.length === 0 && (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  All caught up!
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  You have no urgent items for today. Great work!
                </p>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}