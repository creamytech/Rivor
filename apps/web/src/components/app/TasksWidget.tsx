"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Filter, 
  MoreHorizontal,
  Calendar,
  User,
  Mail,
  Phone,
  MessageSquare,
  Star,
  Flag,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Archive,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assignedTo?: {
    id: string;
    name: string;
    avatar?: string;
  };
  relatedTo?: {
    type: 'lead' | 'deal' | 'contact' | 'email';
    id: string;
    title: string;
  };
  tags: string[];
  createdAt: Date;
  completedAt?: Date;
}

interface TasksWidgetProps {
  className?: string;
  maxTasks?: number;
  showCompleted?: boolean;
}

export default function TasksWidget({ 
  className, 
  maxTasks = 8, 
  showCompleted = false 
}: TasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');
  const [isLoading, setIsLoading] = useState(true);

  // Mock tasks data
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Follow up with TechCorp',
      description: 'Call Sarah to discuss proposal feedback and next steps',
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      priority: 'high',
      status: 'pending',
      assignedTo: {
        id: 'user1',
        name: 'John Doe',
        avatar: '/api/avatar/john-doe'
      },
      relatedTo: {
        type: 'lead',
        id: 'lead1',
        title: 'TechCorp Enterprise Deal'
      },
      tags: ['follow-up', 'proposal'],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      title: 'Send contract to StartupXYZ',
      description: 'Email the final contract documents to Mike Chen',
      dueDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago (overdue)
      priority: 'urgent',
      status: 'overdue',
      assignedTo: {
        id: 'user1',
        name: 'John Doe',
        avatar: '/api/avatar/john-doe'
      },
      relatedTo: {
        type: 'deal',
        id: 'deal1',
        title: 'StartupXYZ Contract'
      },
      tags: ['contract', 'email'],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      title: 'Schedule demo with Acme Corp',
      description: 'Book a product demo for the Acme Corp team',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      priority: 'medium',
      status: 'pending',
      assignedTo: {
        id: 'user2',
        name: 'Jane Smith',
        avatar: '/api/avatar/jane-smith'
      },
      relatedTo: {
        type: 'lead',
        id: 'lead2',
        title: 'Acme Corp Lead'
      },
      tags: ['demo', 'scheduling'],
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
    },
    {
      id: '4',
      title: 'Review quarterly pipeline',
      description: 'Analyze pipeline performance and update forecasts',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      priority: 'medium',
      status: 'in_progress',
      assignedTo: {
        id: 'user1',
        name: 'John Doe',
        avatar: '/api/avatar/john-doe'
      },
      tags: ['pipeline', 'analysis'],
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    },
    {
      id: '5',
      title: 'Update contact information',
      description: 'Verify and update contact details for key accounts',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      priority: 'low',
      status: 'pending',
      assignedTo: {
        id: 'user3',
        name: 'Bob Wilson',
        avatar: '/api/avatar/bob-wilson'
      },
      tags: ['contacts', 'data'],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: '6',
      title: 'Prepare presentation for board meeting',
      description: 'Create slides for quarterly board presentation',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      priority: 'high',
      status: 'pending',
      assignedTo: {
        id: 'user2',
        name: 'Jane Smith',
        avatar: '/api/avatar/jane-smith'
      },
      tags: ['presentation', 'board'],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setTasks(mockTasks);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckSquare className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'overdue':
        return 'text-red-600 dark:text-red-400';
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filterTasks = (tasks: Task[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'today':
        return tasks.filter(task => {
          const taskDate = new Date(task.dueDate.getFullYear(), task.dueDate.getMonth(), task.dueDate.getDate());
          return taskDate.getTime() === today.getTime();
        });
      case 'overdue':
        return tasks.filter(task => task.dueDate < now);
      case 'upcoming':
        return tasks.filter(task => task.dueDate >= tomorrow);
      default:
        return tasks;
    }
  };

  const sortTasks = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return a.dueDate.getTime() - b.dueDate.getTime();
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'createdAt':
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return 0;
      }
    });
  };

  const filteredAndSortedTasks = sortTasks(filterTasks(tasks));
  const displayTasks = filteredAndSortedTasks.slice(0, maxTasks);

  const getTaskCounts = () => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return {
      total: tasks.length,
      today: tasks.filter(t => {
        const taskDate = new Date(t.dueDate.getFullYear(), t.dueDate.getMonth(), t.dueDate.getDate());
        return taskDate.getTime() === todayStart.getTime();
      }).length,
      overdue: tasks.filter(t => t.dueDate < today).length,
      completed: tasks.filter(t => t.status === 'completed').length
    };
  };

  const counts = getTaskCounts();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-8 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Tasks
            <Badge variant="secondary" className="ml-2">
              {counts.total}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Add task')}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mt-4">
          {[
            { key: 'all', label: 'All', count: counts.total },
            { key: 'today', label: 'Today', count: counts.today },
            { key: 'overdue', label: 'Overdue', count: counts.overdue }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(tab.key as any)}
              className="text-xs h-7"
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tab.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <AnimatePresence>
            {displayTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="group relative p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <button
                    onClick={() => {
                      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                      setTasks(prev => prev.map(t => 
                        t.id === task.id ? { ...t, status: newStatus } : t
                      ));
                    }}
                    className="flex-shrink-0 mt-1"
                  >
                    {getStatusIcon(task.status)}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className={cn(
                          "font-medium text-sm line-clamp-1",
                          task.status === 'completed' && "line-through text-slate-500"
                        )}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Priority Badge */}
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs capitalize", getPriorityColor(task.priority))}
                      >
                        {task.priority}
                      </Badge>
                    </div>

                    {/* Meta Information */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className={cn("flex items-center gap-1", getStatusColor(task.status))}>
                        <Clock className="h-3 w-3" />
                        {formatDueDate(task.dueDate)}
                      </span>

                      {task.assignedTo && (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={task.assignedTo.avatar} />
                            <AvatarFallback className="text-xs">
                              {task.assignedTo.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{task.assignedTo.name}</span>
                        </div>
                      )}

                      {task.relatedTo && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {task.relatedTo.type}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {task.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {task.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {task.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{task.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {displayTasks.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tasks found</p>
              <p className="text-xs">Create a new task to get started</p>
            </div>
          )}

          {filteredAndSortedTasks.length > maxTasks && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => console.log('View all tasks')}
            >
              View all {filteredAndSortedTasks.length} tasks
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
