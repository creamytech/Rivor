"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  Mail, 
  Calendar, 
  User, 
  Target, 
  CheckSquare, 
  Upload, 
  Zap, 
  BarChart3, 
  Users, 
  ChevronRight,
  Eye,
  Home,
  MapPin,
  Camera,
  FileText,
  TrendingUp,
  Clock,
  Mic,
  Search,
  MessageSquare,
  Phone,
  Bell,
  Star,
  Briefcase,
  PieChart,
  Globe,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  url: string;
  category: 'create' | 'view' | 'property' | 'communication' | 'analysis';
  shortcut?: string;
  badge?: string;
  priority: number;
  contextRelevant?: string[];
  aiSuggested?: boolean;
}

interface QuickActionsWidgetProps {
  className?: string;
}

export default function QuickActionsWidget({ className }: QuickActionsWidgetProps) {
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'create' | 'property' | 'communication' | 'analysis'>('all');
  const [contextActions, setContextActions] = useState<QuickAction[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        const action = actions.find(a => a.shortcut?.includes(event.key.toUpperCase()));
        if (action) {
          event.preventDefault();
          router.push(action.url);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, router]);

  useEffect(() => {
    const realEstateActions: QuickAction[] = [
      // High Priority Create Actions
      {
        id: 'add-property',
        title: 'Add Property',
        description: 'List a new property or add to inventory',
        icon: <Home className="h-5 w-5" />,
        gradient: 'from-emerald-500 to-teal-600',
        url: '/app/properties/new',
        category: 'property',
        shortcut: '⌘P',
        priority: 1,
        contextRelevant: ['dashboard', 'properties'],
        aiSuggested: true
      },
      {
        id: 'add-lead',
        title: 'Add Lead',
        description: 'Create a new qualified lead',
        icon: <Target className="h-5 w-5" />,
        gradient: 'from-blue-500 to-indigo-600',
        url: '/app/pipeline/new',
        category: 'create',
        shortcut: '⌘L',
        priority: 1,
        contextRelevant: ['dashboard', 'pipeline']
      },
      {
        id: 'schedule-showing',
        title: 'Schedule Showing',
        description: 'Book property showing with clients',
        icon: <Calendar className="h-5 w-5" />,
        gradient: 'from-purple-500 to-pink-600',
        url: '/app/showings/new',
        category: 'create',
        shortcut: '⌘S',
        priority: 1,
        contextRelevant: ['properties', 'calendar'],
        aiSuggested: true
      },
      {
        id: 'add-contact',
        title: 'Add Contact',
        description: 'Add new client or prospect',
        icon: <User className="h-5 w-5" />,
        gradient: 'from-green-500 to-emerald-600',
        url: '/app/contacts/new',
        category: 'create',
        shortcut: '⌘C',
        priority: 2,
        contextRelevant: ['contacts']
      },

      // Property Actions
      {
        id: 'mls-search',
        title: 'MLS Search',
        description: 'Search MLS for properties',
        icon: <Search className="h-5 w-5" />,
        gradient: 'from-orange-500 to-red-600',
        url: '/app/mls/search',
        category: 'property',
        shortcut: '⌘M',
        priority: 2,
        contextRelevant: ['properties']
      },
      {
        id: 'create-cma',
        title: 'Create CMA',
        description: 'Comparative Market Analysis',
        icon: <PieChart className="h-5 w-5" />,
        gradient: 'from-cyan-500 to-blue-600',
        url: '/app/analytics/cma/new',
        category: 'analysis',
        shortcut: '⌘A',
        priority: 2,
        contextRelevant: ['properties', 'analytics']
      },
      {
        id: 'property-flyer',
        title: 'Create Flyer',
        description: 'Generate property marketing materials',
        icon: <FileText className="h-5 w-5" />,
        gradient: 'from-violet-500 to-purple-600',
        url: '/app/marketing/flyer/new',
        category: 'property',
        priority: 3,
        contextRelevant: ['properties']
      },

      // Communication Actions
      {
        id: 'compose-email',
        title: 'Email Client',
        description: 'Send email with templates',
        icon: <Mail className="h-5 w-5" />,
        gradient: 'from-pink-500 to-rose-600',
        url: '/app/inbox/compose',
        category: 'communication',
        shortcut: '⌘E',
        priority: 2,
        contextRelevant: ['inbox', 'contacts']
      },
      {
        id: 'send-market-update',
        title: 'Market Update',
        description: 'Send bulk market reports to clients',
        icon: <TrendingUp className="h-5 w-5" />,
        gradient: 'from-amber-500 to-orange-600',
        url: '/app/marketing/market-update',
        category: 'communication',
        priority: 3,
        contextRelevant: ['analytics']
      },
      {
        id: 'log-activity',
        title: 'Log Activity',
        description: 'Record client interaction',
        icon: <Clock className="h-5 w-5" />,
        gradient: 'from-slate-500 to-gray-600',
        url: '/app/activities/new',
        category: 'create',
        shortcut: '⌘T',
        priority: 2,
        contextRelevant: ['contacts', 'pipeline']
      },
      {
        id: 'voice-note',
        title: 'Voice Note',
        description: 'Record quick voice memo',
        icon: <Mic className="h-5 w-5" />,
        gradient: 'from-red-500 to-pink-600',
        url: '/app/notes/voice/new',
        category: 'create',
        priority: 3
      },

      // Analysis & View Actions
      {
        id: 'view-pipeline',
        title: 'Pipeline',
        description: 'View deals and opportunities',
        icon: <BarChart3 className="h-5 w-5" />,
        gradient: 'from-teal-500 to-cyan-600',
        url: '/app/pipeline',
        category: 'view',
        priority: 2,
        contextRelevant: ['dashboard']
      },
      {
        id: 'import-contacts',
        title: 'Import Contacts',
        description: 'Bulk import from CSV/business cards',
        icon: <Upload className="h-5 w-5" />,
        gradient: 'from-indigo-500 to-blue-600',
        url: '/app/contacts/import',
        category: 'create',
        priority: 3,
        contextRelevant: ['contacts']
      }
    ];

    // Sort by priority and context relevance
    const sortedActions = realEstateActions.sort((a, b) => {
      // Check if action is relevant to current page
      const aRelevant = a.contextRelevant?.some(context => pathname.includes(context)) || false;
      const bRelevant = b.contextRelevant?.some(context => pathname.includes(context)) || false;
      
      if (aRelevant && !bRelevant) return -1;
      if (!aRelevant && bRelevant) return 1;
      
      // Then sort by AI suggestion
      if (a.aiSuggested && !b.aiSuggested) return -1;
      if (!a.aiSuggested && b.aiSuggested) return 1;
      
      // Finally sort by priority
      return a.priority - b.priority;
    });

    setActions(sortedActions);
    
    // Set context-aware actions for the current page
    const relevant = sortedActions.filter(action => 
      action.contextRelevant?.some(context => pathname.includes(context))
    ).slice(0, 3);
    setContextActions(relevant);
    
    setIsLoading(false);
  }, [pathname]);

  const filteredActions = selectedCategory === 'all' 
    ? actions 
    : actions.filter(action => action.category === selectedCategory);

  const displayedActions = filteredActions.slice(0, 8);

  const categories = [
    { id: 'all', label: 'All', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'create', label: 'Create', icon: <Plus className="h-4 w-4" /> },
    { id: 'property', label: 'Property', icon: <Home className="h-4 w-4" /> },
    { id: 'communication', label: 'Communicate', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'analysis', label: 'Analysis', icon: <PieChart className="h-4 w-4" /> }
  ];

  if (isLoading) {
    return (
      <div className={cn("w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-white/30 dark:border-slate-700/30 rounded-2xl shadow-2xl", className)}>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-14 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleActionClick = (action: QuickAction) => {
    router.push(action.url);
  };

  return (
    <TooltipProvider>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className={cn("w-96 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl overflow-hidden", className)}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 shadow-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">Productivity hub for real estate</p>
            </div>
          </div>

          {/* Context-Aware Suggestions */}
          {contextActions.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Smart Suggestions</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {contextActions.map((action) => (
                  <Tooltip key={action.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActionClick(action)}
                        className="h-8 px-3 text-xs bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-950/40 dark:hover:to-orange-950/40"
                      >
                        <div className="mr-1.5">{action.icon}</div>
                        {action.title}
                        {action.aiSuggested && <Star className="h-3 w-3 ml-1 text-amber-500" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{action.description}</p>
                      {action.shortcut && <p className="text-xs opacity-75">{action.shortcut}</p>}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(category.id as any)}
                className="flex-1 h-8 text-xs font-medium"
              >
                <div className="mr-1.5">{category.icon}</div>
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Actions Grid */}
        <div className="p-4 space-y-2 max-h-[calc(100vh-400px)]">
          <AnimatePresence mode="wait">
            {displayedActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                layout
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full h-auto p-4 flex items-center gap-4 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-teal-50/80 dark:hover:from-blue-950/30 dark:hover:to-teal-950/30 transition-all duration-300 rounded-xl border border-transparent hover:border-blue-200/50 dark:hover:border-blue-700/50 group hover:shadow-md relative overflow-hidden"
                      onClick={() => handleActionClick(action)}
                    >
                      {/* Background Gradient Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300" 
                           style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                      
                      {/* Icon */}
                      <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 relative z-10", action.gradient)}>
                        <div className="text-white">
                          {action.icon}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 text-left relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                            {action.title}
                          </span>
                          {action.aiSuggested && (
                            <Star className="h-4 w-4 text-amber-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                          {action.description}
                        </p>
                        {action.badge && (
                          <Badge variant="secondary" className="text-xs mt-2">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Shortcut & Arrow */}
                      <div className="flex flex-col items-end gap-1 relative z-10">
                        {action.shortcut && (
                          <Badge 
                            variant="outline" 
                            className="text-xs px-2 py-0.5 font-mono bg-background/80 border-border/50"
                          >
                            {action.shortcut}
                          </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <div className="max-w-xs">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm opacity-90">{action.description}</p>
                      {action.shortcut && (
                        <p className="text-xs opacity-75 mt-1">Shortcut: {action.shortcut}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {displayedActions.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="p-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-base font-medium text-slate-600 dark:text-slate-400 mb-2">
                No actions available
              </p>
              <p className="text-sm text-muted-foreground">
                Try switching to a different category
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
}