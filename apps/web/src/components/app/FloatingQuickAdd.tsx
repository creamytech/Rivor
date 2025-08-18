"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  UserPlus, 
  Calendar, 
  Mail, 
  X,
  GitBranch,
  MessageSquare
} from 'lucide-react';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

interface FloatingQuickAddProps {
  className?: string;
}

export default function FloatingQuickAdd({ className = '' }: FloatingQuickAddProps) {
  const [isOpen, setIsOpen] = useState(false);

  const quickActions: QuickAction[] = [
    {
      label: 'Add Lead',
      icon: <UserPlus className="h-4 w-4" />,
      action: () => {
        window.location.href = '/app/pipeline/create';
        setIsOpen(false);
      },
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      label: 'Schedule Meeting',
      icon: <Calendar className="h-4 w-4" />,
      action: () => {
        window.location.href = '/app/calendar';
        setIsOpen(false);
      },
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      label: 'Compose Email',
      icon: <Mail className="h-4 w-4" />,
      action: () => {
        window.location.href = '/app/inbox/compose';
        setIsOpen(false);
      },
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      label: 'New Deal',
      icon: <GitBranch className="h-4 w-4" />,
      action: () => {
        window.location.href = '/app/pipeline/create';
        setIsOpen(false);
      },
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      label: 'Ask AI',
      icon: <MessageSquare className="h-4 w-4" />,
      action: () => {
        window.location.href = '/app/chat';
        setIsOpen(false);
      },
      color: 'bg-teal-500 hover:bg-teal-600'
    }
  ];

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 mb-2"
          >
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-2 min-w-[200px]">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={action.action}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-sm text-white rounded-md
                    transition-all duration-200 hover:scale-105
                    ${action.color}
                  `}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full shadow-lg border-2 border-white dark:border-slate-800
          bg-gradient-to-br from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600
          flex items-center justify-center text-white transition-all duration-200
          ${isOpen ? 'rotate-45' : 'rotate-0'}
        `}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="plus"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
