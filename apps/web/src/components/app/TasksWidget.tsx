"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckSquare, Clock, AlertTriangle, Plus, Filter, MoreHorizontal, Calendar, User, Mail, Phone, MessageSquare, Star, Flag, CheckCircle, XCircle, Edit, Trash2, Archive, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignedTo?: string;
  linkedEmailId?: string;
  linkedLeadId?: string;
  linkedContactId?: string;
  tags: string[];
}

interface TasksWidgetProps {
  className?: string;
  maxTasks?: number;
  showCompleted?: boolean;
}

export default function TasksWidget({ className, maxTasks = 8, showCompleted = false }: TasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks');
        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks || []);
        } else {
          setTasks([]);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
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
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckSquare className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400';
    }
  };

  const formatDueDate = (dueAt?: string) => {
    if (!dueAt) return 'No due date';
    
    const dueDate = new Date(dueAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    
    if (dueDay.getTime() === today.getTime()) {
      return 'Today';
    } else if (dueDay.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (dueDate < now) {
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
      return `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`;
    } else {
      const daysUntil = Math.floor((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return `Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
    }
  };

  const filterTasks = (tasks: Task[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => {
      if (task.status === 'completed' && !showCompleted) return false;
      
      switch (filter) {
        case 'today':
          if (!task.dueAt) return false;
          const taskDueDate = new Date(task.dueAt);
          const taskDay = new Date(taskDueDate.getFullYear(), taskDueDate.getMonth(), taskDueDate.getDate());
          return taskDay.getTime() === today.getTime();
        case 'overdue':
          if (!task.dueAt) return false;
          return new Date(task.dueAt) < now && task.status !== 'completed';
        case 'upcoming':
          if (!task.dueAt) return false;
          const dueDate = new Date(task.dueAt);
          return dueDate >= tomorrow && task.status !== 'completed';
        default:
          return true;
      }
    });
  };

  const sortTasks = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueAt && !b.dueAt) return 0;
          if (!a.dueAt) return 1;
          if (!b.dueAt) return -1;
          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
  };

  const getTaskCounts = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    return {
      all: tasks.filter(t => t.status !== 'completed').length,
      today: tasks.filter(t => {
        if (!t.dueAt || t.status === 'completed') return false;
        const taskDueDate = new Date(t.dueAt);
        const taskDay = new Date(taskDueDate.getFullYear(), taskDueDate.getMonth(), taskDueDate.getDate());
        return taskDay.getTime() === today.getTime();
      }).length,
      overdue: tasks.filter(t => {
        if (!t.dueAt || t.status === 'completed') return false;
        return new Date(t.dueAt) < now;
      }).length,
      upcoming: tasks.filter(t => {
        if (!t.dueAt || t.status === 'completed') return false;
        return new Date(t.dueAt) >= tomorrow;
      }).length
    };
  };

  const filteredAndSortedTasks = sortTasks(filterTasks(tasks));
  const displayTasks = filteredAndSortedTasks.slice(0, maxTasks);
  const taskCounts = getTaskCounts();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-slate-200 rounded w-24 animate-pulse"></div>
            <div className="h-6 bg-slate-200 rounded w-6 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Tasks</CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mt-3">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'ghost'}
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            All <Badge variant="secondary" className="ml-1 text-xs">{taskCounts.all}</Badge>
          </Button>
          <Button
            size="sm"
            variant={filter === 'today' ? 'default' : 'ghost'}
            onClick={() => setFilter('today')}
            className="text-xs"
          >
            Today <Badge variant="secondary" className="ml-1 text-xs">{taskCounts.today}</Badge>
          </Button>
          <Button
            size="sm"
            variant={filter === 'overdue' ? 'default' : 'ghost'}
            onClick={() => setFilter('overdue')}
            className="text-xs"
          >
            Overdue <Badge variant="destructive" className="ml-1 text-xs">{taskCounts.overdue}</Badge>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {displayTasks.length === 0 ? (
          <div className="text-center py-6">
            <CheckSquare className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No tasks found</p>
            <Button size="sm" variant="outline" className="mt-2">
              <Plus className="h-3 w-3 mr-1" />
              Add Task
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            {displayTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(task.status)}
                  </div>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={cn(
                        "text-sm font-medium truncate",
                        task.status === 'completed' && "line-through text-slate-500"
                      )}>
                        {task.title}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Task Meta */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                        {task.priority}
                      </Badge>
                      
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(task.status))}>
                        {task.status.replace('_', ' ')}
                      </Badge>

                      {task.dueAt && (
                        <div className={cn(
                          "flex items-center gap-1 text-xs",
                          new Date(task.dueAt) < new Date() && task.status !== 'completed'
                            ? "text-red-600 dark:text-red-400"
                            : "text-slate-500"
                        )}>
                          <Calendar className="h-3 w-3" />
                          {formatDueDate(task.dueAt)}
                        </div>
                      )}

                      {task.assignedTo && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <User className="h-3 w-3" />
                          {task.assignedTo}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {task.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {task.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {task.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{task.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* View All Button */}
        {filteredAndSortedTasks.length > maxTasks && (
          <div className="pt-2">
            <Button variant="outline" size="sm" className="w-full">
              View All Tasks ({filteredAndSortedTasks.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
