"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  TrendingUp,
  Clock,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadIntelligence {
  id: string;
  overallScore: number;
  conversionProbability: number;
  engagementScore: number;
  urgencyScore: number;
  valueScore: number;
  communicationStyle: string;
  optimalContactTime: string;
  decisionTimeframe: string;
  lastAnalyzedAt: string;
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
  }>;
  predictions: Array<{
    id: string;
    predictionType: string;
    prediction: string;
    probability: number;
    timeframe: string;
  }>;
  lead?: {
    id: string;
    title: string;
  };
  contact?: {
    id: string;
  };
}

interface LeadScoreWidgetProps {
  leadId?: string;
  contactId?: string;
  className?: string;
  autoRefresh?: boolean;
}

export function LeadScoreWidget({ 
  leadId, 
  contactId, 
  className,
  autoRefresh = false 
}: LeadScoreWidgetProps) {
  const [intelligence, setIntelligence] = useState<LeadIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIntelligence = async (forceRefresh = false) => {
    if (!leadId && !contactId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (leadId) params.set('leadId', leadId);
      if (contactId) params.set('contactId', contactId);
      
      const response = await fetch(`/api/intelligence/scoring?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setIntelligence(data.intelligence);
      } else if (response.status === 404) {
        // No intelligence record exists yet, trigger analysis
        if (!forceRefresh) {
          await analyzeIntelligence();
        }
      } else {
        throw new Error('Failed to fetch intelligence data');
      }
    } catch (err) {
      console.error('Error fetching intelligence:', err);
      setError('Failed to load intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const analyzeIntelligence = async () => {
    if (!leadId && !contactId) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/intelligence/scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          contactId,
          forceRefresh: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIntelligence(data.intelligence);
      } else {
        throw new Error('Failed to analyze intelligence');
      }
    } catch (err) {
      console.error('Error analyzing intelligence:', err);
      setError('Failed to analyze lead intelligence');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, [leadId, contactId]);

  useEffect(() => {
    if (autoRefresh && intelligence) {
      const interval = setInterval(() => {
        fetchIntelligence();
      }, 5 * 60 * 1000); // Refresh every 5 minutes
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, intelligence]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-blue-50';
    if (score >= 40) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'positive': return CheckCircle;
      case 'urgent': return AlertTriangle;
      case 'negative': return AlertTriangle;
      default: return Lightbulb;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'negative': return 'text-orange-600 bg-orange-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  if (!leadId && !contactId) {
    return null;
  }

  if (loading && !intelligence) {
    return (
      <Card className={cn("glass-card", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || (!intelligence && !analyzing)) {
    return (
      <Card className={cn("glass-card", className)}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500 mb-4">
              {error || 'No intelligence data available'}
            </p>
            <Button onClick={() => analyzeIntelligence()} disabled={analyzing}>
              {analyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Analyze Lead
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-purple-500" />
            Smart Lead Intelligence
            <Badge variant="outline" className="ml-auto text-xs">
              {Math.round(intelligence?.conversionProbability * 100 || 0)}% likely
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            Last analyzed {intelligence?.lastAnalyzedAt ? 
              new Date(intelligence.lastAnalyzedAt).toLocaleString() : 'Never'
            }
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 ml-auto"
              onClick={() => fetchIntelligence(true)}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {/* Overall Score */}
          <div className={cn(
            "rounded-lg p-4 text-center",
            getScoreBg(intelligence?.overallScore || 0)
          )}>
            <div className={cn(
              "text-2xl font-bold mb-1",
              getScoreColor(intelligence?.overallScore || 0)
            )}>
              {intelligence?.overallScore || 0}
            </div>
            <div className="text-xs text-gray-600">Overall Lead Score</div>
            <Progress 
              value={intelligence?.overallScore || 0} 
              className="mt-2 h-1"
            />
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Engagement
                </span>
                <span className="font-medium">{intelligence?.engagementScore || 0}</span>
              </div>
              <Progress value={intelligence?.engagementScore || 0} className="h-1" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Urgency
                </span>
                <span className="font-medium">{intelligence?.urgencyScore || 0}</span>
              </div>
              <Progress value={intelligence?.urgencyScore || 0} className="h-1" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Value
                </span>
                <span className="font-medium">{intelligence?.valueScore || 0}</span>
              </div>
              <Progress value={intelligence?.valueScore || 0} className="h-1" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Convert %
                </span>
                <span className="font-medium">
                  {Math.round((intelligence?.conversionProbability || 0) * 100)}%
                </span>
              </div>
              <Progress value={(intelligence?.conversionProbability || 0) * 100} className="h-1" />
            </div>
          </div>

          {/* Quick Insights */}
          {intelligence?.insights && intelligence.insights.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">Key Insights</div>
              {intelligence.insights.slice(0, 3).map((insight) => {
                const Icon = getCategoryIcon(insight.category);
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded text-xs",
                      getCategoryColor(insight.category)
                    )}
                  >
                    <Icon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{insight.title}</div>
                      <div className="text-xs opacity-75 truncate">{insight.description}</div>
                    </div>
                    {insight.actionRequired && !insight.isRead && (
                      <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Top Prediction */}
          {intelligence?.predictions && intelligence.predictions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">Prediction</div>
              <div className="bg-gray-50 rounded p-2 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="h-3 w-3 text-purple-500" />
                  <Badge variant="outline" className="text-xs">
                    {Math.round(intelligence.predictions[0].probability * 100)}% confidence
                  </Badge>
                </div>
                <div className="text-gray-700">
                  {intelligence.predictions[0].prediction}
                </div>
              </div>
            </div>
          )}

          {/* Communication Optimization */}
          {intelligence && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-medium text-gray-700">Style</div>
                <div className="capitalize text-gray-600">
                  {intelligence.communicationStyle}
                </div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-medium text-gray-700">Best Time</div>
                <div className="capitalize text-gray-600">
                  {intelligence.optimalContactTime}
                </div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-medium text-gray-700">Timeline</div>
                <div className="capitalize text-gray-600">
                  {intelligence.decisionTimeframe.replace('_', ' ')}
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {intelligence?.insights?.some(i => i.actionRequired && !i.isRead) && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                // Navigate to insights view or take action
                if (leadId) {
                  window.location.href = `/app/pipeline?lead=${leadId}&tab=intelligence`;
                } else if (contactId) {
                  window.location.href = `/app/contacts?contact=${contactId}&tab=intelligence`;
                }
              }}
            >
              <Eye className="h-3 w-3 mr-2" />
              View Insights ({intelligence.insights.filter(i => i.actionRequired && !i.isRead).length})
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}