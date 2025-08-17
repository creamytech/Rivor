"use client";
import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

interface PipelineStage {
  name: string;
  count: number;
  color: string;
  dropOffRate?: number;
}

interface MiniPipelineSparklineProps {
  stages?: PipelineStage[];
  totalLeads?: number;
  conversionRate?: number;
}

export default function MiniPipelineSparkline({
  stages = [],
  totalLeads = 0,
  conversionRate = 0
}: MiniPipelineSparklineProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const maxCount = Math.max(...stages.map(stage => stage.count), 1);
  
  const getTrendIcon = (dropOffRate?: number) => {
    if (!dropOffRate) return <Minus className="h-3 w-3 text-slate-400" />;
    if (dropOffRate < 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  };

  const getTrendColor = (dropOffRate?: number) => {
    if (!dropOffRate) return 'text-slate-500';
    if (dropOffRate < 0) return 'text-green-600 dark:text-green-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStageColor = (color: string) => {
    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'yellow': 'bg-yellow-500',
      'red': 'bg-red-500',
      'purple': 'bg-purple-500',
      'teal': 'bg-teal-500',
      'orange': 'bg-orange-500',
      'pink': 'bg-pink-500'
    };
    return colorMap[color] || 'bg-slate-500';
  };

  const getStageBorderColor = (color: string) => {
    const colorMap: Record<string, string> = {
      'blue': 'border-blue-200 dark:border-blue-800',
      'green': 'border-green-200 dark:border-green-800',
      'yellow': 'border-yellow-200 dark:border-yellow-800',
      'red': 'border-red-200 dark:border-red-800',
      'purple': 'border-purple-200 dark:border-purple-800',
      'teal': 'border-teal-200 dark:border-teal-800',
      'orange': 'border-orange-200 dark:border-orange-800',
      'pink': 'border-pink-200 dark:border-pink-800'
    };
    return colorMap[color] || 'border-slate-200 dark:border-slate-800';
  };

  return (
    <GlassCard variant="gradient" intensity="medium" className="h-full">
      <GlassCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            <GlassCardTitle className="text-lg">Pipeline</GlassCardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {totalLeads} total
          </Badge>
        </div>
      </GlassCardHeader>
      
      <GlassCardContent className="p-0">
        <div className="space-y-4">
          {/* Sparkline Chart */}
          <div className="px-4">
            <div className="flex items-end justify-between h-20 gap-1">
              {stages.map((stage, index) => {
                const height = (stage.count / maxCount) * 100;
                const isHovered = hoveredStage === stage.name;
                
                return (
                  <div
                    key={stage.name}
                    className="flex-1 flex flex-col items-center"
                    onMouseEnter={() => setHoveredStage(stage.name)}
                    onMouseLeave={() => setHoveredStage(null)}
                  >
                    {/* Bar */}
                    <div className="relative w-full flex justify-center">
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${getStageColor(stage.color)} ${
                          isHovered ? 'opacity-100' : 'opacity-80'
                        }`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                    
                    {/* Stage Name */}
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 text-center leading-tight">
                      {stage.name}
                    </div>
                    
                    {/* Count */}
                    <div className="text-xs font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {stage.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stage Details */}
          <div className="space-y-2 px-4">
            {stages.map((stage) => (
              <div
                key={stage.name}
                className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                  hoveredStage === stage.name 
                    ? 'bg-white/10 border-white/30' 
                    : 'bg-white/5 border-white/10'
                } ${getStageBorderColor(stage.color)}`}
                onMouseEnter={() => setHoveredStage(stage.name)}
                onMouseLeave={() => setHoveredStage(null)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStageColor(stage.color)}`} />
                  <span className="text-sm font-medium">{stage.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{stage.count}</span>
                  {stage.dropOffRate !== undefined && (
                    <div className="flex items-center gap-1">
                      {getTrendIcon(stage.dropOffRate)}
                      <span className={`text-xs ${getTrendColor(stage.dropOffRate)}`}>
                        {Math.abs(stage.dropOffRate)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Conversion Rate */}
          <div className="px-4 pt-2 border-t border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Conversion Rate
              </span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {conversionRate}%
                </span>
                <TrendingUp className="h-3 w-3 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {stages.length === 0 && (
          <div className="p-6 text-center">
            <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-2">No pipeline data</p>
            <p className="text-xs text-slate-500">
              Add deals to see your pipeline flow
            </p>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
