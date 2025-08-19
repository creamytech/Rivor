"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FlowCard from '@/components/river/FlowCard';
import PillFilter from '@/components/river/PillFilter';
import DataEmpty from '@/components/river/DataEmpty';
import SkeletonFlow from '@/components/river/SkeletonFlow';
import StatusBadge from '@/components/river/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  User,
  Flag,
  Check,
  X,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/river/RiverToast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

export interface Task {
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

interface TasksListProps {
  className?: string;
}

export default function TasksList({ className }: TasksListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const { addToast } = useToast();

  const filters = [
    { id: 'all', label: 'All Tasks', count: tasks.length },
    { id: 'pending', label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
    { id: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
    { id: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
    { id: 'overdue', label: 'Overdue', count: tasks.filter(t => 
      t.status !== 'completed' && t.dueAt && new Date(t.dueAt) < new Date()
    ).length }
  ];

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleTaskAction = async (taskId: string, action: 'complete' | 'reopen' | 'delete') => {
    try {
      const endpoint = `/api/tasks/${taskId}`;
      let method = 'PATCH';
      let body: unknown = {};

      switch (action) {
        case 'complete':
          body = { status: 'completed', completedAt: new Date().toISOString() };
          break;
        case 'reopen':
          body = { status: 'pending' };
          break;
        case 'delete':
          method = 'DELETE';
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'DELETE' ? undefined : JSON.stringify(body)
      });

      if (response.ok) {
        if (action === 'delete') {
          setTasks(prev => prev.filter(task => task.id !== taskId));
          addToast({
            type: 'success',
            title: 'Task Deleted',
            description: 'Task has been removed from your list'
          });
        } else {
          setTasks(prev => prev.map(task => 
            task.id === taskId 
              ? { ...task, ...body, updatedAt: new Date().toISOString() }
              : task
          ));
          addToast({
            type: 'success',
            title: action === 'complete' ? 'Task Completed' : 'Task Reopened',
            description: action === 'complete' 
              ? 'Great job! Task marked as completed' 
              : 'Task is back on your list'
          });
        }
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update task. Please try again.'
      });
    }
  };

  const filteredTasks = tasks.filter(task => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }

    // Apply category filter
    switch (currentFilter) {
      case 'pending':
        return task.status === 'pending';
      case 'in_progress':
        return task.status === 'in_progress';
      case 'completed':
        return task.status === 'completed';
      case 'overdue':
        return task.status !== 'completed' && task.dueAt && new Date(task.dueAt) < new Date();
      default:
        return true;
    }
  });

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 7) return `Due in ${diffDays} days`;
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  const isOverdue = (task: Task) => {
    return task.status !== 'completed' && task.dueAt && new Date(task.dueAt) < new Date();
  };

  if (loading) {
    return (
      <FlowCard className={className}>
        <div className="p-6">
          <SkeletonFlow variant="list" lines={6} />
        </div>
      </FlowCard>
    );
  }

  return (
    <FlowCard className={className}>
      <div className="flex flex-col h-full">


        {/* Tasks List */}
        <div className="flex-1 overflow-auto p-6">
          {filteredTasks.length === 0 ? (
            <DataEmpty
              icon={<CheckSquare className="h-12 w-12" />}
              title={searchQuery ? 'No tasks found' : 'No tasks yet'}
              description={
                searchQuery 
                  ? `No tasks match "${searchQuery}". Try a different search term.`
                  : 'Create your first task to get started with task management.'
              }
              action={!searchQuery ? {
                label: 'Create task',
                onClick: () => console.log('Create task')
              } : undefined}
            />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700',
                      'hover:shadow-md transition-shadow',
                      isOverdue(task) && 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleTaskAction(
                          task.id, 
                          task.status === 'completed' ? 'reopen' : 'complete'
                        )}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-1',
                          task.status === 'completed'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-teal-500'
                        )}
                      >
                        {task.status === 'completed' && <Check className="h-3 w-3" />}
                      </button>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={cn(
                            'font-medium text-slate-900 dark:text-slate-100',
                            task.status === 'completed' && 'line-through text-slate-500'
                          )}>
                            {task.title}
                          </h3>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {task.status === 'completed' ? (
                                <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'reopen')}>
                                  <X className="h-4 w-4 mr-2" />
                                  Reopen
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'complete')}>
                                  <Check className="h-4 w-4 mr-2" />
                                  Complete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleTaskAction(task.id, 'delete')}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {task.description && (
                          <p className={cn(
                            'text-sm text-slate-600 dark:text-slate-400 mb-3',
                            task.status === 'completed' && 'line-through'
                          )}>
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs">
                          {/* Status */}
                          <StatusBadge
                            status={task.status}
                            label={task.status.replace('_', ' ')}
                            className={getStatusColor(task.status)}
                            showIcon={false}
                          />

                          {/* Priority */}
                          <div className="flex items-center gap-1">
                            <Flag className={cn('h-3 w-3', getPriorityColor(task.priority))} />
                            <span className={cn('capitalize', getPriorityColor(task.priority))}>
                              {task.priority}
                            </span>
                          </div>

                          {/* Due Date */}
                          {task.dueAt && (
                            <div className={cn(
                              'flex items-center gap-1',
                              isOverdue(task) ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
                            )}>
                              <Calendar className="h-3 w-3" />
                              <span>{formatDueDate(task.dueAt)}</span>
                            </div>
                          )}

                          {/* Created by */}
                          <div className="flex items-center gap-1 text-slate-500">
                            <User className="h-3 w-3" />
                            <span>{task.createdBy}</span>
                          </div>

                          {/* Completion time */}
                          {task.completedAt && (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <Clock className="h-3 w-3" />
                              <span>Completed {new Date(task.completedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {task.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Linked items */}
                        {(task.linkedEmailId || task.linkedLeadId || task.linkedContactId) && (
                          <div className="flex items-center gap-2 mt-3 text-xs text-blue-600 dark:text-blue-400">
                            {task.linkedEmailId && (
                              <span className="flex items-center gap-1">
                                📧 Email
                              </span>
                            )}
                            {task.linkedLeadId && (
                              <span className="flex items-center gap-1">
                                📈 Lead
                              </span>
                            )}
                            {task.linkedContactId && (
                              <span className="flex items-center gap-1">
                                👤 Contact
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </FlowCard>
  );
}
