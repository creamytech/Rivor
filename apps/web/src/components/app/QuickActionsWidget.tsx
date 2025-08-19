"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Mail, 
  Calendar, 
  User, 
  Briefcase, 
  Phone, 
  MessageSquare,
  FileText,
  Download,
  Upload,
  Settings,
  Zap,
  Star,
  Clock,
  TrendingUp,
  Building,
  MapPin,
  ExternalLink,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: 'primary' | 'secondary' | 'utility';
  shortcut?: string;
  badge?: string;
  badgeColor?: string;
  action: () => void;
  isNew?: boolean;
  isPopular?: boolean;
}

interface QuickActionsWidgetProps {
  className?: string;
  showCategories?: boolean;
  compact?: boolean;
}

export default function QuickActionsWidget({ 
  className, 
  showCategories = true,
  compact = false 
}: QuickActionsWidgetProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'primary' | 'secondary' | 'utility'>('all');

  const quickActions: QuickAction[] = [
    // Primary Actions
    {
      id: 'add-lead',
      title: 'Add Lead',
      description: 'Create a new lead record',
      icon: <User className="h-5 w-5" />,
      color: 'blue',
      category: 'primary',
      shortcut: '⌘L',
      badge: 'Popular',
      badgeColor: 'green',
      action: () => console.log('Add lead'),
      isPopular: true
    },
    {
      id: 'create-deal',
      title: 'Create Deal',
      description: 'Start a new sales opportunity',
      icon: <Briefcase className="h-5 w-5" />,
      color: 'green',
      category: 'primary',
      shortcut: '⌘D',
      action: () => console.log('Create deal'),
      isPopular: true
    },
    {
      id: 'schedule-meeting',
      title: 'Schedule Meeting',
      description: 'Book a meeting or call',
      icon: <Calendar className="h-5 w-5" />,
      color: 'purple',
      category: 'primary',
      shortcut: '⌘M',
      action: () => console.log('Schedule meeting'),
      isPopular: true
    },
    {
      id: 'compose-email',
      title: 'Compose Email',
      description: 'Write a new email message',
      icon: <Mail className="h-5 w-5" />,
      color: 'orange',
      category: 'primary',
      shortcut: '⌘E',
      action: () => console.log('Compose email'),
      isPopular: true
    },

    // Secondary Actions
    {
      id: 'add-contact',
      title: 'Add Contact',
      description: 'Create a new contact record',
      icon: <User className="h-5 w-5" />,
      color: 'indigo',
      category: 'secondary',
      action: () => console.log('Add contact'),
    },
    {
      id: 'log-call',
      title: 'Log Call',
      description: 'Record a phone conversation',
      icon: <Phone className="h-5 w-5" />,
      color: 'teal',
      category: 'secondary',
      action: () => console.log('Log call'),
    },
    {
      id: 'send-message',
      title: 'Send Message',
      description: 'Send a quick message',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'cyan',
      category: 'secondary',
      action: () => console.log('Send message'),
    },
    {
      id: 'create-task',
      title: 'Create Task',
      description: 'Add a new task or reminder',
      icon: <FileText className="h-5 w-5" />,
      color: 'amber',
      category: 'secondary',
      action: () => console.log('Create task'),
    },

    // Utility Actions
    {
      id: 'import-data',
      title: 'Import Data',
      description: 'Import leads, contacts, or deals',
      icon: <Upload className="h-5 w-5" />,
      color: 'slate',
      category: 'utility',
      action: () => console.log('Import data'),
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Export your data to CSV or Excel',
      icon: <Download className="h-5 w-5" />,
      color: 'slate',
      category: 'utility',
      action: () => console.log('Export data'),
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      description: 'Get help with AI-powered insights',
      icon: <Sparkles className="h-5 w-5" />,
      color: 'pink',
      category: 'utility',
      badge: 'New',
      badgeColor: 'blue',
      action: () => console.log('AI assistant'),
      isNew: true
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure your workspace',
      icon: <Settings className="h-5 w-5" />,
      color: 'slate',
      category: 'utility',
      action: () => console.log('Settings'),
    }
  ];

  const filteredActions = selectedCategory === 'all' 
    ? quickActions 
    : quickActions.filter(action => action.category === selectedCategory);

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/40',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/40',
      indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/40',
      teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/40',
      cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-900/40',
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/40',
      pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/40',
      slate: 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900/40'
    };
    return colorMap[color] || colorMap.slate;
  };

  const getBadgeColor = (color?: string) => {
    if (!color) return '';
    const colorMap: Record<string, string> = {
      green: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
            {quickActions.filter(a => a.isNew).length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {quickActions.filter(a => a.isNew).length} New
              </Badge>
            )}
          </CardTitle>
        </div>

        {/* Category Filter */}
        {showCategories && (
          <div className="flex items-center gap-1 mt-4">
            {[
              { key: 'all', label: 'All', count: quickActions.length },
              { key: 'primary', label: 'Primary', count: quickActions.filter(a => a.category === 'primary').length },
              { key: 'secondary', label: 'Secondary', count: quickActions.filter(a => a.category === 'secondary').length },
              { key: 'utility', label: 'Utility', count: quickActions.filter(a => a.category === 'utility').length }
            ].map((category) => (
              <Button
                key={category.key}
                variant={selectedCategory === category.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(category.key as any)}
                className="text-xs h-7"
              >
                {category.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className={cn(
          "grid gap-3",
          compact ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2"
        )}>
          <AnimatePresence mode="wait">
            {filteredActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-auto p-4 justify-start group relative overflow-hidden",
                    compact ? "flex-col gap-2 h-24" : "flex-row gap-3 h-auto"
                  )}
                  onClick={action.action}
                >
                  {/* Icon */}
                  <div className={cn(
                    "flex-shrink-0 p-2 rounded-lg transition-colors",
                    getColorClasses(action.color)
                  )}>
                    {action.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {action.title}
                      </h4>
                      {action.isNew && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                          New
                        </Badge>
                      )}
                      {action.isPopular && (
                        <Star className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                    
                    {!compact && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {action.description}
                      </p>
                    )}

                    {/* Shortcut */}
                    {action.shortcut && !compact && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {action.shortcut}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Badge */}
                  {action.badge && (
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", getBadgeColor(action.badgeColor))}
                    >
                      {action.badge}
                    </Badge>
                  )}

                  {/* Arrow Icon */}
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />

                  {/* Background Pattern */}
                  <div className={cn(
                    "absolute top-0 right-0 w-16 h-16 opacity-5 transition-opacity group-hover:opacity-10",
                    `bg-${action.color}-500`
                  )} />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredActions.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No actions found</p>
            <p className="text-xs">Try selecting a different category</p>
          </div>
        )}

        {/* Quick Tips */}
        {!compact && (
          <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Pro Tips
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p>• Use keyboard shortcuts for faster access</p>
              <p>• Star frequently used actions for quick access</p>
              <p>• Customize your quick actions in settings</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
