"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Mail, 
  Calendar, 
  User, 
  Target, 
  CheckSquare, 
  Download, 
  Upload, 
  Settings, 
  Zap, 
  BarChart3, 
  Users, 
  ChevronRight,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  url: string;
  category: 'create' | 'view' | 'import' | 'settings';
  shortcut?: string;
  badge?: string;
  badgeColor?: string;
}

interface QuickActionsWidgetProps {
  className?: string;
  maxActions?: number;
  showCategories?: boolean;
}

export default function QuickActionsWidget({ 
  className, 
  maxActions = 8, 
  showCategories = true 
}: QuickActionsWidgetProps) {
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'create' | 'view' | 'import' | 'settings'>('all');

  useEffect(() => {
    const quickActions: QuickAction[] = [
      // Create Actions
      {
        id: 'add-lead',
        title: 'Add Lead',
        description: 'Create a new lead in your pipeline',
        icon: <Target className="h-5 w-5" />,
        color: 'bg-blue-500',
        url: '/app/pipeline/new',
        category: 'create',
        shortcut: '⌘L'
      },
      {
        id: 'add-contact',
        title: 'Add Contact',
        description: 'Add a new contact to your database',
        icon: <User className="h-5 w-5" />,
        color: 'bg-green-500',
        url: '/app/contacts/new',
        category: 'create',
        shortcut: '⌘C'
      },
      {
        id: 'schedule-meeting',
        title: 'Schedule Meeting',
        description: 'Book a meeting or call',
        icon: <Calendar className="h-5 w-5" />,
        color: 'bg-purple-500',
        url: '/app/calendar/new',
        category: 'create',
        shortcut: '⌘M'
      },
      {
        id: 'create-task',
        title: 'Create Task',
        description: 'Add a new task to your list',
        icon: <CheckSquare className="h-5 w-5" />,
        color: 'bg-orange-500',
        url: '/app/tasks/new',
        category: 'create',
        shortcut: '⌘T'
      },
      {
        id: 'compose-email',
        title: 'Compose Email',
        description: 'Write a new email message',
        icon: <Mail className="h-5 w-5" />,
        color: 'bg-pink-500',
        url: '/app/inbox/compose',
        category: 'create',
        shortcut: '⌘E'
      },

      // View Actions
      {
        id: 'view-pipeline',
        title: 'View Pipeline',
        description: 'See all your leads and deals',
        icon: <BarChart3 className="h-5 w-5" />,
        color: 'bg-emerald-500',
        url: '/app/pipeline',
        category: 'view'
      },
      {
        id: 'view-contacts',
        title: 'View Contacts',
        description: 'Browse your contact database',
        icon: <Users className="h-5 w-5" />,
        color: 'bg-teal-500',
        url: '/app/contacts',
        category: 'view'
      },
      {
        id: 'view-inbox',
        title: 'View Inbox',
        description: 'Check your email threads',
        icon: <Mail className="h-5 w-5" />,
        color: 'bg-rose-500',
        url: '/app/inbox',
        category: 'view'
      }
    ];

    setActions(quickActions);
    setIsLoading(false);
  }, []);

  const filteredActions = selectedCategory === 'all' 
    ? actions 
    : actions.filter(action => action.category === selectedCategory);

  const displayedActions = filteredActions.slice(0, maxActions);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className={cn("bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-xl", className)}
    >
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 shadow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">Fast access to common tasks</p>
          </div>
        </div>

        {/* Category Filter */}
        {showCategories && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === 'create' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('create')}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Create
            </Button>
            <Button
              variant={selectedCategory === 'view' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('view')}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              View
            </Button>
          </div>
        )}

        {/* Actions Grid */}
        <div className="grid grid-cols-1 gap-3">
          {displayedActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <Button
                variant="ghost"
                className="w-full h-auto p-4 flex items-center gap-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 dark:hover:from-blue-950/50 dark:hover:to-teal-950/50 transition-all duration-200 rounded-xl border border-border/50 hover:border-border group"
                onClick={() => window.location.href = action.url}
              >
                <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-lg group-hover:shadow-xl transition-shadow", action.color)}>
                  <div className="text-white">
                    {action.icon}
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-base text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{action.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {action.description}
                  </div>
                  {action.badge && (
                    <Badge variant="secondary" className="text-xs mt-2">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {action.shortcut && (
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      {action.shortcut}
                    </Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                </div>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {displayedActions.length === 0 && (
          <div className="text-center py-12">
            <div className="p-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-base font-medium text-slate-600 dark:text-slate-400 mb-2">
              No actions available
            </p>
            <p className="text-sm text-muted-foreground">
              Try switching to a different category
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}