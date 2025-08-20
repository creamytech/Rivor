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
  type: 'lead' | 'reply' | 'meeting' | 'showing' | 'deadline';
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
  showingsToday: number;
}

interface TodaysFocusPanelProps {
  className?: string;
}

export default function TodaysFocusPanel({ className = '' }: TodaysFocusPanelProps) {
  const [summary, setSummary] = useState<TodaysSummary>({ newLeads: 0, repliesDue: 0, meetingsScheduled: 0, showingsToday: 0 });
  const [focusItems, setFocusItems] = useState<FocusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTodayData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockSummary: TodaysSummary = {
          newLeads: 8,
          repliesDue: 12,
          meetingsScheduled: 5,
          showingsToday: 7
        };

        const mockFocusItems: FocusItem[] = [
          {
            id: '1',
            type: 'reply',
            title: 'Reply to Sarah Wilson',
            description: 'Inquiry about 1234 Oak Street listing - Budget: $450K',
            time: '2 hours ago',
            priority: 'urgent',
            completed: false,
            icon: <Mail className="h-4 w-4" />,
            action: { label: 'Reply', onClick: () => console.log('Reply') }
          },
          {
            id: '2', 
            type: 'showing',
            title: 'Property Showing',
            description: '567 Maple Ave with the Johnson family',
            time: '2:30 PM',
            priority: 'high',
            completed: false,
            icon: <Home className="h-4 w-4" />,
            action: { label: 'Details', onClick: () => console.log('Details') }
          },
          {
            id: '3',
            type: 'meeting',
            title: 'Client Meeting',
            description: 'First-time buyer consultation with Mike Chen',
            time: '4:00 PM',
            priority: 'medium',
            completed: false,
            icon: <Calendar className="h-4 w-4" />,
            action: { label: 'Prepare', onClick: () => console.log('Prepare') }
          },
          {
            id: '4',
            type: 'lead',
            title: 'New Lead Follow-up',
            description: 'Hot lead from Zillow - Investment property inquiry',
            time: '30 mins ago',
            priority: 'urgent',
            completed: false,
            icon: <Users className="h-4 w-4" />,
            action: { label: 'Call', onClick: () => console.log('Call') }
          },
          {
            id: '5',
            type: 'deadline',
            title: 'Contract Deadline',
            description: 'Thompson deal - inspection contingency expires',
            time: '6:00 PM',
            priority: 'urgent',
            completed: false,
            icon: <AlertTriangle className="h-4 w-4" />,
            action: { label: 'Review', onClick: () => console.log('Review') }
          }
        ];

        setSummary(mockSummary);
        setFocusItems(mockFocusItems);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch today\'s data:', error);
        setIsLoading(false);
      }
    };

    fetchTodayData();
  }, []);

  const toggleItemComplete = (itemId: string) => {
    setFocusItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
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
                  <div className="text-xs text-blue-600 dark:text-blue-400">New Leads</div>
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
                  <div className="text-xs text-green-600 dark:text-green-400">Replies Due</div>
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
                  <div className="text-xs text-purple-600 dark:text-purple-400">Meetings</div>
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
                <Home className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{summary.showingsToday}</div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">Showings</div>
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
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );

  function toggleItemComplete(itemId: string) {
    setFocusItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'lead': return <Users className="h-5 w-5 text-blue-600" />;
      case 'reply': return <Mail className="h-5 w-5 text-green-600" />;
      case 'meeting': return <Calendar className="h-5 w-5 text-purple-600" />;
      case 'showing': return <Home className="h-5 w-5 text-orange-600" />;
      case 'deadline': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-slate-600" />;
    }
  }
}