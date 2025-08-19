"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, 
  Mail, 
  Calendar, 
  User, 
  Target, 
  CheckSquare, 
  Phone, 
  MessageSquare, 
  FileText, 
  Download, 
  Upload, 
  Settings, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Building, 
  Clock, 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Edit,
  Eye,
  Trash2,
  Copy,
  ExternalLink,
  Briefcase,
  DollarSign,
  MapPin,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Calendar as CalendarIcon,
  Target as TargetIcon,
  CheckSquare as CheckSquareIcon,
  MessageSquare as MessageSquareIcon,
  FileText as FileTextIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
  Zap as ZapIcon,
  Sparkles as SparklesIcon,
  TrendingUp as TrendingUpIcon,
  BarChart3 as BarChart3Icon,
  Users as UsersIcon,
  Building as BuildingIcon,
  Clock as ClockIcon,
  Star as StarIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  ArrowRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Edit as EditIcon,
  Eye as EyeIcon,
  Trash2 as Trash2Icon,
  Copy as CopyIcon,
  ExternalLink as ExternalLinkIcon,
  Briefcase as BriefcaseIcon,
  DollarSign as DollarSignIcon,
  MapPin as MapPinIcon
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
    const fetchQuickActions = async () => {
      try {
        // Fetch data to determine which actions are available
        const [contactsData, tasksData, eventsData, leadsData] = await Promise.all([
          fetch('/api/contacts').then(r => r.json()).catch(() => ({ contacts: [] })),
          fetch('/api/tasks').then(r => r.json()).catch(() => ({ tasks: [] })),
          fetch('/api/calendar/events').then(r => r.json()).catch(() => ({ events: [] })),
          fetch('/api/pipeline/leads').then(r => r.json()).catch(() => ({ leads: [] }))
        ]);

        const hasContacts = (contactsData.contacts || []).length > 0;
        const hasTasks = (tasksData.tasks || []).length > 0;
        const hasEvents = (eventsData.events || []).length > 0;
        const hasLeads = (leadsData.leads || []).length > 0;

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
            category: 'view',
            badge: hasLeads ? `${leadsData.leads?.length || 0} leads` : undefined,
            badgeColor: 'blue'
          },
          {
            id: 'view-contacts',
            title: 'View Contacts',
            description: 'Browse your contact database',
            icon: <Users className="h-5 w-5" />,
            color: 'bg-teal-500',
            url: '/app/contacts',
            category: 'view',
            badge: hasContacts ? `${contactsData.contacts?.length || 0} contacts` : undefined,
            badgeColor: 'green'
          },
          {
            id: 'view-calendar',
            title: 'View Calendar',
            description: 'Check your schedule',
            icon: <Calendar className="h-5 w-5" />,
            color: 'bg-indigo-500',
            url: '/app/calendar',
            category: 'view',
            badge: hasEvents ? `${eventsData.events?.length || 0} events` : undefined,
            badgeColor: 'purple'
          },
          {
            id: 'view-tasks',
            title: 'View Tasks',
            description: 'See your task list',
            icon: <CheckSquare className="h-5 w-5" />,
            color: 'bg-amber-500',
            url: '/app/tasks',
            category: 'view',
            badge: hasTasks ? `${tasksData.tasks?.length || 0} tasks` : undefined,
            badgeColor: 'orange'
          },
          {
            id: 'view-inbox',
            title: 'View Inbox',
            description: 'Check your email threads',
            icon: <Mail className="h-5 w-5" />,
            color: 'bg-rose-500',
            url: '/app/inbox',
            category: 'view'
          },

          // Import Actions
          {
            id: 'import-contacts',
            title: 'Import Contacts',
            description: 'Upload contacts from CSV or Google',
            icon: <Upload className="h-5 w-5" />,
            color: 'bg-cyan-500',
            url: '/app/contacts/import',
            category: 'import'
          },
          {
            id: 'export-data',
            title: 'Export Data',
            description: 'Download your data as CSV',
            icon: <Download className="h-5 w-5" />,
            color: 'bg-slate-500',
            url: '/app/settings/export',
            category: 'import'
          },

          // Settings Actions
          {
            id: 'settings',
            title: 'Settings',
            description: 'Configure your account',
            icon: <Settings className="h-5 w-5" />,
            color: 'bg-gray-500',
            url: '/app/settings',
            category: 'settings'
          },
          {
            id: 'integrations',
            title: 'Integrations',
            description: 'Connect external services',
            icon: <Zap className="h-5 w-5" />,
            color: 'bg-yellow-500',
            url: '/app/settings/integrations',
            category: 'settings'
          }
        ];

        setActions(quickActions);
      } catch (error) {
        console.error('Failed to fetch quick actions data:', error);
        // Fallback to basic actions if API fails
        setActions([
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
            id: 'view-pipeline',
            title: 'View Pipeline',
            description: 'See all your leads and deals',
            icon: <BarChart3 className="h-5 w-5" />,
            color: 'bg-emerald-500',
            url: '/app/pipeline',
            category: 'view'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuickActions();
  }, []);

  const filteredActions = selectedCategory === 'all' 
    ? actions 
    : actions.filter(action => action.category === selectedCategory);

  const displayedActions = filteredActions.slice(0, maxActions);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'create':
        return <Plus className="h-4 w-4" />;
      case 'view':
        return <Eye className="h-4 w-4" />;
      case 'import':
        return <Upload className="h-4 w-4" />;
      case 'settings':
        return <Settings className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'create':
        return 'bg-green-100 text-green-700';
      case 'view':
        return 'bg-blue-100 text-blue-700';
      case 'import':
        return 'bg-purple-100 text-purple-700';
      case 'settings':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getBadgeColor = (color?: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-700';
      case 'green':
        return 'bg-green-100 text-green-700';
      case 'purple':
        return 'bg-purple-100 text-purple-700';
      case 'orange':
        return 'bg-orange-100 text-orange-700';
      case 'red':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
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
            <Button
              variant={selectedCategory === 'import' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('import')}
              className="flex items-center gap-1"
            >
              <Upload className="h-3 w-3" />
              Import
            </Button>
            <Button
              variant={selectedCategory === 'settings' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('settings')}
              className="flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Settings
            </Button>
          </div>
        )}

        {/* Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          {displayedActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="outline"
                className="w-full h-auto p-4 flex flex-col items-start gap-2 hover:shadow-md transition-all"
                onClick={() => window.location.href = action.url}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={cn("p-2 rounded-lg", action.color)}>
                    {action.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                      {action.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {action.shortcut && (
                      <Badge variant="secondary" className="text-xs">
                        {action.shortcut}
                      </Badge>
                    )}
                    {action.badge && (
                      <Badge variant="secondary" className={cn("text-xs", getBadgeColor(action.badgeColor))}>
                        {action.badge}
                      </Badge>
                    )}
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                  </div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Show More Button */}
        {filteredActions.length > maxActions && (
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm">
              Show {filteredActions.length - maxActions} more
            </Button>
          </div>
        )}

        {/* Empty State */}
        {displayedActions.length === 0 && (
          <div className="text-center py-8">
            <Zap className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No actions available in this category
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
