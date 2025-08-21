"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Plus,
  Mail,
  Calendar,
  UserPlus,
  MessageSquare,
  Settings,
  Zap,
  FileText,
  BarChart3,
  Users,
  Clock,
  Star,
  ArrowRight
} from 'lucide-react';
import { logger } from '@/lib/logger';

export const createTask = () => {
  window.location.href = '/app/tasks/create';
};

export const openChatAgent = () => {
  window.dispatchEvent(new Event('chat-agent:open'));
};

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  category: 'create' | 'navigate' | 'tools';
  action: () => void;
}

interface QuickActionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickActionsMenu({ isOpen, onClose }: QuickActionsMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const quickActions: QuickAction[] = [
    // Create Actions
    {
      id: 'new-lead',
      title: 'Create New Lead',
      description: 'Add a new lead to your pipeline',
      icon: <UserPlus className="h-4 w-4" />,
      shortcut: '⌘L',
      category: 'create',
      action: () => router.push('/app/pipeline?action=create')
    },
    {
      id: 'compose-email',
      title: 'Compose Email',
      description: 'Write and send a new email',
      icon: <Mail className="h-4 w-4" />,
      shortcut: '⌘E',
      category: 'create',
      action: () => router.push('/app/inbox?compose=true')
    },
    {
      id: 'schedule-meeting',
      title: 'Schedule Meeting',
      description: 'Create a new calendar event',
      icon: <Calendar className="h-4 w-4" />,
      shortcut: '⌘M',
      category: 'create',
      action: () => router.push('/app/calendar?action=create')
    },
    {
      id: 'new-task',
      title: 'Create Task',
      description: 'Add a new task to your list',
      icon: <Clock className="h-4 w-4" />,
      shortcut: '⌘T',
      category: 'create',
      action: () => router.push('/app/tasks?action=create')
    },

    // Navigate Actions
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      description: 'Return to the main dashboard',
      icon: <BarChart3 className="h-4 w-4" />,
      shortcut: '⌘D',
      category: 'navigate',
      action: () => router.push('/app')
    },
    {
      id: 'inbox',
      title: 'Open Inbox',
      description: 'View your email inbox',
      icon: <Mail className="h-4 w-4" />,
      shortcut: '⌘I',
      category: 'navigate',
      action: () => router.push('/app/inbox')
    },
    {
      id: 'pipeline',
      title: 'View Pipeline',
      description: 'See your sales pipeline',
      icon: <Users className="h-4 w-4" />,
      shortcut: '⌘P',
      category: 'navigate',
      action: () => router.push('/app/pipeline')
    },
    {
      id: 'calendar',
      title: 'Open Calendar',
      description: 'View your calendar',
      icon: <Calendar className="h-4 w-4" />,
      shortcut: '⌘C',
      category: 'navigate',
      action: () => router.push('/app/calendar')
    },

    // Tools Actions
    {
      id: 'settings',
      title: 'Open Settings',
      description: 'Configure your account',
      icon: <Settings className="h-4 w-4" />,
      shortcut: '⌘,',
      category: 'tools',
      action: () => router.push('/app/settings')
    },
    {
      id: 'integrations',
      title: 'Manage Integrations',
      description: 'Connect external services',
      icon: <Zap className="h-4 w-4" />,
      shortcut: '⌘J',
      category: 'tools',
      action: () => router.push('/app/settings/integrations')
    },
    {
      id: 'reports',
      title: 'View Reports',
      description: 'Analytics and insights',
      icon: <FileText className="h-4 w-4" />,
      shortcut: '⌘R',
      category: 'tools',
      action: () => router.push('/app/analytics')
    },
    {
      id: 'chat',
      title: 'AI Chat Assistant',
      description: 'Get help and insights',
      icon: <MessageSquare className="h-4 w-4" />,
      shortcut: '⌘H',
      category: 'tools',
      action: () => router.push('/app/chat')
    }
  ];

  const filteredActions = quickActions.filter(action =>
    action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredActions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredActions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredActions[selectedIndex]) {
            filteredActions[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredActions, onClose]);

  const groupedActions = {
    create: filteredActions.filter(a => a.category === 'create'),
    navigate: filteredActions.filter(a => a.category === 'navigate'),
    tools: filteredActions.filter(a => a.category === 'tools')
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center glass-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="relative w-full max-w-2xl glass-modal overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--glass-border)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search actions or type a command..."
                  className="pl-10 pr-4"
                  autoFocus
                />
              </div>
            </div>

            {/* Actions List */}
            <ScrollArea className="max-h-[400px]">
              <div className="p-2">
                {Object.entries(groupedActions).map(([category, actions]) => {
                  if (actions.length === 0) return null;
                  
                  return (
                    <div key={category} className="mb-4">
                      <h3 className="text-xs font-semibold text-[var(--glass-text-secondary)] uppercase tracking-wider px-2 mb-2">
                        {category}
                      </h3>
                      <div className="space-y-1">
                        {actions.map((action, index) => {
                          const globalIndex = filteredActions.indexOf(action);
                          const isSelected = globalIndex === selectedIndex;
                          
                          return (
                            <motion.button
                              key={action.id}
                              onClick={() => {
                                action.action();
                                onClose();
                              }}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all glass-hover-pulse ${
                                isSelected
                                  ? 'bg-[var(--glass-surface-hover)] border-[var(--glass-primary)]'
                                  : 'hover:bg-[var(--glass-surface-hover)] border-transparent'
                              } border`}
                            >
                              <div className="text-slate-600 dark:text-slate-400">
                                {action.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                  {action.title}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                  {action.description}
                                </div>
                              </div>
                              {action.shortcut && (
                                <div className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                  {action.shortcut}
                                </div>
                              )}
                              {isSelected && (
                                <ArrowRight className="h-4 w-4 text-blue-500" />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {filteredActions.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">No actions found</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  <span>↑↓ Navigate</span>
                  <span>↵ Select</span>
                  <span>Esc Close</span>
                </div>
                <span>{filteredActions.length} actions</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
