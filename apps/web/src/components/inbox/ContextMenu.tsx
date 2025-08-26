"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  MailOpen,
  Star,
  Archive,
  Trash2,
  Tag,
  Reply,
  ReplyAll,
  Forward,
  MoreHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  thread: {
    id: string;
    isRead: boolean;
    starred: boolean;
    labelIds: string[];
  } | null;
  onAction: (action: string, threadId: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: string;
  shortcut?: string;
  divider?: boolean;
  danger?: boolean;
}

export function ContextMenu({ 
  isOpen, 
  position, 
  onClose, 
  thread,
  onAction 
}: ContextMenuProps) {
  const { theme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // Prevent page scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    // Reposition menu if it goes off-screen
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      // Adjust horizontal position
      if (rect.right > viewportWidth) {
        newX = viewportWidth - rect.width - 10;
      }

      // Adjust vertical position
      if (rect.bottom > viewportHeight) {
        newY = viewportHeight - rect.height - 10;
      }

      if (newX !== position.x || newY !== position.y) {
        menu.style.left = `${newX}px`;
        menu.style.top = `${newY}px`;
      }
    }
  }, [isOpen, position]);

  if (!thread) return null;

  const menuItems: MenuItem[] = [
    {
      id: 'read',
      label: thread.isRead ? 'Mark as Unread' : 'Mark as Read',
      icon: thread.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />,
      action: thread.isRead ? 'mark-unread' : 'mark-read',
      shortcut: 'U'
    },
    {
      id: 'star',
      label: thread.starred ? 'Remove Star' : 'Add Star',
      icon: <Star className={`h-4 w-4 ${thread.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />,
      action: thread.starred ? 'unstar' : 'star',
      shortcut: 'S'
    },
    {
      id: 'divider1',
      label: '',
      icon: null,
      action: '',
      divider: true
    },
    {
      id: 'reply',
      label: 'Reply',
      icon: <Reply className="h-4 w-4" />,
      action: 'reply',
      shortcut: 'R'
    },
    {
      id: 'reply-all',
      label: 'Reply All',
      icon: <ReplyAll className="h-4 w-4" />,
      action: 'reply-all',
      shortcut: 'A'
    },
    {
      id: 'forward',
      label: 'Forward',
      icon: <Forward className="h-4 w-4" />,
      action: 'forward',
      shortcut: 'F'
    },
    {
      id: 'divider2',
      label: '',
      icon: null,
      action: '',
      divider: true
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: <Archive className="h-4 w-4" />,
      action: 'archive',
      shortcut: 'E'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      action: 'delete',
      shortcut: 'Del',
      danger: true
    },
    {
      id: 'divider3',
      label: '',
      icon: null,
      action: '',
      divider: true
    },
    {
      id: 'label',
      label: 'Add Label',
      icon: <Tag className="h-4 w-4" />,
      action: 'add-label',
      shortcut: 'L'
    },
    {
      id: 'more',
      label: 'More Actions',
      icon: <MoreHorizontal className="h-4 w-4" />,
      action: 'more'
    }
  ];

  const handleItemClick = (item: MenuItem) => {
    if (item.divider || !item.action) return;
    
    onAction(item.action, thread.id);
    onClose();
  };

  const getGlassStyles = () => {
    if (theme === 'black') {
      return {
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      };
    } else {
      return {
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
      };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'transparent' }}
          />
          
          {/* Context Menu */}
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed z-50 min-w-[240px] py-2 rounded-xl"
            style={{
              left: position.x,
              top: position.y,
              ...getGlassStyles()
            }}
          >
            {menuItems.map((item, index) => {
              if (item.divider) {
                return (
                  <div
                    key={item.id}
                    className={`mx-2 my-1 h-px ${
                      theme === 'black' 
                        ? 'bg-white/10' 
                        : 'bg-black/10'
                    }`}
                  />
                );
              }

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ 
                    backgroundColor: theme === 'black' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.05)',
                    x: 2
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleItemClick(item)}
                  className={`
                    mx-2 px-3 py-2.5 rounded-lg cursor-pointer flex items-center gap-3
                    transition-colors duration-150 select-none
                    ${item.danger 
                      ? `hover:bg-red-500/10 ${theme === 'black' ? 'text-red-400' : 'text-red-600'}` 
                      : theme === 'black' ? 'text-white/90' : 'text-black/90'
                    }
                  `}
                >
                  <span className="flex-shrink-0">
                    {item.icon}
                  </span>
                  
                  <span className="flex-1 text-sm font-medium">
                    {item.label}
                  </span>
                  
                  {item.shortcut && (
                    <span className={`
                      text-xs px-2 py-1 rounded-md font-mono
                      ${theme === 'black' 
                        ? 'text-white/50 bg-white/10' 
                        : 'text-black/50 bg-black/10'
                      }
                    `}>
                      {item.shortcut}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}