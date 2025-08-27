"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CheckSquare, 
  Calendar, 
  Mail, 
  Plus, 
  ExternalLink,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrossModuleWidgetProps {
  context: 'inbox' | 'tasks' | 'contacts' | 'calendar';
  entityId?: string;
  entityType?: string;
  className?: string;
}

interface RelatedItem {
  id: string;
  type: 'task' | 'contact' | 'email' | 'calendar';
  title: string;
  subtitle?: string;
  status?: string;
  priority?: string;
  date?: string;
}

export function CrossModuleWidget({ 
  context, 
  entityId, 
  entityType, 
  className 
}: CrossModuleWidgetProps) {
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (entityId) {
      fetchRelatedItems();
    }
  }, [entityId, context]);

  const fetchRelatedItems = async () => {
    if (!entityId) return;
    
    setLoading(true);
    try {
      // Fetch related items based on context
      let url = '';
      if (context === 'contacts') {
        url = `/api/integration/contact-relations?contactId=${entityId}`;
      } else if (context === 'inbox') {
        url = `/api/integration/suggestions?context=inbox&entityId=${entityId}`;
      }

      if (url) {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          
          if (context === 'contacts') {
            const items: RelatedItem[] = [
              ...(data.tasks || []).map((task: any) => ({
                id: task.id,
                type: 'task' as const,
                title: task.title,
                subtitle: `${task.status} • ${task.priority} priority`,
                status: task.status,
                priority: task.priority,
                date: task.dueAt
              })),
              ...(data.emailThreads || []).map((thread: any) => ({
                id: thread.id,
                type: 'email' as const,
                title: thread.subject,
                subtitle: `${thread.messageCount} messages`,
                date: thread.updatedAt
              })),
              ...(data.calendarEvents || []).map((event: any) => ({
                id: event.id,
                type: 'calendar' as const,
                title: event.title,
                subtitle: new Date(event.start).toLocaleDateString(),
                date: event.start
              }))
            ];
            setRelatedItems(items);
          } else {
            setSuggestions(data.suggestions || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch related items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'task': return CheckSquare;
      case 'contact': return Users;
      case 'email': return Mail;
      case 'calendar': return Calendar;
      default: return ExternalLink;
    }
  };

  const handleItemClick = (item: RelatedItem) => {
    switch (item.type) {
      case 'task':
        window.location.href = `/app/tasks?task=${item.id}`;
        break;
      case 'contact':
        window.location.href = `/app/contacts?contact=${item.id}`;
        break;
      case 'email':
        window.location.href = `/app/inbox?thread=${item.id}`;
        break;
      case 'calendar':
        window.location.href = `/app/calendar?event=${item.id}`;
        break;
    }
  };

  const createQuickTask = async () => {
    if (!entityId) return;

    try {
      const response = await fetch('/api/integration/task-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Follow up on ${context}`,
          description: `Quick task created from ${context} view`,
          priority: 'medium',
          ...(context === 'contacts' && { linkedContactId: entityId }),
          ...(context === 'inbox' && { linkedThreadId: entityId })
        })
      });

      if (response.ok) {
        fetchRelatedItems(); // Refresh the related items
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  if (!entityId || (relatedItems.length === 0 && suggestions.length === 0 && !loading)) {
    return null;
  }

  return (
    <Card className={cn("glass-card", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Lightbulb className="h-4 w-4 text-blue-500" />
          Cross-Platform Insights
          <Badge variant="outline" className="ml-auto text-xs">
            {relatedItems.length + suggestions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {relatedItems.slice(0, 5).map((item) => {
              const Icon = getItemIcon(item.type);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => handleItemClick(item)}
                >
                  <Icon className="h-3 w-3 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                    )}
                  </div>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                </motion.div>
              );
            })}

            {suggestions.slice(0, 3).map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 cursor-pointer"
                onClick={() => {
                  if (suggestion.action === 'create_task_from_email') {
                    createQuickTask();
                  }
                }}
              >
                <Lightbulb className="h-3 w-3 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{suggestion.title}</p>
                  <p className="text-xs text-blue-600 truncate">Suggested action</p>
                </div>
                <Badge className="text-xs bg-blue-100 text-blue-800">
                  {suggestion.urgency}
                </Badge>
              </motion.div>
            ))}

            {relatedItems.length === 0 && suggestions.length === 0 && (
              <div className="text-center py-4">
                <p className="text-xs text-gray-500 mb-2">No related items found</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={createQuickTask}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create Task
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}