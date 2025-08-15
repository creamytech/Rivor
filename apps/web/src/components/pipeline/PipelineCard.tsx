"use client";
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Building2, 
  User, 
  DollarSign, 
  Calendar,
  Mail,
  Phone,
  MoreHorizontal,
  TrendingUp,
  AlertCircle
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

interface PipelineCardProps {
  lead: Lead;
  isDragging?: boolean;
}

export default function PipelineCard({ lead, isDragging = false }: PipelineCardProps) {
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
        'group relative bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700',
        'hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing',
        isBeingDragged && 'shadow-lg ring-2 ring-teal-400/50 rotate-2'
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
