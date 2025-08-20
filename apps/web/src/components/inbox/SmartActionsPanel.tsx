"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, Target, Calendar, Building2, Users, Brain, TrendingUp, 
  CheckCircle, Clock, Mail, Phone, MessageSquare, FileText,
  ArrowRight, Sparkles, Bot, Home, DollarSign, PieChart,
  BarChart3, UserPlus, Handshake, Key, Calculator, MapPin,
  Layers, GitBranch, RefreshCw, Settings, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartAction {
  id: string;
  type: 'schedule_showing' | 'send_property_info' | 'create_lead' | 'follow_up' | 'market_update' | 'price_analysis' | 'referral_request';
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  category: 'lead_generation' | 'client_service' | 'workflow' | 'analytics';
  estimatedTime: string;
  data?: any;
  aiGenerated: boolean;
  dependencies?: string[];
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  lastTriggered?: string;
  successRate: number;
}

interface SmartActionsPanelProps {
  emailThread?: any;
  contactInfo?: any;
  onActionExecute: (action: SmartAction) => Promise<void>;
  className?: string;
}

export default function SmartActionsPanel({ 
  emailThread, 
  contactInfo, 
  onActionExecute,
  className 
}: SmartActionsPanelProps) {
  const [smartActions, setSmartActions] = useState<SmartAction[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'actions' | 'automations' | 'analytics'>('actions');
  const [executingAction, setExecutingAction] = useState<string | null>(null);

  useEffect(() => {
    generateSmartActions();
    loadAutomationRules();
  }, [emailThread, contactInfo]);

  const generateSmartActions = () => {
    if (!emailThread) return;

    const actions: SmartAction[] = [];

    // Showing request detection
    if (emailThread.hasSchedulingRequest || emailThread.snippet?.toLowerCase().includes('showing')) {
      actions.push({
        id: `schedule-${emailThread.id}`,
        type: 'schedule_showing',
        title: 'Schedule Property Showing',
        description: 'Auto-detected scheduling request. Send available times and book showing.',
        confidence: 92,
        priority: 'high',
        category: 'client_service',
        estimatedTime: '2 min',
        aiGenerated: true,
        data: { threadId: emailThread.id, propertyInfo: emailThread.propertyInfo }
      });
    }

    // High-value lead detection
    if (emailThread.leadScore && emailThread.leadScore > 75) {
      actions.push({
        id: `create-lead-${emailThread.id}`,
        type: 'create_lead',
        title: 'Create High-Priority Lead',
        description: `Lead score: ${emailThread.leadScore}%. Add to VIP pipeline with immediate follow-up.`,
        confidence: 88,
        priority: 'high',
        category: 'lead_generation',
        estimatedTime: '3 min',
        aiGenerated: true,
        data: { threadId: emailThread.id, score: emailThread.leadScore, clientType: emailThread.clientType }
      });
    }

    // Property inquiry response
    if (emailThread.emailType === 'property_inquiry' && emailThread.propertyInfo) {
      actions.push({
        id: `send-info-${emailThread.id}`,
        type: 'send_property_info',
        title: 'Send Property Information Package',
        description: `Send comprehensive details for ${emailThread.propertyInfo.address} with market analysis.`,
        confidence: 85,
        priority: 'medium',
        category: 'client_service',
        estimatedTime: '1 min',
        aiGenerated: true,
        data: { threadId: emailThread.id, propertyInfo: emailThread.propertyInfo }
      });
    }

    // Buyer inquiry follow-up
    if (emailThread.emailType === 'buyer_inquiry' && emailThread.extractedData?.budget) {
      actions.push({
        id: `market-analysis-${emailThread.id}`,
        type: 'price_analysis',
        title: 'Send Market Analysis',
        description: `Create personalized market report for ${emailThread.extractedData.budget.min}-${emailThread.extractedData.budget.max} budget range.`,
        confidence: 78,
        priority: 'medium',
        category: 'analytics',
        estimatedTime: '5 min',
        aiGenerated: true,
        data: { budget: emailThread.extractedData.budget, preferences: emailThread.extractedData }
      });
    }

    // Follow-up automation
    if (emailThread.requiresFollowUp) {
      actions.push({
        id: `follow-up-${emailThread.id}`,
        type: 'follow_up',
        title: 'Schedule Smart Follow-up',
        description: 'Set up personalized follow-up sequence based on client engagement patterns.',
        confidence: 73,
        priority: 'medium',
        category: 'workflow',
        estimatedTime: '2 min',
        aiGenerated: true,
        data: { threadId: emailThread.id, lastInteraction: emailThread.lastMessageAt }
      });
    }

    // Referral opportunity
    if (contactInfo?.communication?.emailEngagement > 80) {
      actions.push({
        id: `referral-${emailThread.id}`,
        type: 'referral_request',
        title: 'Request Referral',
        description: `High engagement client (${contactInfo.communication.emailEngagement}%). Perfect candidate for referral request.`,
        confidence: 67,
        priority: 'low',
        category: 'lead_generation',
        estimatedTime: '3 min',
        aiGenerated: true,
        data: { contactId: contactInfo.id, engagementScore: contactInfo.communication.emailEngagement }
      });
    }

    setSmartActions(actions.sort((a, b) => b.confidence - a.confidence));
  };

  const loadAutomationRules = () => {
    // Mock automation rules - in real implementation, these would be loaded from the database
    const rules: AutomationRule[] = [
      {
        id: 'auto-schedule',
        name: 'Auto-Schedule Showing Requests',
        trigger: 'Email contains scheduling keywords',
        action: 'Send calendar link and available times',
        enabled: true,
        lastTriggered: '2 hours ago',
        successRate: 94
      },
      {
        id: 'lead-scoring',
        name: 'Smart Lead Scoring',
        trigger: 'New buyer inquiry received',
        action: 'Analyze and score lead potential',
        enabled: true,
        lastTriggered: '1 day ago',
        successRate: 87
      },
      {
        id: 'property-match',
        name: 'Property Matching',
        trigger: 'Client preferences updated',
        action: 'Send matching property suggestions',
        enabled: true,
        lastTriggered: '3 hours ago',
        successRate: 76
      },
      {
        id: 'follow-up-reminder',
        name: 'Follow-up Reminders',
        trigger: 'No response after 3 days',
        action: 'Create follow-up task and reminder',
        enabled: false,
        lastTriggered: '1 week ago',
        successRate: 82
      }
    ];
    setAutomationRules(rules);
  };

  const executeAction = async (action: SmartAction) => {
    setExecutingAction(action.id);
    try {
      await onActionExecute(action);
      // Remove executed action from list
      setSmartActions(prev => prev.filter(a => a.id !== action.id));
    } catch (error) {
      console.error('Failed to execute action:', error);
    } finally {
      setExecutingAction(null);
    }
  };

  const getActionIcon = (type: SmartAction['type']) => {
    switch (type) {
      case 'schedule_showing':
        return <Calendar className="h-4 w-4" />;
      case 'send_property_info':
        return <Building2 className="h-4 w-4" />;
      case 'create_lead':
        return <Target className="h-4 w-4" />;
      case 'follow_up':
        return <Clock className="h-4 w-4" />;
      case 'market_update':
        return <TrendingUp className="h-4 w-4" />;
      case 'price_analysis':
        return <BarChart3 className="h-4 w-4" />;
      case 'referral_request':
        return <Users className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'lead_generation':
        return 'bg-blue-100 text-blue-700';
      case 'client_service':
        return 'bg-green-100 text-green-700';
      case 'workflow':
        return 'bg-purple-100 text-purple-700';
      case 'analytics':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-purple-500" />
          Smart Actions & Automation
        </CardTitle>
        
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-3">
          <Button
            variant={activeTab === 'actions' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('actions')}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            Actions ({smartActions.length})
          </Button>
          <Button
            variant={activeTab === 'automations' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('automations')}
            className="text-xs"
          >
            <Bot className="h-3 w-3 mr-1" />
            Rules ({automationRules.filter(r => r.enabled).length})
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('analytics')}
            className="text-xs"
          >
            <PieChart className="h-3 w-3 mr-1" />
            Analytics
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Smart Actions Tab */}
        {activeTab === 'actions' && (
          <div className="space-y-3">
            {smartActions.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">No smart actions detected</p>
                <p className="text-xs text-muted-foreground">AI will analyze incoming emails for automation opportunities</p>
              </div>
            ) : (
              smartActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 border rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg", getCategoryColor(action.category))}>
                      {getActionIcon(action.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{action.title}</h4>
                        <Badge variant="outline" className={cn("text-xs", getPriorityColor(action.priority))}>
                          {action.priority}
                        </Badge>
                        {action.aiGenerated && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {action.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Confidence: {action.confidence}%</span>
                          <span>•</span>
                          <span>~{action.estimatedTime}</span>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => executeAction(action)}
                          disabled={executingAction === action.id}
                          className="text-xs h-7"
                        >
                          {executingAction === action.id ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <ArrowRight className="h-3 w-3 mr-1" />
                          )}
                          Execute
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Automation Rules Tab */}
        {activeTab === 'automations' && (
          <div className="space-y-3">
            {automationRules.map((rule, index) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 border rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{rule.name}</h4>
                    <Badge variant={rule.enabled ? "default" : "secondary"} className="text-xs">
                      {rule.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div><strong>Trigger:</strong> {rule.trigger}</div>
                  <div><strong>Action:</strong> {rule.action}</div>
                  <div className="flex items-center gap-4 mt-2">
                    <span>Success Rate: {rule.successRate}%</span>
                    {rule.lastTriggered && <span>Last: {rule.lastTriggered}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
            
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Rule
            </Button>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">94%</div>
                <div className="text-xs text-muted-foreground">Automation Success</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">2.3h</div>
                <div className="text-xs text-muted-foreground">Time Saved Daily</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h5 className="font-medium text-sm mb-2">Recent Automation Activity</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs p-2 bg-green-50 rounded border">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Auto-scheduled showing for 123 Main St</span>
                  <span className="text-muted-foreground ml-auto">2m ago</span>
                </div>
                <div className="flex items-center gap-2 text-xs p-2 bg-blue-50 rounded border">
                  <Target className="h-3 w-3 text-blue-500" />
                  <span>Created high-priority lead (Score: 89%)</span>
                  <span className="text-muted-foreground ml-auto">15m ago</span>
                </div>
                <div className="flex items-center gap-2 text-xs p-2 bg-purple-50 rounded border">
                  <Mail className="h-3 w-3 text-purple-500" />
                  <span>Sent property info package</span>
                  <span className="text-muted-foreground ml-auto">1h ago</span>
                </div>
              </div>
            </div>

            {/* Smart Insights */}
            <div>
              <h5 className="font-medium text-sm mb-2">Smart Insights</h5>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                  💡 Your response time to showing requests has improved by 40% this week
                </div>
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  📈 Lead conversion rate is 23% higher when using AI-generated follow-ups
                </div>
                <div className="p-2 bg-green-50 rounded border border-green-200">
                  🎯 Best time to send property info: Tuesdays 2-4 PM (67% open rate)
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}