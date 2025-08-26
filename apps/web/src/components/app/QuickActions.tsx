"use client";

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Mail,
  Calendar,
  MessageSquare,
  UserPlus,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatAgent = dynamic(() => import('./ChatAgent'), { ssr: false });

/**
 * Floating quick actions menu.
 *
 * Keyboard shortcuts:
 *  - ⌘E: Compose Email
 *  - ⌘M: Schedule Meeting
 *  - ⌘L: Add Lead
 *  - ⌘C: Start Chat
 *  - ⌘N: Create Note
 */
export function useQuickActionCallbacks() {
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  // Apply dashboard modal blur effects when modal is open
  useEffect(() => {
    if (noteOpen) {
      document.body.classList.add('dashboard-modal-open');
    } else {
      document.body.classList.remove('dashboard-modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('dashboard-modal-open');
    };
  }, [noteOpen]);

  const composeEmail = useCallback(() => {
    router.push('/app/inbox/compose');
  }, [router]);

  const scheduleMeeting = useCallback(() => {
    router.push('/app/calendar');
  }, [router]);

  const addLead = useCallback(() => {
    router.push('/app/pipeline/create');
  }, [router]);

  const startChat = useCallback(() => setChatOpen(true), []);
  const createNote = useCallback(() => setNoteOpen(true), []);

  const chatModal = (
    <ChatAgent isOpen={chatOpen} onClose={() => setChatOpen(false)} />
  );

  const noteModal = (
    <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Note</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          Note creation coming soon.
        </div>
      </DialogContent>
    </Dialog>
  );

  return {
    composeEmail,
    scheduleMeeting,
    addLead,
    startChat,
    createNote,
    chatModal,
    noteModal
  };
}

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
  const {
    composeEmail,
    scheduleMeeting,
    addLead,
    startChat,
    createNote,
    chatModal,
    noteModal
  } = useQuickActionCallbacks();

  const quickActions: QuickAction[] = [
    {
      id: 'compose-email',
      label: 'Compose Email',
      icon: <Mail className="h-4 w-4" />,
      onClick: composeEmail,
      color: 'blue',
      shortcut: '⌘E'
    },
    {
      id: 'schedule-meeting',
      label: 'Schedule Meeting',
      icon: <Calendar className="h-4 w-4" />,
      onClick: scheduleMeeting,
      color: 'green',
      shortcut: '⌘M'
    },
    {
      id: 'add-lead',
      label: 'Add Lead',
      icon: <UserPlus className="h-4 w-4" />,
      onClick: addLead,
      color: 'purple',
      shortcut: '⌘L'
    },
    {
      id: 'start-chat',
      label: 'Start Chat',
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: startChat,
      color: 'teal',
      shortcut: '⌘C'
    },
    {
      id: 'create-note',
      label: 'Create Note',
      icon: <FileText className="h-4 w-4" />,
      onClick: createNote,
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
      {chatModal}
      {noteModal}
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
        className="h-14 w-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 dark:from-indigo-600 dark:to-purple-700 dark:hover:from-indigo-500 dark:hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {primaryAction.icon}
      </Button>
    </div>
  );
}
