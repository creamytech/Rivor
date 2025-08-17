"use client";
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Briefcase, ExternalLink, TrendingUp, DollarSign } from "lucide-react";
import Link from "next/link";

interface PipelineGlanceWidgetProps {
  pipelineStats: any[];
  totalActiveLeads: number;
}

export function PipelineGlanceWidget({ pipelineStats, totalActiveLeads }: PipelineGlanceWidgetProps) {
  const hasDeals = pipelineStats && pipelineStats.length > 0 && totalActiveLeads > 0;
  const totalValue = pipelineStats?.reduce((sum, stage) => sum + stage.totalValue, 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Briefcase className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Deal Flow</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">Deals by stage</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/pipeline" className="flex items-center gap-2">
                <span>View Pipeline</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Pipeline Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalActiveLeads}</div>
              <div className="text-xs text-green-600">Active Deals</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${(totalValue / 1000).toFixed(0)}k
              </div>
              <div className="text-xs text-blue-600">Total Value</div>
            </div>
          </div>

          {/* Pipeline Stages */}
          {hasDeals ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Pipeline Stages</h4>
              <div className="space-y-3">
                {pipelineStats?.map((stage, index) => (
                  <motion.div
                    key={stage.stage || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {stage.stage || 'Unknown Stage'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {stage.count} deals
                        </span>
                        <Badge variant="outline" className="text-xs">
                          ${(stage.totalValue / 1000).toFixed(0)}k
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={(stage.count / totalActiveLeads) * 100} 
                      className="h-2"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <Briefcase className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  No active deals yet
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Start tracking your sales opportunities
                </p>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Create Your First Deal
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
