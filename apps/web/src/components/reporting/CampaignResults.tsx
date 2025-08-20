"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, 
  Eye, 
  MousePointer, 
  UserPlus, 
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  Users,
  Target,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'sending' | 'sent' | 'completed';
  sentAt: string;
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  bounced: number;
  unsubscribed: number;
  subject: string;
  type: 'newsletter' | 'property_alert' | 'market_update' | 'follow_up' | 'listing_announcement';
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
}

interface CampaignMetrics {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  averageOpenRate: number;
  averageClickRate: number;
  averageConversionRate: number;
  trends: {
    campaignsChange: number;
    openRateChange: number;
    clickRateChange: number;
    conversionRateChange: number;
  };
  campaigns: Campaign[];
  topPerformingCampaigns: Campaign[];
  campaignsByType: {
    newsletter: number;
    property_alert: number;
    market_update: number;
    follow_up: number;
    listing_announcement: number;
  };
}

interface CampaignResultsProps {
  timeframe: string;
  className?: string;
}

export default function CampaignResults({ timeframe, className = '' }: CampaignResultsProps) {
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'openRate' | 'clickRate' | 'recipients'>('date');

  useEffect(() => {
    fetchCampaignMetrics();
  }, [timeframe]);

  const fetchCampaignMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reporting/campaigns?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        // Mock data for development
        setMetrics(generateMockData());
      }
    } catch (error) {
      console.error('Failed to fetch campaign metrics:', error);
      // Use mock data as fallback
      setMetrics(generateMockData());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockData = (): CampaignMetrics => {
    const campaigns: Campaign[] = [
      {
        id: '1',
        name: 'New Luxury Listings - Downtown',
        status: 'completed',
        sentAt: '2024-01-18T10:00:00Z',
        recipients: 1250,
        delivered: 1234,
        opened: 456,
        clicked: 89,
        converted: 12,
        bounced: 16,
        unsubscribed: 3,
        subject: '🏠 Exclusive: New Luxury Properties in Downtown Area',
        type: 'listing_announcement',
        openRate: 36.9,
        clickRate: 19.5,
        conversionRate: 13.5,
        bounceRate: 1.3
      },
      {
        id: '2',
        name: 'Market Update Q1 2024',
        status: 'completed',
        sentAt: '2024-01-15T14:30:00Z',
        recipients: 2100,
        delivered: 2087,
        opened: 834,
        clicked: 167,
        converted: 23,
        bounced: 13,
        unsubscribed: 8,
        subject: 'Real Estate Market Trends & Predictions for 2024',
        type: 'market_update',
        openRate: 39.9,
        clickRate: 20.0,
        conversionRate: 13.8,
        bounceRate: 0.6
      },
      {
        id: '3',
        name: 'First-Time Buyer Guide',
        status: 'completed',
        sentAt: '2024-01-12T09:15:00Z',
        recipients: 890,
        delivered: 876,
        opened: 298,
        clicked: 71,
        converted: 18,
        bounced: 14,
        unsubscribed: 2,
        subject: 'Your Complete Guide to Buying Your First Home',
        type: 'newsletter',
        openRate: 34.0,
        clickRate: 23.8,
        conversionRate: 25.4,
        bounceRate: 1.6
      },
      {
        id: '4',
        name: 'Follow-up: Property Viewing',
        status: 'completed',
        sentAt: '2024-01-10T16:45:00Z',
        recipients: 156,
        delivered: 154,
        opened: 89,
        clicked: 34,
        converted: 8,
        bounced: 2,
        unsubscribed: 0,
        subject: 'Thank you for visiting - Next steps',
        type: 'follow_up',
        openRate: 57.8,
        clickRate: 38.2,
        conversionRate: 23.5,
        bounceRate: 1.3
      }
    ];

    return {
      totalCampaigns: campaigns.length,
      totalSent: campaigns.reduce((sum, c) => sum + c.recipients, 0),
      totalDelivered: campaigns.reduce((sum, c) => sum + c.delivered, 0),
      totalOpened: campaigns.reduce((sum, c) => sum + c.opened, 0),
      totalClicked: campaigns.reduce((sum, c) => sum + c.clicked, 0),
      totalConverted: campaigns.reduce((sum, c) => sum + c.converted, 0),
      averageOpenRate: campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length,
      averageClickRate: campaigns.reduce((sum, c) => sum + c.clickRate, 0) / campaigns.length,
      averageConversionRate: campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length,
      trends: {
        campaignsChange: 15.2,
        openRateChange: 3.7,
        clickRateChange: -1.2,
        conversionRateChange: 8.9
      },
      campaigns,
      topPerformingCampaigns: campaigns.sort((a, b) => b.openRate - a.openRate).slice(0, 3),
      campaignsByType: {
        newsletter: 1,
        property_alert: 0,
        market_update: 1,
        follow_up: 1,
        listing_announcement: 1
      }
    };
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

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'sent':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'sending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeColor = (type: Campaign['type']) => {
    switch (type) {
      case 'newsletter':
        return 'bg-blue-100 text-blue-700';
      case 'property_alert':
        return 'bg-green-100 text-green-700';
      case 'market_update':
        return 'bg-purple-100 text-purple-700';
      case 'follow_up':
        return 'bg-orange-100 text-orange-700';
      case 'listing_announcement':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const sortCampaigns = (campaigns: Campaign[]) => {
    return [...campaigns].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
        case 'openRate':
          return b.openRate - a.openRate;
        case 'clickRate':
          return b.clickRate - a.clickRate;
        case 'recipients':
          return b.recipients - a.recipients;
        default:
          return 0;
      }
    });
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
        <Send className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No campaign data available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Campaign results will appear here once you start sending email campaigns.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Key Campaign Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <Badge className={cn("text-xs", getTrendColor(metrics.trends.campaignsChange))}>
                {getTrendIcon(metrics.trends.campaignsChange)}
                <span className="ml-1">{Math.abs(metrics.trends.campaignsChange).toFixed(1)}%</span>
              </Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {metrics.totalCampaigns}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Campaigns Sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <Badge className={cn("text-xs", getTrendColor(metrics.trends.openRateChange))}>
                {getTrendIcon(metrics.trends.openRateChange)}
                <span className="ml-1">{Math.abs(metrics.trends.openRateChange).toFixed(1)}%</span>
              </Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {metrics.averageOpenRate.toFixed(1)}%
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Average Open Rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MousePointer className="h-5 w-5 text-purple-600" />
              </div>
              <Badge className={cn("text-xs", getTrendColor(metrics.trends.clickRateChange))}>
                {getTrendIcon(metrics.trends.clickRateChange)}
                <span className="ml-1">{Math.abs(metrics.trends.clickRateChange).toFixed(1)}%</span>
              </Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {metrics.averageClickRate.toFixed(1)}%
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Average Click Rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <Badge className={cn("text-xs", getTrendColor(metrics.trends.conversionRateChange))}>
                {getTrendIcon(metrics.trends.conversionRateChange)}
                <span className="ml-1">{Math.abs(metrics.trends.conversionRateChange).toFixed(1)}%</span>
              </Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {metrics.averageConversionRate.toFixed(1)}%
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Conversion Rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Performance Overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Campaign Performance
              </CardTitle>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date Sent</SelectItem>
                  <SelectItem value="openRate">Open Rate</SelectItem>
                  <SelectItem value="clickRate">Click Rate</SelectItem>
                  <SelectItem value="recipients">Recipients</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortCampaigns(metrics.campaigns).map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-4 rounded-lg border transition-colors cursor-pointer",
                    selectedCampaign?.id === campaign.id 
                      ? "border-blue-300 bg-blue-50 dark:bg-blue-950/30" 
                      : "border-slate-200 hover:border-slate-300"
                  )}
                  onClick={() => setSelectedCampaign(selectedCampaign?.id === campaign.id ? null : campaign)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {campaign.name}
                        </h4>
                        <Badge className={cn("text-xs", getStatusColor(campaign.status))}>
                          {campaign.status}
                        </Badge>
                        <Badge className={cn("text-xs", getTypeColor(campaign.type))}>
                          {campaign.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {campaign.subject}
                      </p>
                      <p className="text-xs text-slate-500">
                        Sent {new Date(campaign.sentAt).toLocaleDateString()} • {campaign.recipients} recipients
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">Open Rate</p>
                      <p className="font-medium text-green-600">
                        {campaign.openRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Click Rate</p>
                      <p className="font-medium text-blue-600">
                        {campaign.clickRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Conversions</p>
                      <p className="font-medium text-purple-600">
                        {campaign.converted}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Bounce Rate</p>
                      <p className="font-medium text-red-600">
                        {campaign.bounceRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {selectedCampaign?.id === campaign.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded">
                          <p className="text-xs text-slate-500 mb-1">Delivered</p>
                          <p className="text-lg font-bold text-green-600">{campaign.delivered}</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded">
                          <p className="text-xs text-slate-500 mb-1">Opened</p>
                          <p className="text-lg font-bold text-blue-600">{campaign.opened}</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded">
                          <p className="text-xs text-slate-500 mb-1">Clicked</p>
                          <p className="text-lg font-bold text-purple-600">{campaign.clicked}</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded">
                          <p className="text-xs text-slate-500 mb-1">Converted</p>
                          <p className="text-lg font-bold text-orange-600">{campaign.converted}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Summary */}
        <div className="space-y-6">
          {/* Top Performing Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topPerformingCampaigns.map((campaign, index) => (
                  <div key={campaign.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {campaign.openRate.toFixed(1)}% open rate
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Campaign Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Follow-ups</span>
                  <Badge variant="outline">{metrics.campaignsByType.follow_up}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Listings</span>
                  <Badge variant="outline">{metrics.campaignsByType.listing_announcement}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Market Updates</span>
                  <Badge variant="outline">{metrics.campaignsByType.market_update}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Newsletters</span>
                  <Badge variant="outline">{metrics.campaignsByType.newsletter}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Property Alerts</span>
                  <Badge variant="outline">{metrics.campaignsByType.property_alert}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}