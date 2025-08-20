"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  Target,
  Users,
  AlertTriangle,
  CheckCircle,
  Star,
  Award,
  Activity,
  Zap,
  ArrowRight
} from "lucide-react";

interface PipelineAnalyticsSidebarProps {
  onClose: () => void;
  activeFilters: any[];
  searchQuery: string;
}

// Mock analytics data
const generateAnalyticsData = () => {
  return {
    overview: {
      totalDeals: 47,
      totalValue: 12750000,
      avgDealSize: 271277,
      conversionRate: 23.4,
      avgSalesCycle: 45,
      monthlyGrowth: 12.3
    },
    stageConversion: [
      { stage: 'Lead', deals: 47, value: 12750000, conversionRate: 100 },
      { stage: 'Qualified', deals: 38, value: 10950000, conversionRate: 80.9 },
      { stage: 'Showing', deals: 28, value: 8750000, conversionRate: 73.7 },
      { stage: 'Offer', deals: 18, value: 6250000, conversionRate: 64.3 },
      { stage: 'Contract', deals: 12, value: 4100000, conversionRate: 66.7 },
      { stage: 'Closed', deals: 11, value: 3750000, conversionRate: 91.7 }
    ],
    monthlyTrends: [
      { month: 'Jan', deals: 8, value: 2100000, closed: 3 },
      { month: 'Feb', deals: 12, value: 3200000, closed: 5 },
      { month: 'Mar', deals: 15, value: 4100000, closed: 6 },
      { month: 'Apr', deals: 18, value: 4800000, closed: 8 },
      { month: 'May', deals: 22, value: 5900000, closed: 9 },
      { month: 'Jun', deals: 25, value: 6750000, closed: 11 }
    ],
    dealsBySource: [
      { name: 'Website', value: 35, color: '#3B82F6' },
      { name: 'Referral', value: 28, color: '#10B981' },
      { name: 'Social Media', value: 20, color: '#8B5CF6' },
      { name: 'Cold Calls', value: 12, color: '#F59E0B' },
      { name: 'Open House', value: 5, color: '#EF4444' }
    ],
    topPerformers: [
      { name: 'John Smith', deals: 12, value: 3200000, conversionRate: 28.5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
      { name: 'Mary Johnson', deals: 10, value: 2800000, conversionRate: 25.8, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mary' },
      { name: 'Tom Wilson', deals: 8, value: 2200000, conversionRate: 22.1, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom' },
      { name: 'Lisa Davis', deals: 7, value: 1950000, conversionRate: 19.8, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' }
    ],
    hotDeals: [
      { id: '1', client: 'Sarah Johnson', property: '123 Oak Street', value: 750000, probability: 85, daysInStage: 3 },
      { id: '2', client: 'Michael Chen', property: '456 Pine Ave', value: 650000, probability: 78, daysInStage: 5 },
      { id: '3', client: 'Emily Rodriguez', property: '789 Maple Dr', value: 580000, probability: 72, daysInStage: 2 },
      { id: '4', client: 'David Wilson', property: '321 Cedar Ln', value: 820000, probability: 68, daysInStage: 7 }
    ],
    dealsNeedingAttention: [
      { id: '1', client: 'Lisa Thompson', property: '654 Elm Street', issue: 'No activity for 10 days', priority: 'high' },
      { id: '2', client: 'Robert Lee', property: '987 Birch Road', issue: 'Showing overdue by 3 days', priority: 'medium' },
      { id: '3', client: 'Amanda Davis', property: '147 Willow Way', issue: 'Follow-up call needed', priority: 'low' }
    ]
  };
};

export default function PipelineAnalyticsSidebar({ onClose, activeFilters, searchQuery }: PipelineAnalyticsSidebarProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'alerts'>('overview');

  useEffect(() => {
    setAnalytics(generateAnalyticsData());
  }, []);

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Deals</p>
                <p className="text-2xl font-bold text-blue-800">{analytics.overview.totalDeals}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Pipeline Value</p>
                <p className="text-lg font-bold text-green-800">
                  ${(analytics.overview.totalValue / 1000000).toFixed(1)}M
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Avg Deal Size</p>
                <p className="text-lg font-bold text-purple-800">
                  ${(analytics.overview.avgDealSize / 1000).toFixed(0)}K
                </p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-800">{analytics.overview.conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={analytics.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [name === 'value' ? `$${(value as number / 1000000).toFixed(1)}M` : value, name]} />
              <Area type="monotone" dataKey="deals" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stage Conversion Funnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Stage Conversion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.stageConversion.map((stage: any, index: number) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.stage}</span>
                  <span className="text-muted-foreground">{stage.deals} deals</span>
                </div>
                <Progress value={stage.conversionRate} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{stage.conversionRate.toFixed(1)}% conversion</span>
                  <span>${(stage.value / 1000000).toFixed(1)}M value</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deal Sources */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Deal Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={analytics.dealsBySource}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={false}
              >
                {analytics.dealsBySource.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {/* Top Performers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPerformers.map((performer: any, index: number) => (
              <div key={performer.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={performer.avatar} />
                    <AvatarFallback>{performer.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{performer.name}</h4>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{performer.deals} deals</span>
                    <span>${(performer.value / 1000000).toFixed(1)}M</span>
                    <span>{performer.conversionRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hot Deals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            Hot Deals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.hotDeals.map((deal: any) => (
              <motion.div
                key={deal.id}
                whileHover={{ scale: 1.02 }}
                className="p-3 rounded-lg border border-orange-200 bg-orange-50/50 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{deal.client}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {deal.probability}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{deal.property}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-green-600">${deal.value.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">{deal.daysInStage} days</span>
                </div>
                <Progress value={deal.probability} className="h-1 mt-2" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Sales Cycle</span>
              <span className="font-medium">{analytics.overview.avgSalesCycle} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monthly Growth</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-600">+{analytics.overview.monthlyGrowth}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Win Rate</span>
              <span className="font-medium">{analytics.overview.conversionRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAlertsTab = () => (
    <div className="space-y-6">
      {/* Deals Needing Attention */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Needs Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.dealsNeedingAttention.map((deal: any) => (
              <motion.div
                key={deal.id}
                whileHover={{ scale: 1.02 }}
                className={`p-3 rounded-lg border cursor-pointer ${
                  deal.priority === 'high' ? 'border-red-200 bg-red-50/50' :
                  deal.priority === 'medium' ? 'border-orange-200 bg-orange-50/50' :
                  'border-yellow-200 bg-yellow-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{deal.client}</h4>
                  <Badge 
                    variant={deal.priority === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {deal.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{deal.property}</p>
                <p className="text-xs font-medium">{deal.issue}</p>
                <Button size="sm" variant="outline" className="w-full mt-2 h-7">
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Take Action
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Overdue Tasks</span>
              </div>
              <Badge variant="destructive">3</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Due This Week</span>
              </div>
              <Badge variant="secondary">8</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Closed This Month</span>
              </div>
              <Badge variant="secondary">11</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-xs font-medium">Deal closed: Sarah Johnson</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-xs font-medium">Showing scheduled: Michael Chen</p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="text-xs font-medium">New lead: Emily Rodriguez</p>
                <p className="text-xs text-muted-foreground">6 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pipeline Analytics</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={selectedTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedTab(tab.id as any)}
                className="flex-1 text-xs h-8"
              >
                <Icon className="h-3 w-3 mr-1" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'performance' && renderPerformanceTab()}
        {selectedTab === 'alerts' && renderAlertsTab()}
      </div>
    </div>
  );
}