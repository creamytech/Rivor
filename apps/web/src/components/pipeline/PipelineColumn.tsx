"use client";
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import PipelineCard from './PipelineCard';
import { EmptyState } from '@/components/ui/empty-state';

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  leads: Array<{
    id: string;
    title: string;
    value: number;
    contact: {
      name: string;
      email: string;
    };
    probability: number;
    expectedCloseDate: string;
  }>;
  recentActivity?: boolean;
}

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
            <EmptyState
              icon={<Plus className="h-5 w-5" />}
              title="No leads yet"
              description={`Add your first lead to the ${stage.name} stage to get started.`}
              illustration="bubbles"
              size="sm"
              actions={[
                {
                  label: "Add Lead",
                  onClick: onCreateLead,
                  variant: 'default',
                  icon: <Plus className="h-4 w-4" />
                }
              ]}
            />
          )}
        </div>
      </SortableContext>
    </div>
  );
}
