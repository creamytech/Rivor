"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  Filter,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineStage {
  id: string;
  name: string;
  deals: number;
  value: number;
  conversionRate: number;
  averageTime: number;
  change: number;
  color: string;
}

interface PipelineMetric {
  totalDeals: number;
  totalValue: number;
  averageDealSize: number;
  averageSalesVelocity: number;
  conversionRates: {
    leadToOpportunity: number;
    opportunityToProposal: number;
    proposalToClose: number;
    overallConversion: number;
  };
  stageMetrics: PipelineStage[];
  topPerformers: Array<{
    agent: string;
    deals: number;
    value: number;
    conversionRate: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    deals: number;
    value: number;
  }>;
}

interface PipelineMetricsProps {
  timeframe: string;
  className?: string;
}

export default function PipelineMetrics({ timeframe, className = '' }: PipelineMetricsProps) {
  const [metrics, setMetrics] = useState<PipelineMetric | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  useEffect(() => {
    fetchPipelineMetrics();
  }, [timeframe]);

  const fetchPipelineMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reporting/pipeline?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        // Mock data for development
        setMetrics(generateMockData());
      }
    } catch (error) {
      console.error('Failed to fetch pipeline metrics:', error);
      // Use mock data as fallback
      setMetrics(generateMockData());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockData = (): PipelineMetric => ({
    totalDeals: 145,
    totalValue: 3250000,
    averageDealSize: 22414,
    averageSalesVelocity: 45.2,
    conversionRates: {
      leadToOpportunity: 34.5,
      opportunityToProposal: 67.8,
      proposalToClose: 42.1,
      overallConversion: 9.8
    },
    stageMetrics: [
      {
        id: 'lead',
        name: 'New Leads',
        deals: 89,
        value: 1890000,
        conversionRate: 34.5,
        averageTime: 7.2,
        change: 12.3,
        color: 'bg-blue-500'
      },
      {
        id: 'qualified',
        name: 'Qualified',
        deals: 34,
        value: 890000,
        conversionRate: 67.8,
        averageTime: 14.5,
        change: -4.2,
        color: 'bg-green-500'
      },
      {
        id: 'proposal',
        name: 'Proposal Sent',
        deals: 18,
        value: 520000,
        conversionRate: 42.1,
        averageTime: 23.1,
        change: 8.7,
        color: 'bg-orange-500'
      },
      {
        id: 'negotiation',
        name: 'Negotiation',
        deals: 12,
        value: 380000,
        conversionRate: 75.0,
        averageTime: 18.3,
        change: 15.2,
        color: 'bg-purple-500'
      },
      {
        id: 'closed',
        name: 'Closed Won',
        deals: 8,
        value: 240000,
        conversionRate: 100,
        averageTime: 0,
        change: 25.0,
        color: 'bg-emerald-500'
      }
    ],
    topPerformers: [
      { agent: 'Sarah Johnson', deals: 23, value: 520000, conversionRate: 32.1 },
      { agent: 'Mike Chen', deals: 19, value: 445000, conversionRate: 28.7 },
      { agent: 'Lisa Rodriguez', deals: 17, value: 398000, conversionRate: 31.5 }
    ],
    monthlyTrends: [
      { month: 'Jan', deals: 12, value: 280000 },
      { month: 'Feb', deals: 15, value: 340000 },
      { month: 'Mar', deals: 18, value: 425000 },
      { month: 'Apr', deals: 22, value: 510000 },
      { month: 'May', deals: 19, value: 445000 },
      { month: 'Jun', deals: 25, value: 590000 }
    ]
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (change < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600 bg-green-50 border-green-200';
    if (change < 0) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No pipeline data available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Pipeline metrics will appear here once you have deals in your system.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Key Pipeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {metrics.totalDeals}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Total Deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {formatCurrency(metrics.totalValue)}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Pipeline Value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {formatCurrency(metrics.averageDealSize)}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Avg Deal Size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {metrics.averageSalesVelocity} days
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Avg Sales Cycle
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Stages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Pipeline Stages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.stageMetrics.map((stage, index) => (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-4 rounded-lg border transition-colors cursor-pointer",
                    selectedStage === stage.id 
                      ? "border-blue-300 bg-blue-50 dark:bg-blue-950/30" 
                      : "border-slate-200 hover:border-slate-300"
                  )}
                  onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {stage.name}
                      </h4>
                    </div>
                    <Badge className={cn("text-xs", getTrendColor(stage.change))}>
                      {getTrendIcon(stage.change)}
                      <span className="ml-1">{Math.abs(stage.change).toFixed(1)}%</span>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Deals</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {stage.deals}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Value</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(stage.value)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Conv. Rate</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {stage.conversionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Stage progress</span>
                      <span>{stage.conversionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={stage.conversionRate} className="h-2" />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Lead → Opportunity
                    </p>
                    <p className="text-xs text-slate-500">
                      First stage conversion
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {metrics.conversionRates.leadToOpportunity.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Opportunity → Proposal
                    </p>
                    <p className="text-xs text-slate-500">
                      Qualification success
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {metrics.conversionRates.opportunityToProposal.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Proposal → Close
                    </p>
                    <p className="text-xs text-slate-500">
                      Win rate
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">
                      {metrics.conversionRates.proposalToClose.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Overall Conversion
                    </p>
                    <p className="text-xs text-slate-500">
                      Lead to close rate
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">
                      {metrics.conversionRates.overallConversion.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.topPerformers.map((performer, index) => (
              <motion.div
                key={performer.agent}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {performer.agent}
                    </p>
                    <p className="text-sm text-slate-500">
                      {performer.deals} deals • {performer.conversionRate.toFixed(1)}% conversion
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(performer.value)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}