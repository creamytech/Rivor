"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  RefreshCw,
  Calendar,
  Mail,
  Users,
  DollarSign,
  Target,
  Clock,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileText,
  Eye,
  MousePointer,
  CheckCircle,
  AlertCircle,
  Filter,
  DateRange
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PipelineMetrics from './PipelineMetrics';
import EmailAnalytics from './EmailAnalytics';
import CampaignResults from './CampaignResults';

interface ReportingData {
  overview: {
    totalDeals: number;
    totalValue: number;
    conversionRate: number;
    avgDealTime: number;
    activeLeads: number;
    closedDeals: number;
  };
  trends: {
    dealsChange: number;
    valueChange: number;
    conversionChange: number;
    leadsChange: number;
  };
  timeframe: string;
  lastUpdated: Date;
}

interface EnhancedReportingProps {
  className?: string;
}

export default function EnhancedReporting({ className = '' }: EnhancedReportingProps) {
  const [reportingData, setReportingData] = useState<ReportingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchReportingData();
  }, [timeframe]);

  const fetchReportingData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reporting/overview?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setReportingData(data);
      }
    } catch (error) {
      console.error('Failed to fetch reporting data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReportingData();
    setIsRefreshing(false);
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/reporting/export?timeframe=${timeframe}&format=csv`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rivor-report-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const timeframeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
    { value: 'ytd', label: 'Year to date' },
  ];

  if (isLoading && !reportingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Analytics & Reporting
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Comprehensive insights into your business performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              {timeframeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {reportingData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Deals"
              value={reportingData.overview.totalDeals}
              change={reportingData.trends.dealsChange}
              icon={<Target className="h-5 w-5" />}
              color="blue"
            />
            <MetricCard
              title="Pipeline Value"
              value={formatCurrency(reportingData.overview.totalValue)}
              change={reportingData.trends.valueChange}
              icon={<DollarSign className="h-5 w-5" />}
              color="green"
            />
            <MetricCard
              title="Conversion Rate"
              value={`${reportingData.overview.conversionRate.toFixed(1)}%`}
              change={reportingData.trends.conversionChange}
              icon={<Percent className="h-5 w-5" />}
              color="purple"
            />
            <MetricCard
              title="Active Leads"
              value={reportingData.overview.activeLeads}
              change={reportingData.trends.leadsChange}
              icon={<Users className="h-5 w-5" />}
              color="orange"
            />
          </div>
        </motion.div>
      )}

      {/* Detailed Reports Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <OverviewDashboard reportingData={reportingData} timeframe={timeframe} />
          </TabsContent>
          
          <TabsContent value="pipeline" className="space-y-6">
            <PipelineMetrics timeframe={timeframe} />
          </TabsContent>
          
          <TabsContent value="email" className="space-y-6">
            <EmailAnalytics timeframe={timeframe} />
          </TabsContent>
          
          <TabsContent value="campaigns" className="space-y-6">
            <CampaignResults timeframe={timeframe} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  color 
}: {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-red-500',
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "p-2 rounded-lg bg-gradient-to-r shadow-lg",
            colorClasses[color]
          )}>
            <div className="text-white">
              {icon}
            </div>
          </div>
          
          <Badge className={cn("text-xs", getTrendColor(change))}>
            {getTrendIcon(change)}
            <span className="ml-1">{formatPercent(change)}</span>
          </Badge>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {value}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {title}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewDashboard({ 
  reportingData, 
  timeframe 
}: { 
  reportingData: ReportingData | null; 
  timeframe: string; 
}) {
  if (!reportingData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Deal Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Deal Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Average Deal Time
                </p>
                <p className="text-xs text-slate-500">
                  From lead to close
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {reportingData.overview.avgDealTime} days
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Deals Closed
                </p>
                <p className="text-xs text-slate-500">
                  This period
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  {reportingData.overview.closedDeals}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Win Rate
                </p>
                <p className="text-xs text-slate-500">
                  Closed deals / Total deals
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">
                  {reportingData.overview.conversionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Email Activity
                </p>
                <p className="text-xs text-slate-500">
                  Sent and received
                </p>
              </div>
              <Badge variant="outline" className="text-blue-600">
                View Details
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Pipeline Updates
                </p>
                <p className="text-xs text-slate-500">
                  Stage movements
                </p>
              </div>
              <Badge variant="outline" className="text-green-600">
                View Details
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  New Contacts
                </p>
                <p className="text-xs text-slate-500">
                  Added this period
                </p>
              </div>
              <Badge variant="outline" className="text-purple-600">
                View Details
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}