"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  X,
  Mail,
  Calendar,
  UserPlus,
  CheckCircle,
  Settings,
  Zap,
  ArrowRight
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'email' | 'meeting' | 'lead' | 'system' | 'integration' | 'task';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    href: string;
  };
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const router = useRouter();

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        const parsed = data.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
        setNotifications(parsed);
      } catch (err) {
        console.error('Error loading notifications', err);
      }
    };

    loadNotifications();
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'lead': return <UserPlus className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      case 'integration': return <Zap className="h-4 w-4" />;
      case 'task': return <CheckCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'email': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600';
      case 'meeting': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-600';
      case 'lead': return 'bg-green-100 dark:bg-green-900/20 text-green-600';
      case 'system': return 'bg-gray-100 dark:bg-gray-900/20 text-gray-600';
      case 'integration': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-600';
      case 'task': return 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-600';
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'high') return notification.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.isRead).length;

  const updateReadStatus = async (id: string, isRead: boolean) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead } : n));
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: isRead })
      });
    } catch (err) {
      console.error('Failed to update notification', err);
    }
  };

  const toggleRead = (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif) return;
    updateReadStatus(id, !notif.isRead);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    notifications.forEach(n => {
      if (!n.isRead) {
        fetch(`/api/notifications/${n.id}/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true })
        }).catch(err => console.error('Failed to update notification', err));
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed top-16 right-4 z-50 w-96 max-h-[600px] bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {unreadCount} unread, {highPriorityCount} high priority
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1 p-2 border-b border-slate-200 dark:border-slate-700">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'high', label: 'High Priority', count: highPriorityCount }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-[400px]">
            <div className="p-2">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No notifications</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        notification.isRead
                          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 shadow-sm'
                      }`}
                      onClick={() => toggleRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getPriorityColor(notification.priority)}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className={`font-medium text-sm leading-tight ${
                                notification.isRead 
                                  ? 'text-slate-600 dark:text-slate-400' 
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}>
                                {notification.title}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                                {notification.priority === 'high' && (
                                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                    High Priority
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {notification.action && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(notification.action.href);
                                }}
                                className="text-xs h-7 px-2"
                              >
                                {notification.action.label}
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/app/notifications'}
              className="w-full text-sm"
            >
              View All Notifications
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
