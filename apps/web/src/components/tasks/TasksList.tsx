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
import { useMobileDetection } from '@/hooks/useMobileDetection';
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
import CreateTaskModal from '@/components/tasks/CreateTaskModal';

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

export default function TasksList({ className }: TasksListProps): JSX.Element {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { addToast } = useToast();
  const { isMobile } = useMobileDetection();

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

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
    setShowCreateModal(false);
    addToast({
      type: 'success',
      title: 'Task Created',
      description: 'Your new task has been added successfully'
    });
  };

  const handleTaskAction = async (taskId: string, action: 'complete' | 'reopen' | 'delete') => {
    try {
      // Handle mock/demo tasks locally without API calls
      if (taskId.startsWith('demo-') || taskId.startsWith('task-')) {
        let updateData: Partial<Task> = {};
        
        switch (action) {
          case 'complete':
            updateData = { status: 'completed', completedAt: new Date().toISOString() };
            break;
          case 'reopen':
            updateData = { status: 'pending', completedAt: undefined };
            break;
          case 'delete':
            setTasks(prev => prev.filter(task => task.id !== taskId));
            addToast({
              type: 'success',
              title: 'Task Deleted',
              description: 'Task has been removed from your list'
            });
            return;
        }
        
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, ...updateData, updatedAt: new Date().toISOString() }
            : task
        ));
        
        addToast({
          type: 'success',
          title: action === 'complete' ? 'Task Completed' : 'Task Reopened',
          description: action === 'complete' 
            ? 'Great job! Task marked as completed' 
            : 'Task is back on your list'
        });
        return;
      }

      // Handle real tasks with API calls
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
      } else {
        console.error('Failed to update task');
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
    <div className={cn("min-h-screen", className)}>
      {/* Liquid Glass Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card glass-border-active mb-6"
        style={{ 
          backgroundColor: 'var(--glass-surface)', 
          color: 'var(--glass-text)',
          backdropFilter: 'var(--glass-blur)'
        }}
      >
        <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex items-center justify-between'} mb-6`}>
            <div className="flex items-center gap-4">
              <div className="glass-icon-container">
                <CheckSquare className="h-6 w-6" style={{ color: 'var(--glass-primary)' }} />
              </div>
              <div>
                <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold glass-text-gradient`}>Tasks</h1>
                <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  Stay organized and productive
                </p>
              </div>
            </div>
            
            <Button 
              variant="liquid"
              size={isMobile ? "default" : "lg"}
              className={`glass-hover-glow ${isMobile ? 'w-full' : ''}`}
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              New Task
            </Button>
          </div>

          {/* Search and Filters */}
          <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex items-center gap-4'} mb-4`}>
            {/* Enhanced Search */}
            <div className={`relative ${isMobile ? 'w-full' : 'flex-1 max-w-md'}`}>
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                     style={{ color: 'var(--glass-text-muted)' }} />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-16 glass-input"
              />
            </div>

            {/* Filter Pills */}
            <div className={`${isMobile ? 'overflow-x-auto scrollbar-hide' : ''} glass-pill-container`}>
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={currentFilter === filter.id ? 'liquid' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentFilter(filter.id)}
                  className={`glass-pill-button ${isMobile ? 'flex-shrink-0' : ''}`}
                >
                  {isMobile ? filter.label.split(' ')[0] : filter.label}
                  {filter.count > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-white/20">
                      {filter.count}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tasks Grid */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card text-center py-12"
            style={{ backgroundColor: 'var(--glass-surface)' }}
          >
            <div className="glass-icon-container mx-auto mb-4">
              <CheckSquare className="h-8 w-8" style={{ color: 'var(--glass-text-muted)' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--glass-text)' }}>
              {searchQuery ? 'No tasks found' : 'No tasks yet'}
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--glass-text-muted)' }}>
              {searchQuery 
                ? `No tasks match "${searchQuery}". Try a different search term.`
                : 'Create your first task to get started with task management.'
              }
            </p>
            {!searchQuery && (
              <Button 
                variant="liquid" 
                onClick={() => setShowCreateModal(true)}
                className="glass-hover-glow"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'glass-task-card',
                    task.status === 'completed' && 'opacity-75',
                    isOverdue(task) && 'glass-priority-high'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Enhanced Checkbox */}
                    <button
                      onClick={() => handleTaskAction(
                        task.id, 
                        task.status === 'completed' ? 'reopen' : 'complete'
                      )}
                      className={cn(
                        'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 mt-1',
                        'glass-button-small',
                        task.status === 'completed'
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 border-green-400 text-white shadow-lg scale-110'
                          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      )}
                    >
                      {task.status === 'completed' && <Check className="h-4 w-4" />}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex items-start justify-between'} mb-3`}>
                        <div className={`${isMobile ? 'flex items-center justify-between w-full' : 'flex items-center gap-3'}`}>
                          <div className={`${isMobile ? 'flex flex-col' : 'flex items-center gap-3'}`}>
                            <h3 className={cn(
                              isMobile ? 'font-semibold text-base' : 'font-semibold text-lg',
                              task.status === 'completed' && 'line-through',
                            )} style={{ color: 'var(--glass-text)' }}>
                              {task.title}
                            </h3>
                            
                            {/* Priority Indicator */}
                            <span className={cn(
                              'glass-category-pill',
                              task.priority === 'high' && 'glass-priority-high',
                              task.priority === 'medium' && 'glass-priority-medium',
                              task.priority === 'low' && 'glass-priority-low',
                              isMobile && 'text-xs'
                            )}>
                              <Flag className="h-3 w-3" />
                              {task.priority}
                            </span>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="glass-button-small flex-shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-dropdown">
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
                      </div>

                      {task.description && (
                        <p className={cn(
                          'text-sm mb-4',
                          task.status === 'completed' && 'line-through'
                        )} style={{ color: 'var(--glass-text-muted)' }}>
                          {task.description}
                        </p>
                      )}

                      {/* Enhanced Task Metadata */}
                      <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex items-center gap-6'} text-sm`}>
                        {isMobile ? (
                          <>
                            <div className="flex items-center gap-2">
                              {/* Status Badge */}
                              <span className={cn(
                                'glass-category-pill',
                                task.status === 'completed' && 'glass-status-completed',
                                task.status === 'in_progress' && 'glass-status-in-progress',
                                task.status === 'pending' && 'glass-status-todo'
                              )}>
                                <CheckSquare className="h-3 w-3" />
                                {task.status.replace('_', ' ')}
                              </span>
                              
                              {/* Due Date */}
                              {task.dueAt && (
                                <div className={cn(
                                  'flex items-center gap-2 glass-category-pill',
                                  isOverdue(task) && 'text-red-600 border-red-300 bg-red-50'
                                )}>
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDueDate(task.dueAt)}</span>
                                </div>
                              )}
                            </div>
                            
                            {(task.assignedTo || task.completedAt) && (
                              <div className="flex items-center gap-2">
                                {/* Assigned User */}
                                {task.assignedTo && (
                                  <div className="flex items-center gap-2 glass-category-pill">
                                    <User className="h-3 w-3" />
                                    <span>{task.assignedTo}</span>
                                  </div>
                                )}

                                {/* Completion time */}
                                {task.completedAt && (
                                  <div className="flex items-center gap-2 glass-category-pill glass-status-completed">
                                    <Clock className="h-3 w-3" />
                                    <span>Completed {new Date(task.completedAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {/* Status Badge */}
                            <span className={cn(
                              'glass-category-pill',
                              task.status === 'completed' && 'glass-status-completed',
                              task.status === 'in_progress' && 'glass-status-in-progress',
                              task.status === 'pending' && 'glass-status-todo'
                            )}>
                              <CheckSquare className="h-3 w-3" />
                              {task.status.replace('_', ' ')}
                            </span>

                            {/* Due Date */}
                            {task.dueAt && (
                              <div className={cn(
                                'flex items-center gap-2 glass-category-pill',
                                isOverdue(task) && 'text-red-600 border-red-300 bg-red-50'
                              )}>
                                <Calendar className="h-3 w-3" />
                                <span>{formatDueDate(task.dueAt)}</span>
                              </div>
                            )}

                            {/* Assigned User */}
                            {task.assignedTo && (
                              <div className="flex items-center gap-2 glass-category-pill">
                                <User className="h-3 w-3" />
                                <span>{task.assignedTo}</span>
                              </div>
                            )}

                            {/* Completion time */}
                            {task.completedAt && (
                              <div className="flex items-center gap-2 glass-category-pill glass-status-completed">
                                <Clock className="h-3 w-3" />
                                <span>Completed {new Date(task.completedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Tags */}
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {task.tags.map((tag) => (
                            <span
                              key={tag}
                              className="glass-category-pill"
                            >
                              #{tag}
                            </span>
                          ))}
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

      {/* Create Task Modal */}
      <CreateTaskModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}