"use client";
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  DollarSign, 
  Calendar,
  Mail,
  Phone,
  MoreHorizontal,
  TrendingUp,
  AlertCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ExternalLink,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lead } from './PipelineBoard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface EmailThread {
  id: string;
  subject: string;
  participants: Array<{ name: string; email: string }>;
  lastMessageAt: string;
  messageCount: number;
  unread: boolean;
  starred: boolean;
  aiAnalysis?: {
    category: string;
    urgency: string;
    keyEntities: any;
  } | null;
}

interface LeadThreadsResponse {
  threads: EmailThread[];
  contactInfo: {
    email: string | null;
    name: string | null;
  };
  totalThreads: number;
}

interface PipelineCardProps {
  lead: Lead;
  isDragging?: boolean;
}

export default function PipelineCard({ lead, isDragging = false }: PipelineCardProps) {
  const [emailThreads, setEmailThreads] = useState<EmailThread[]>([]);
  const [threadsExpanded, setThreadsExpanded] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [contactInfo, setContactInfo] = useState<{ email: string | null; name: string | null }>({ 
    email: null, 
    name: null 
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBeingDragged = isDragging || isSortableDragging;

  // Fetch email threads for this lead
  useEffect(() => {
    const fetchEmailThreads = async () => {
      if (!lead.id) return;
      
      setLoadingThreads(true);
      try {
        const response = await fetch(`/api/pipeline/leads/${lead.id}/threads`);
        if (response.ok) {
          const data: LeadThreadsResponse = await response.json();
          setEmailThreads(data.threads);
          setContactInfo(data.contactInfo);
        } else {
          console.error('Failed to fetch email threads for lead:', lead.id);
        }
      } catch (error) {
        console.error('Error fetching email threads:', error);
      } finally {
        setLoadingThreads(false);
      }
    };

    fetchEmailThreads();
  }, [lead.id]);

  const priorityColors = {
    low: 'text-slate-500',
    medium: 'text-amber-500',
    high: 'text-red-500'
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}m ago`;
  };

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative glass-card rounded-xl p-4 cursor-grab active:cursor-grabbing glass-hover-tilt',
        isBeingDragged && 'glass-border-active ring-2 ring-teal-400/50 rotate-2'
      )}
      whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
    >
      {/* Drag wake effect */}
      {isBeingDragged && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-azure-400/20 rounded-xl blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ transform: 'scale(1.1)' }}
        />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">
              {lead.title}
            </h4>
            <div className="flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3 text-slate-400" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {lead.company}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {lead.priority === 'high' && (
              <AlertCircle className={cn('h-3 w-3', priorityColors[lead.priority])} />
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Phone className="h-4 w-4 mr-2" />
                  Schedule Call
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="h-4 w-4 mr-2" />
                  Add Meeting
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    const enabled = !lead.automationEnabled;
                    fetch(`/api/pipeline/leads/${lead.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ automationEnabled: enabled })
                    }).then(() => window.location.reload());
                  }}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {lead.automationEnabled ? 'Disable' : 'Enable'} Follow-up
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Delete Lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex items-center gap-1 mb-3">
          <User className="h-3 w-3 text-slate-400" />
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {lead.contact}
          </span>
          {lead.threadId && (
            <div className="ml-auto">
              <Mail className="h-3 w-3 text-teal-500" title="Linked to email thread" />
            </div>
          )}
        </div>

        {/* Value and Probability */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-green-500" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              ${lead.value.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {lead.probability}%
            </span>
          </div>
        </div>

        {/* Tags */}
        {lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {lead.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full"
              >
                {tag}
              </span>
            ))}
            {lead.tags.length > 2 && (
              <span className="text-xs text-slate-500">
                +{lead.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Email Threads */}
        {emailThreads.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3 text-slate-500" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Email Threads ({emailThreads.length})
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm" 
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setThreadsExpanded(!threadsExpanded);
                }}
              >
                {threadsExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>
            
            {threadsExpanded && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {emailThreads.slice(0, 3).map((thread) => (
                  <div
                    key={thread.id}
                    className="group flex items-start gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/app/inbox?thread=${thread.id}`, '_blank');
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                          {thread.subject || 'No Subject'}
                        </span>
                        {thread.unread && (
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                        {thread.aiAnalysis?.category && (
                          <span className="text-xs px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded flex-shrink-0">
                            {thread.aiAnalysis.category.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{getTimeAgo(thread.lastMessageAt)}</span>
                        <span>• {thread.messageCount} msg{thread.messageCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <ExternalLink className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                ))}
                {emailThreads.length > 3 && (
                  <div className="text-xs text-slate-500 text-center py-1">
                    +{emailThreads.length - 3} more threads
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{getTimeAgo(lead.updatedAt)}</span>
          <div className="flex items-center gap-1">
            {lead.activities && lead.activities.length > 0 && (
              <>
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <span>{lead.activities.length} activities</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
