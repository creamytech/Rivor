import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, TrendingUp, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PipelineStats } from "@/server/pipeline";
import { EmptyState } from "@/components/ui/empty-state";

interface PipelineGlanceProps {
  pipelineStats: PipelineStats[];
  totalActiveLeads: number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export default function PipelineGlanceWidget({ 
  pipelineStats, 
  totalActiveLeads,
  loading, 
  error,
  onRetry 
}: PipelineGlanceProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            <CardTitle>Deal Flow</CardTitle>
          </div>
          <CardDescription>Deals by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            <CardTitle>Deal Flow</CardTitle>
          </div>
          <CardDescription>Deals by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-sm text-gray-500 mb-4">
              Unable to load pipeline data
            </div>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pipelineStats.length === 0 || totalActiveLeads === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            <CardTitle>Deal Flow</CardTitle>
          </div>
          <CardDescription>Deals by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Briefcase className="h-12 w-12" />}
            title="No active deals yet"
            description="Start tracking your sales opportunities"
            action={{
              label: "Create Your First Deal",
              href: "/app/pipeline?action=create"
            }}
          />
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalValue = pipelineStats.reduce((sum, stage) => sum + stage.totalValue, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            <CardTitle>Deal Flow</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/pipeline" className="flex items-center gap-1">
              View All
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        <CardDescription>
          {totalActiveLeads} active deals • {formatCurrency(totalValue)} total value
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pipelineStats.map((stage) => (
            <Link
              key={stage.stageId}
              href={`/app/pipeline?filter=stage&stage=${encodeURIComponent(stage.stageName)}`}
              className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2"
              aria-label={`View ${stage.count} deals in ${stage.stageName} stage, total value ${formatCurrency(stage.totalValue)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {stage.stageName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stage.count} deal{stage.count !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatCurrency(stage.totalValue)}
                  </div>
                  {stage.count > 0 && (
                    <div className="text-xs text-gray-500">
                      avg: {formatCurrency(stage.totalValue / stage.count)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="pt-4 mt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/app/pipeline">
                Manage Pipeline
              </Link>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link href="/app/pipeline?action=create">
                <TrendingUp className="h-3 w-3 mr-1" />
                Create Deal
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
