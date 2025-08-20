"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, 
  Send, 
  Reply, 
  Clock, 
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  MousePointer,
  CheckCircle,
  Users,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailMetrics {
  totalSent: number;
  totalReceived: number;
  responseRate: number;
  averageResponseTime: number; // in hours
  openRate: number;
  clickRate: number;
  unreadCount: number;
  trendsVsPrevious: {
    sentChange: number;
    receivedChange: number;
    responseRateChange: number;
    responseTimeChange: number;
  };
  dailyActivity: Array<{
    date: string;
    sent: number;
    received: number;
    opened: number;
  }>;
  topContacts: Array<{
    name: string;
    email: string;
    threadCount: number;
    lastContact: string;
    responseRate: number;
  }>;
  responseTimeDistribution: {
    immediate: number; // < 1 hour
    quick: number; // 1-4 hours
    same_day: number; // 4-24 hours
    next_day: number; // 1-3 days
    slow: number; // > 3 days
  };
  emailTypes: {
    buyer_inquiry: number;
    seller_lead: number;
    showing_request: number;
    follow_up: number;
    other: number;
  };
}

interface EmailAnalyticsProps {
  timeframe: string;
  className?: string;
}

export default function EmailAnalytics({ timeframe, className = '' }: EmailAnalyticsProps) {
  const [metrics, setMetrics] = useState<EmailMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmailMetrics();
  }, [timeframe]);

  const fetchEmailMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reporting/email?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        // Mock data for development
        setMetrics(generateMockData());
      }
    } catch (error) {
      console.error('Failed to fetch email metrics:', error);
      // Use mock data as fallback
      setMetrics(generateMockData());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockData = (): EmailMetrics => ({
    totalSent: 342,
    totalReceived: 189,
    responseRate: 67.8,
    averageResponseTime: 3.2,
    openRate: 85.4,
    clickRate: 23.7,
    unreadCount: 14,
    trendsVsPrevious: {
      sentChange: 12.3,
      receivedChange: 8.7,
      responseRateChange: -2.1,
      responseTimeChange: -15.4
    },
    dailyActivity: [
      { date: '2024-01-15', sent: 45, received: 23, opened: 38 },
      { date: '2024-01-16', sent: 52, received: 31, opened: 44 },
      { date: '2024-01-17', sent: 38, received: 19, opened: 32 },
      { date: '2024-01-18', sent: 61, received: 28, opened: 52 },
      { date: '2024-01-19', sent: 49, received: 24, opened: 41 },
      { date: '2024-01-20', sent: 55, received: 33, opened: 47 },
      { date: '2024-01-21', sent: 42, received: 31, opened: 36 }
    ],
    topContacts: [
      {
        name: 'John Smith',
        email: 'john@example.com',
        threadCount: 15,
        lastContact: '2024-01-20',
        responseRate: 92.3
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        threadCount: 12,
        lastContact: '2024-01-19',
        responseRate: 88.7
      },
      {
        name: 'Mike Chen',
        email: 'mike@example.com',
        threadCount: 9,
        lastContact: '2024-01-18',
        responseRate: 85.1
      }
    ],
    responseTimeDistribution: {
      immediate: 25.3,
      quick: 34.2,
      same_day: 28.1,
      next_day: 8.9,
      slow: 3.5
    },
    emailTypes: {
      buyer_inquiry: 45,
      seller_lead: 38,
      showing_request: 72,
      follow_up: 123,
      other: 64
    }
  });

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

  const formatResponseTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours / 24)}d`;
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
        <Mail className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No email data available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Email analytics will appear here once you connect your email accounts.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Key Email Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <Badge className={cn("text-xs", getTrendColor(metrics.trendsVsPrevious.sentChange))}>
                {getTrendIcon(metrics.trendsVsPrevious.sentChange)}
                <span className="ml-1">{Math.abs(metrics.trendsVsPrevious.sentChange).toFixed(1)}%</span>
              </Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {metrics.totalSent}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Emails Sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Reply className="h-5 w-5 text-green-600" />
              </div>
              <Badge className={cn("text-xs", getTrendColor(metrics.trendsVsPrevious.receivedChange))}>
                {getTrendIcon(metrics.trendsVsPrevious.receivedChange)}
                <span className="ml-1">{Math.abs(metrics.trendsVsPrevious.receivedChange).toFixed(1)}%</span>
              </Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {metrics.totalReceived}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Emails Received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <Badge className={cn("text-xs", getTrendColor(metrics.trendsVsPrevious.responseRateChange))}>
                {getTrendIcon(metrics.trendsVsPrevious.responseRateChange)}
                <span className="ml-1">{Math.abs(metrics.trendsVsPrevious.responseRateChange).toFixed(1)}%</span>
              </Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {metrics.responseRate.toFixed(1)}%
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Response Rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <Badge className={cn("text-xs", getTrendColor(-metrics.trendsVsPrevious.responseTimeChange))}>
                {getTrendIcon(-metrics.trendsVsPrevious.responseTimeChange)}
                <span className="ml-1">{Math.abs(metrics.trendsVsPrevious.responseTimeChange).toFixed(1)}%</span>
              </Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {formatResponseTime(metrics.averageResponseTime)}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Avg Response Time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Email Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Open Rate
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {metrics.openRate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={metrics.openRate} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Click Rate
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {metrics.clickRate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={metrics.clickRate} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Response Rate
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {metrics.responseRate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={metrics.responseRate} className="h-2" />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Unread Emails
                    </span>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    {metrics.unreadCount}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Response Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Immediate (&lt; 1h)
                  </p>
                  <p className="text-xs text-slate-500">
                    Quick responses
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {metrics.responseTimeDistribution.immediate.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Quick (1-4h)
                  </p>
                  <p className="text-xs text-slate-500">
                    Same day responses
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {metrics.responseTimeDistribution.quick.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Same Day (4-24h)
                  </p>
                  <p className="text-xs text-slate-500">
                    Within business hours
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-600">
                    {metrics.responseTimeDistribution.same_day.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Next Day (1-3d)
                  </p>
                  <p className="text-xs text-slate-500">
                    Delayed responses
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">
                    {metrics.responseTimeDistribution.next_day.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Slow (&gt; 3d)
                  </p>
                  <p className="text-xs text-slate-500">
                    Need follow-up
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    {metrics.responseTimeDistribution.slow.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Types & Top Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Email Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Follow-ups
                </span>
                <Badge variant="outline" className="text-blue-600">
                  {metrics.emailTypes.follow_up}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Showing Requests
                </span>
                <Badge variant="outline" className="text-green-600">
                  {metrics.emailTypes.showing_request}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Buyer Inquiries
                </span>
                <Badge variant="outline" className="text-purple-600">
                  {metrics.emailTypes.buyer_inquiry}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Seller Leads
                </span>
                <Badge variant="outline" className="text-orange-600">
                  {metrics.emailTypes.seller_lead}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Other
                </span>
                <Badge variant="outline" className="text-slate-600">
                  {metrics.emailTypes.other}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Most Active Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topContacts.map((contact, index) => (
                <motion.div
                  key={contact.email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {contact.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {contact.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {contact.threadCount} threads • {contact.responseRate.toFixed(1)}% response rate
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      Last contact
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {new Date(contact.lastContact).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}