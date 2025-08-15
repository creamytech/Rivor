"use client";
import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import PipelineCard from './PipelineCard';
import { Plus, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PipelineStage } from './PipelineBoard';

interface PipelineColumnProps {
  stage: PipelineStage;
  onCreateLead: () => void;
}

export default function PipelineColumn({ stage, onCreateLead }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const totalValue = stage.leads.reduce((sum, lead) => sum + lead.value, 0);
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 transition-colors',
        isOver && 'bg-teal-50 dark:bg-teal-950/30 ring-2 ring-teal-400/50'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {stage.name}
          </h3>
          <span className="text-sm text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
            {stage.leads.length}
          </span>
          {/* Flow LED for recent activity */}
          {stage.recentActivity && !prefersReducedMotion && (
            <motion.div
              className="w-2 h-2 bg-teal-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </div>
        
        <button
          onClick={onCreateLead}
          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Total Value */}
      <div className="mb-4 p-3 bg-white dark:bg-slate-800 rounded-lg">
        <div className="text-xs text-slate-500 uppercase tracking-wide">Total Value</div>
        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
          ${totalValue.toLocaleString()}
        </div>
      </div>

      {/* Lead Cards */}
      <SortableContext items={stage.leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 flex-1">
          {stage.leads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? {} : { delay: index * 0.1 }}
            >
              <PipelineCard lead={lead} />
            </motion.div>
          ))}
          
          {stage.leads.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <div className="mb-2">No leads yet</div>
              <button
                onClick={onCreateLead}
                className="text-sm text-teal-500 hover:text-teal-600 transition-colors"
              >
                Add your first lead
              </button>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
