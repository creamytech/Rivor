"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
  Target,
  Users,
  Clock,
  Zap,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadScoreWidget } from './LeadScoreWidget';

interface IntelligenceSummary {
  total: number;
  unread: number;
  actionRequired: number;
  byCategory: {
    positive: number;
    negative: number;
    neutral: number;
    urgent: number;
  };
  byImpact: {
    high: number;
    medium: number;
    low: number;
  };
}

interface LeadIntelligence {
  id: string;
  overallScore: number;
  conversionProbability: number;
  engagementScore: number;
  urgencyScore: number;
  valueScore: number;
  lastAnalyzedAt: string;
  lead?: {
    id: string;
    title: string;
  };
  contact?: {
    id: string;
  };
  insights: Array<{
    id: string;
    type: string;
    category: string;
    title: string;
    description: string;
    confidence: number;
    impact: string;
    actionRequired: boolean;
    isRead: boolean;
    createdAt: string;
  }>;
}

interface IntelligenceDashboardProps {
  className?: string;
}

export function IntelligenceDashboard({ className }: IntelligenceDashboardProps) {
  const [topIntelligence, setTopIntelligence] = useState<LeadIntelligence[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [summary, setSummary] = useState<IntelligenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    category: 'all',
    impact: 'all',
    actionRequired: false,
    unreadOnly: false
  });

  const fetchTopIntelligence = async () => {
    try {
      const response = await fetch('/api/intelligence/scoring?limit=10');
      if (response.ok) {
        const data = await response.json();
        setTopIntelligence(data.intelligence);
      }
    } catch (error) {
      console.error('Error fetching top intelligence:', error);
    }
  };

  const fetchInsights = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category !== 'all') params.set('category', filters.category);
      if (filters.impact !== 'all') params.set('impact', filters.impact);
      if (filters.actionRequired) params.set('actionRequired', 'true');
      if (filters.unreadOnly) params.set('unreadOnly', 'true');
      params.set('limit', '20');

      const response = await fetch(`/api/intelligence/insights?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const markInsightsAsRead = async (insightIds: string[]) => {
    try {
      const response = await fetch('/api/intelligence/insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightIds, action: 'read' })
      });
      
      if (response.ok) {
        // Refresh insights
        fetchInsights();
      }
    } catch (error) {
      console.error('Error marking insights as read:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchTopIntelligence(),
        fetchInsights()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [filters]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-blue-50 border-blue-200';
    if (score >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'positive': return CheckCircle;
      case 'urgent': return AlertTriangle;
      case 'negative': return AlertTriangle;
      default: return Brain;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'negative': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return ArrowUp;
      case 'low': return ArrowDown;
      default: return Minus;
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{summary?.total || 0}</p>
                <p className="text-xs text-gray-500">Total Insights</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{summary?.actionRequired || 0}</p>
                <p className="text-xs text-gray-500">Action Required</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{summary?.unread || 0}</p>
                <p className="text-xs text-gray-500">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {topIntelligence.length > 0 ? 
                    Math.round(topIntelligence.reduce((sum, intel) => sum + intel.overallScore, 0) / topIntelligence.length) 
                    : 0}
                </p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="leaderboard">Top Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm">Insights by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Positive</span>
                    </div>
                    <Badge variant="outline">{summary?.byCategory.positive || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Urgent</span>
                    </div>
                    <Badge variant="outline">{summary?.byCategory.urgent || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Negative</span>
                    </div>
                    <Badge variant="outline">{summary?.byCategory.negative || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Neutral</span>
                    </div>
                    <Badge variant="outline">{summary?.byCategory.neutral || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm">Insights by Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-4 w-4 text-red-500" />
                      <span className="text-sm">High Impact</span>
                    </div>
                    <Badge variant="outline">{summary?.byImpact.high || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Medium Impact</span>
                    </div>
                    <Badge variant="outline">{summary?.byImpact.medium || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Low Impact</span>
                    </div>
                    <Badge variant="outline">{summary?.byImpact.low || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Top Leads */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Top Scoring Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topIntelligence.slice(0, 5).map((intel, index) => (
                  <motion.div
                    key={intel.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      getScoreBg(intel.overallScore)
                    )}
                  >
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        getScoreColor(intel.overallScore)
                      )}>
                        {intel.overallScore}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {intel.lead?.title || `Contact ${intel.contact?.id.slice(-6)}`}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>{Math.round(intel.conversionProbability * 100)}% conversion</span>
                        <span>Engagement: {intel.engagementScore}</span>
                        <span>Urgency: {intel.urgencyScore}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {intel.insights.filter(i => i.actionRequired && !i.isRead).length} actions
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Filters */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                
                <select 
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">All Categories</option>
                  <option value="positive">Positive</option>
                  <option value="urgent">Urgent</option>
                  <option value="negative">Negative</option>
                  <option value="neutral">Neutral</option>
                </select>

                <select 
                  value={filters.impact}
                  onChange={(e) => setFilters(prev => ({ ...prev, impact: e.target.value }))}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">All Impact</option>
                  <option value="high">High Impact</option>
                  <option value="medium">Medium Impact</option>
                  <option value="low">Low Impact</option>
                </select>

                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox"
                    checked={filters.actionRequired}
                    onChange={(e) => setFilters(prev => ({ ...prev, actionRequired: e.target.checked }))}
                  />
                  Action Required
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox"
                    checked={filters.unreadOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, unreadOnly: e.target.checked }))}
                  />
                  Unread Only
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Insights List */}
          <div className="space-y-3">
            <AnimatePresence>
              {insights.map((insight, index) => {
                const Icon = getCategoryIcon(insight.category);
                const ImpactIcon = getImpactIcon(insight.impact);
                
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={cn(
                      "glass-card cursor-pointer transition-all hover:shadow-md",
                      !insight.isRead && "border-l-4 border-l-blue-500",
                      insight.actionRequired && !insight.isRead && "border-l-red-500"
                    )}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "rounded-full p-2 flex-shrink-0",
                            getCategoryColor(insight.category)
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-sm truncate">{insight.title}</h4>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <ImpactIcon className="h-3 w-3 text-gray-400" />
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(insight.confidence * 100)}%
                                </Badge>
                                {insight.actionRequired && !insight.isRead && (
                                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                {insight.leadIntelligence?.lead?.title || 
                                 `Contact ${insight.leadIntelligence?.contact?.id?.slice(-6)}`}
                              </span>
                              <span>•</span>
                              <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="capitalize">{insight.impact} impact</span>
                            </div>
                          </div>
                          
                          {!insight.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markInsightsAsRead([insight.id]);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topIntelligence.map((intel, index) => (
              <motion.div
                key={intel.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <LeadScoreWidget
                  leadId={intel.lead?.id}
                  contactId={intel.contact?.id}
                  className="h-full"
                />
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}