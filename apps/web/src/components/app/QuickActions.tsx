"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';
import { 
  Mail, 
  Calendar, 
  Plus, 
  MessageSquare, 
  UserPlus,
  FileText,
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
  shortcut?: string;
}

interface QuickActionsProps {
  className?: string;
}

export default function QuickActions({ className = '' }: QuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: 'compose-email',
      label: 'Compose Email',
      icon: <Mail className="h-4 w-4" />,
      onClick: () => logger.info('Quick action', { action: 'compose-email' }),
      color: 'blue',
      shortcut: '⌘E'
    },
    {
      id: 'schedule-meeting',
      label: 'Schedule Meeting',
      icon: <Calendar className="h-4 w-4" />,
      onClick: () => logger.info('Quick action', { action: 'schedule-meeting' }),
      color: 'green',
      shortcut: '⌘M'
    },
    {
      id: 'add-lead',
      label: 'Add Lead',
      icon: <UserPlus className="h-4 w-4" />,
      onClick: () => logger.info('Quick action', { action: 'add-lead' }),
      color: 'purple',
      shortcut: '⌘L'
    },
    {
      id: 'start-chat',
      label: 'Start Chat',
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: () => logger.info('Quick action', { action: 'start-chat' }),
      color: 'teal',
      shortcut: '⌘C'
    },
    {
      id: 'create-note',
      label: 'Create Note',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => logger.info('Quick action', { action: 'create-note' }),
      color: 'orange',
      shortcut: '⌘N'
    }
  ];

  const primaryAction = {
    id: 'quick-menu',
    label: 'Quick Actions',
    icon: isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />,
    onClick: () => setIsExpanded(!isExpanded),
    color: 'indigo'
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="mb-4 space-y-2"
          >
            {quickActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  onClick={action.onClick}
                  className={`h-12 px-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-200 group`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900/20 text-${action.color}-600 dark:text-${action.color}-400 group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">{action.label}</div>
                      {action.shortcut && (
                        <div className="text-xs text-muted-foreground">{action.shortcut}</div>
                      )}
                    </div>
                  </div>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Action Button */}
      <Button
        onClick={primaryAction.onClick}
        className="h-14 w-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {primaryAction.icon}
      </Button>
    </div>
  );
}
