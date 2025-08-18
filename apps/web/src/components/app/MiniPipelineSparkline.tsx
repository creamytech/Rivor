"use client";
import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { TrendingUp, TrendingDown, BarChart3, Users, Clock, Plus, Settings } from 'lucide-react';

interface PipelineStage {
  id: string;
  name: string;
  color: string | null;
  order: number;
  _count: {
    leads: number;
  };
}

interface MiniPipelineSparklineProps {
  stages: PipelineStage[];
  totalLeads: number;
  conversionRate: number;
}

export default function MiniPipelineSparkline({ 
  stages = [], 
  totalLeads = 0, 
  conversionRate = 0 
}: MiniPipelineSparklineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort stages by order
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  
  // Calculate max count for scaling
  const maxCount = Math.max(...sortedStages.map(stage => stage._count.leads), 1);
  
  // Calculate drop-off rates
  const dropOffRates = sortedStages.map((stage, index) => {
    if (index === 0) return 0;
    const previousCount = sortedStages[index - 1]._count.leads;
    const currentCount = stage._count.leads;
    return previousCount > 0 ? ((previousCount - currentCount) / previousCount) * 100 : 0;
  });

  const getDropOffColor = (rate: number) => {
    if (rate <= 10) return 'text-green-500';
    if (rate <= 25) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getDropOffIcon = (rate: number) => {
    if (rate <= 10) return <TrendingUp className="h-3 w-3" />;
    if (rate <= 25) return <Clock className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  return (
    <GlassCard variant="river-flow" intensity="medium" flowDirection="left" className="h-full">
      <GlassCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            <GlassCardTitle className="text-lg">Pipeline</GlassCardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {conversionRate}% conversion
          </Badge>
        </div>
      </GlassCardHeader>
      <GlassCardContent className="p-0">
        <div className="space-y-4">
          {/* Sparkline Chart */}
          <div className="flex items-end justify-between gap-2 h-20 px-2">
            {sortedStages.map((stage, index) => {
              const height = (stage._count.leads / maxCount) * 100;
              const dropOffRate = dropOffRates[index];
              
              return (
                <div key={stage.id} className="flex-1 flex flex-col items-center">
                  {/* Bar */}
                  <div 
                    className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80 cursor-pointer"
                    style={{
                      height: `${Math.max(height, 4)}%`,
                      backgroundColor: stage.color || '#6366f1',
                      minHeight: '4px'
                    }}
                    title={`${stage.name}: ${stage._count.leads} leads`}
                  />
                  
                  {/* Drop-off indicator */}
                  {index > 0 && dropOffRate > 0 && (
                    <div className={`flex items-center gap-1 mt-1 ${getDropOffColor(dropOffRate)}`}>
                      {getDropOffIcon(dropOffRate)}
                      <span className="text-xs font-medium">
                        {dropOffRate.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stage Details */}
          <div className="space-y-2">
            {sortedStages.map((stage, index) => {
              const dropOffRate = dropOffRates[index];
              const percentage = totalLeads > 0 ? (stage._count.leads / totalLeads) * 100 : 0;
              
              return (
                <div key={stage.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color || '#6366f1' }}
                    />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {stage.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {stage._count.leads}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {percentage.toFixed(1)}%
                    </Badge>
                    {index > 0 && dropOffRate > 0 && (
                      <div className={`flex items-center gap-1 ${getDropOffColor(dropOffRate)}`}>
                        {getDropOffIcon(dropOffRate)}
                        <span className="text-xs">
                          {dropOffRate.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="border-t border-white/20 pt-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {totalLeads}
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  Total Leads
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {conversionRate}%
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  Conversion Rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {sortedStages.length === 0 && (
          <EmptyState
            icon={<BarChart3 className="h-6 w-6" />}
            title="No pipeline stages"
            description="Create pipeline stages to track your leads through the sales process. This helps visualize your funnel and identify bottlenecks."
            illustration="dots"
            size="md"
            actions={[
              {
                label: "Create Pipeline",
                onClick: () => window.location.href = '/app/settings',
                variant: 'default',
                icon: <Plus className="h-4 w-4" />
              },
              {
                label: "View Settings",
                onClick: () => window.location.href = '/app/settings',
                variant: 'outline',
                icon: <Settings className="h-4 w-4" />
              }
            ]}
          />
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
