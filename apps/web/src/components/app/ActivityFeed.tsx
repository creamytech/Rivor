"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { 
  Activity, 
  Mail, 
  Calendar, 
  UserPlus, 
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityItem {
  id: string;
  type: 'email' | 'meeting' | 'lead' | 'chat' | 'task';
  title: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'urgent';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ActivityFeedProps {
  className?: string;
}

export default function ActivityFeed({ className = '' }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Simulate real-time activity updates
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'email',
        title: 'New lead detected from email',
        description: 'Sarah Johnson from TechCorp inquired about enterprise pricing',
        timestamp: '2 min ago',
        status: 'urgent',
        action: {
          label: 'Review',
          onClick: () => console.log('Review lead')
        }
      },
      {
        id: '2',
        type: 'meeting',
        title: 'Meeting scheduled for tomorrow',
        description: 'Product demo with Acme Corp at 2:00 PM',
        timestamp: '5 min ago',
        status: 'pending',
        action: {
          label: 'View',
          onClick: () => console.log('View meeting')
        }
      },
      {
        id: '3',
        type: 'lead',
        title: 'Pipeline stage updated',
        description: 'Lead "John Smith" moved to Proposal stage',
        timestamp: '8 min ago',
        status: 'completed'
      },
      {
        id: '4',
        type: 'chat',
        title: 'AI assistant responded',
        description: 'Generated follow-up email for recent inquiry',
        timestamp: '12 min ago',
        status: 'completed',
        action: {
          label: 'Review',
          onClick: () => console.log('Review response')
        }
      },
      {
        id: '5',
        type: 'task',
        title: 'Task completed: Follow up call',
        description: 'Successfully contacted 3 prospects',
        timestamp: '15 min ago',
        status: 'completed'
      }
    ];

    setActivities(mockActivities);
  }, []);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'lead': return <UserPlus className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'task': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'email': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600';
      case 'meeting': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-600';
      case 'lead': return 'bg-green-100 dark:bg-green-900/20 text-green-600';
      case 'chat': return 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600';
      case 'task': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-600';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-600';
    }
  };

  const getActivityAvatar = (type: ActivityItem['type']) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-cyan-500', 'bg-orange-500'];
    const initials = ['E', 'M', 'L', 'C', 'T'];
    const index = ['email', 'meeting', 'lead', 'chat', 'task'].indexOf(type);
    return { color: colors[index] || 'bg-gray-500', initial: initials[index] || 'A' };
  };

  const getStatusColor = (status: ActivityItem['status']) => {
    switch (status) {
      case 'urgent': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: ActivityItem['status']) => {
    switch (status) {
      case 'urgent': return <AlertCircle className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const displayedActivities = isExpanded ? activities : activities.slice(0, 3);

  return (
    <GlassCard variant="river-flow" intensity="medium" flowDirection="right" className={`${className}`}>
      <GlassCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <GlassCardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Live Activity
          </GlassCardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm"
          >
            {isExpanded ? 'Show Less' : `Show All (${activities.length})`}
          </Button>
        </div>
      </GlassCardHeader>
      <GlassCardContent className="pt-0">
        <div className="space-y-3">
          <AnimatePresence>
            {displayedActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="relative">
                    {/* Activity icon with colored background */}
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    {/* Small avatar indicator */}
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${getActivityAvatar(activity.type).color} flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-slate-800`}>
                      {getActivityAvatar(activity.type).initial}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm leading-tight text-slate-900 dark:text-slate-100">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(activity.status)}`}
                        >
                          {getStatusIcon(activity.status)}
                          <span className="ml-1 capitalize">{activity.status}</span>
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {activity.timestamp}
                        </span>
                      </div>
                    </div>
                    
                    {activity.action && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={activity.action.onClick}
                        className="text-xs h-7 px-2"
                      >
                        {activity.action.label}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {!isExpanded && activities.length > 3 && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="w-full text-sm"
            >
              View {activities.length - 3} more activities
            </Button>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
