"use client";

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface FunnelStage {
  id: string;
  title: string;
  count: number;
  value: number;
  color: string;
  conversionRate?: number;
}

interface PipelineFunnelVizProps {
  stages: FunnelStage[];
  className?: string;
}

export default function PipelineFunnelViz({ stages, className = "" }: PipelineFunnelVizProps) {
  const maxCount = Math.max(...stages.map(s => s.count));
  const totalValue = stages.reduce((sum, stage) => sum + stage.value, 0);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const getConversionIcon = (rate?: number) => {
    if (!rate) return null;
    return rate >= 20 ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" />
    );
  };

  return (
    <Card className={`bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200/30 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Pipeline Funnel Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {stages.map((stage, index) => {
            const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const nextStage = stages[index + 1];
            const conversionRate = nextStage ? (nextStage.count / stage.count) * 100 : 0;
            
            return (
              <div key={stage.id} className="space-y-2">
                {/* Stage Bar */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="relative"
                >
                  <div 
                    className={`h-12 rounded-lg ${stage.color} border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center justify-between px-4 relative overflow-hidden`}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-white/20 to-transparent" />
                    
                    {/* Content */}
                    <div className="flex items-center gap-3 relative z-10">
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                        {stage.title}
                      </span>
                      <Badge variant="secondary" className="bg-white/60 dark:bg-gray-800/60 text-xs">
                        {stage.count} deals
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 relative z-10">
                      <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                        {formatValue(stage.value)}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        ({((stage.value / totalValue) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Conversion Arrow */}
                {nextStage && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    className="flex items-center justify-center py-1"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowRight className="h-3 w-3" />
                      <span>{conversionRate.toFixed(1)}% conversion</span>
                      {getConversionIcon(conversionRate)}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stages.reduce((sum, stage) => sum + stage.count, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Deals</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatValue(totalValue)}
              </div>
              <div className="text-xs text-muted-foreground">Total Value</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {stages.length > 1 ? (
                  ((stages[stages.length - 1].count / stages[0].count) * 100).toFixed(1) + '%'
                ) : (
                  '0%'
                )}
              </div>
              <div className="text-xs text-muted-foreground">Overall Conversion</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}