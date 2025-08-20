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
  Zap, 
  Users, 
  Home,
  Star,
  X,
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
  shortcut?: string;
  aiSuggested?: boolean;
}

interface FloatingActionButtonProps {
  className?: string;
}

export default function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actions] = useState<QuickAction[]>([
    {
      id: 'add-lead',
      title: 'Add Lead',
      description: 'Create a new lead',
      icon: <User className="h-4 w-4" />,
      gradient: 'from-blue-500 to-cyan-500',
      url: '/app/contacts/new',
      shortcut: '⌘L',
      aiSuggested: true
    },
    {
      id: 'schedule-meeting',
      title: 'Schedule Meeting',
      description: 'Book a new meeting',
      icon: <Calendar className="h-4 w-4" />,
      gradient: 'from-green-500 to-emerald-500',
      url: '/app/calendar/new',
      shortcut: '⌘M'
    },
    {
      id: 'compose-email',
      title: 'Compose Email',
      description: 'Send a new email',
      icon: <Mail className="h-4 w-4" />,
      gradient: 'from-purple-500 to-pink-500',
      url: '/app/inbox/compose',
      shortcut: '⌘E'
    },
    {
      id: 'add-property',
      title: 'Add Property',
      description: 'List new property',
      icon: <Home className="h-4 w-4" />,
      gradient: 'from-orange-500 to-red-500',
      url: '/app/properties/new',
      shortcut: '⌘P'
    },
    {
      id: 'create-task',
      title: 'Create Task',
      description: 'Add a new task',
      icon: <CheckSquare className="h-4 w-4" />,
      gradient: 'from-indigo-500 to-blue-500',
      url: '/app/tasks/new',
      shortcut: '⌘T'
    }
  ]);
  
  const router = useRouter();

  const handleActionClick = (action: QuickAction) => {
    router.push(action.url);
    setIsOpen(false);
  };

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

  return (
    <TooltipProvider>
      <div className={cn("relative", className)}>
        {/* Backdrop */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Action Items */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="absolute bottom-20 right-0 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-border/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 shadow-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Quick Actions</h3>
                      <p className="text-xs text-muted-foreground">Create and manage</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Actions List */}
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {actions.map((action, index) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full h-auto p-3 flex items-center gap-3 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-teal-50/80 dark:hover:from-blue-950/30 dark:hover:to-teal-950/30 transition-all duration-300 rounded-xl border border-transparent hover:border-blue-200/50 dark:hover:border-blue-700/50 group hover:shadow-md"
                          onClick={() => handleActionClick(action)}
                        >
                          {/* Icon */}
                          <div className={cn("p-2 rounded-lg bg-gradient-to-br shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300", action.gradient)}>
                            <div className="text-white">
                              {action.icon}
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                {action.title}
                              </span>
                              {action.aiSuggested && (
                                <Star className="h-3 w-3 text-amber-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {action.description}
                            </p>
                          </div>
                          
                          {/* Shortcut */}
                          {action.shortcut && (
                            <Badge 
                              variant="outline" 
                              className="text-xs px-2 py-0.5 font-mono bg-background/80 border-border/50"
                            >
                              {action.shortcut}
                            </Badge>
                          )}
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
              </div>

              {/* Footer */}
              <div className="p-4 pt-2 border-t border-border/20 bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>AI-powered suggestions based on your workflow</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-50"
            >
              <Button
                size="lg"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  "h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 shadow-2xl hover:shadow-3xl transition-all duration-300 border-0",
                  isOpen && "rotate-45"
                )}
              >
                <Plus className="h-8 w-8 text-white" />
              </Button>
              
              {/* Notification Badge */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-xs font-bold text-white">3</span>
              </div>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Quick Actions (⌘Space)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}