"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Settings,
  Shield,
  Bell,
  Palette,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Eye,
  EyeOff,
  Save,
  Plus,
  X,
  Download,
  Upload,
  Trash2,
  User,
  Mail,
  Calendar,
  Building,
  Globe,
  Lock,
  Unlock,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  BarChart3,
  Filter,
  Tag,
  Hash,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: 'high' | 'medium' | 'low';
  conditions: {
    type: 'keyword' | 'domain' | 'confidence' | 'sender';
    operator: 'contains' | 'equals' | 'greater_than' | 'less_than';
    value: string | number;
  }[];
  actions: {
    type: 'promote' | 'dismiss' | 'assign' | 'tag';
    value: string;
  }[];
  matchCount: number;
}

interface Integration {
  id: string;
  name: string;
  type: 'email' | 'calendar' | 'crm' | 'phone';
  status: 'healthy' | 'warning' | 'error' | 'disconnected';
  lastSync: Date;
  errors: number;
  needsReauth: boolean;
  scopes: string[];
  tokenHealth: {
    total: number;
    used: number;
    remaining: number;
    resetDate: Date;
  };
}

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  inApp: boolean;
  email: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  enabled: boolean;
}

export default function EnhancedSettings() {
  const [activeTab, setActiveTab] = useState('lead-rules');
  const [leadRules, setLeadRules] = useState<LeadRule[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [notifications, setNotifications] = useState<NotificationSetting[]>([]);
  const [appearance, setAppearance] = useState({
    theme: 'system',
    accentColor: 'blue',
    glassIntensity: 'medium',
    highContrast: false,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [newRule, setNewRule] = useState<Partial<LeadRule>>({
    name: '',
    enabled: true,
    priority: 'medium',
    conditions: [],
    actions: [],
  });

  // Mock data
  useEffect(() => {
    setLeadRules([
      {
        id: '1',
        name: 'High Confidence Buyers',
        enabled: true,
        priority: 'high',
        conditions: [
          { type: 'confidence', operator: 'greater_than', value: 80 },
          { type: 'keyword', operator: 'contains', value: 'buy' },
        ],
        actions: [
          { type: 'promote', value: 'qualified' },
          { type: 'assign', value: 'sales-team' },
        ],
        matchCount: 127,
      },
      {
        id: '2',
        name: 'Newsletter Filter',
        enabled: true,
        priority: 'medium',
        conditions: [
          { type: 'domain', operator: 'contains', value: 'newsletter' },
        ],
        actions: [
          { type: 'dismiss', value: 'newsletter' },
        ],
        matchCount: 45,
      },
    ]);

    setIntegrations([
      {
        id: '1',
        name: 'Gmail',
        type: 'email',
        status: 'healthy',
        lastSync: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        errors: 0,
        needsReauth: false,
        scopes: ['gmail.readonly', 'gmail.send'],
        tokenHealth: {
          total: 1000,
          used: 234,
          remaining: 766,
          resetDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now
        },
      },
      {
        id: '2',
        name: 'Google Calendar',
        type: 'calendar',
        status: 'warning',
        lastSync: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        errors: 3,
        needsReauth: false,
        scopes: ['calendar.readonly', 'calendar.events'],
        tokenHealth: {
          total: 1000,
          used: 567,
          remaining: 433,
          resetDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      },
      {
        id: '3',
        name: 'Salesforce',
        type: 'crm',
        status: 'error',
        lastSync: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        errors: 12,
        needsReauth: true,
        scopes: ['contacts.read', 'leads.write'],
        tokenHealth: {
          total: 1000,
          used: 890,
          remaining: 110,
          resetDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      },
    ]);

    setNotifications([
      {
        id: '1',
        name: 'New Lead Detected',
        description: 'When a new lead is identified from your email stream',
        inApp: true,
        email: true,
        frequency: 'immediate',
        enabled: true,
      },
      {
        id: '2',
        name: 'High Priority Reply Due',
        description: 'When you have urgent replies that need attention',
        inApp: true,
        email: false,
        frequency: 'immediate',
        enabled: true,
      },
      {
        id: '3',
        name: 'Weekly Lead Summary',
        description: 'Summary of all leads and activities from the past week',
        inApp: false,
        email: true,
        frequency: 'weekly',
        enabled: true,
      },
      {
        id: '4',
        name: 'Integration Issues',
        description: 'When integrations fail or need reauthorization',
        inApp: true,
        email: true,
        frequency: 'immediate',
        enabled: true,
      },
    ]);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'disconnected':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const handleAddCondition = () => {
    setNewRule(prev => ({
      ...prev,
      conditions: [...(prev.conditions || []), {
        type: 'keyword',
        operator: 'contains',
        value: '',
      }],
    }));
  };

  const handleAddAction = () => {
    setNewRule(prev => ({
      ...prev,
      actions: [...(prev.actions || []), {
        type: 'promote',
        value: '',
      }],
    }));
  };

  const handleSaveRule = () => {
    if (newRule.name && newRule.conditions && newRule.conditions.length > 0) {
      const rule: LeadRule = {
        id: Date.now().toString(),
        name: newRule.name,
        enabled: newRule.enabled || true,
        priority: newRule.priority || 'medium',
        conditions: newRule.conditions,
        actions: newRule.actions || [],
        matchCount: 0,
      };
      setLeadRules(prev => [...prev, rule]);
      setNewRule({
        name: '',
        enabled: true,
        priority: 'medium',
        conditions: [],
        actions: [],
      });
    }
  };

  const handleFixIntegration = (id: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === id 
        ? { ...integration, status: 'healthy', errors: 0, needsReauth: false }
        : integration
    ));
  };

  const handleReauthIntegration = (id: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === id 
        ? { ...integration, needsReauth: false }
        : integration
    ));
  };

  const renderLeadRulesEditor = () => (
    <div className="space-y-6">
      {/* Rules List */}
      <GlassCard variant="gradient" intensity="medium">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Lead Rules ({leadRules.length})
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          {leadRules.map((rule) => (
            <div key={rule.id} className="p-4 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Switch checked={rule.enabled} />
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      {rule.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={rule.priority === 'high' ? 'destructive' : rule.priority === 'medium' ? 'default' : 'secondary'}>
                        {rule.priority}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {rule.matchCount} matches
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Conditions:</span>
                </div>
                <div className="ml-6 space-y-1">
                  {rule.conditions.map((condition, index) => (
                    <div key={index} className="text-sm text-slate-600 dark:text-slate-400">
                      {condition.type} {condition.operator} {condition.value}
                    </div>
                  ))}
                </div>
              </div>

              {rule.actions.length > 0 && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Actions:</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {rule.actions.map((action, index) => (
                      <div key={index} className="text-sm text-slate-600 dark:text-slate-400">
                        {action.type}: {action.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </GlassCardContent>
      </GlassCard>

      {/* New Rule Form */}
      <GlassCard variant="gradient" intensity="light">
        <GlassCardHeader>
          <GlassCardTitle>Create New Rule</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Rule Name
              </label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., High Confidence Buyers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Priority
              </label>
              <select
                value={newRule.priority}
                onChange={(e) => setNewRule(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Conditions
              </label>
              <Button variant="outline" size="sm" onClick={handleAddCondition}>
                <Plus className="h-4 w-4 mr-1" />
                Add Condition
              </Button>
            </div>
            {newRule.conditions?.map((condition, index) => (
              <div key={index} className="flex items-center gap-2 p-3 border border-white/20 rounded-lg">
                <select
                  value={condition.type}
                  onChange={(e) => {
                    const updatedConditions = [...(newRule.conditions || [])];
                    updatedConditions[index].type = e.target.value as any;
                    setNewRule(prev => ({ ...prev, conditions: updatedConditions }));
                  }}
                  className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="keyword">Keyword</option>
                  <option value="domain">Domain</option>
                  <option value="confidence">Confidence</option>
                  <option value="sender">Sender</option>
                </select>
                <select
                  value={condition.operator}
                  onChange={(e) => {
                    const updatedConditions = [...(newRule.conditions || [])];
                    updatedConditions[index].operator = e.target.value as any;
                    setNewRule(prev => ({ ...prev, conditions: updatedConditions }));
                  }}
                  className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="contains">Contains</option>
                  <option value="equals">Equals</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                </select>
                <Input
                  value={condition.value}
                  onChange={(e) => {
                    const updatedConditions = [...(newRule.conditions || [])];
                    updatedConditions[index].value = e.target.value;
                    setNewRule(prev => ({ ...prev, conditions: updatedConditions }));
                  }}
                  placeholder="Value"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updatedConditions = newRule.conditions?.filter((_, i) => i !== index);
                    setNewRule(prev => ({ ...prev, conditions: updatedConditions }));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Actions
              </label>
              <Button variant="outline" size="sm" onClick={handleAddAction}>
                <Plus className="h-4 w-4 mr-1" />
                Add Action
              </Button>
            </div>
            {newRule.actions?.map((action, index) => (
              <div key={index} className="flex items-center gap-2 p-3 border border-white/20 rounded-lg">
                <select
                  value={action.type}
                  onChange={(e) => {
                    const updatedActions = [...(newRule.actions || [])];
                    updatedActions[index].type = e.target.value as any;
                    setNewRule(prev => ({ ...prev, actions: updatedActions }));
                  }}
                  className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="promote">Promote</option>
                  <option value="dismiss">Dismiss</option>
                  <option value="assign">Assign</option>
                  <option value="tag">Tag</option>
                </select>
                <Input
                  value={action.value}
                  onChange={(e) => {
                    const updatedActions = [...(newRule.actions || [])];
                    updatedActions[index].value = e.target.value;
                    setNewRule(prev => ({ ...prev, actions: updatedActions }));
                  }}
                  placeholder="Value"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updatedActions = newRule.actions?.filter((_, i) => i !== index);
                    setNewRule(prev => ({ ...prev, actions: updatedActions }));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveRule} disabled={!newRule.name || !newRule.conditions?.length}>
              <Save className="h-4 w-4 mr-2" />
              Save Rule
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Live Preview */}
      <GlassCard variant="gradient" intensity="light">
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <GlassCardTitle>Live Preview</GlassCardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </GlassCardHeader>
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCardContent>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Sample messages that would match your rules:
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded border-l-4 border-green-500">
                      <div className="font-medium">"I'm interested in buying a 3-bedroom house"</div>
                      <div className="text-xs text-slate-500">Confidence: 85% - Would match: High Confidence Buyers</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-700 rounded border-l-4 border-red-500">
                      <div className="font-medium">"Weekly Newsletter - Market Updates"</div>
                      <div className="text-xs text-slate-500">Would be dismissed by: Newsletter Filter</div>
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );

  const renderIntegrationsHealth = () => (
    <div className="space-y-6">
      {/* Integration Status */}
      <GlassCard variant="gradient" intensity="medium">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-500" />
            Integration Health
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.id} className="p-4 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    {integration.type === 'email' && <Mail className="h-5 w-5 text-blue-500" />}
                    {integration.type === 'calendar' && <Calendar className="h-5 w-5 text-green-500" />}
                    {integration.type === 'crm' && <Building className="h-5 w-5 text-purple-500" />}
                    {integration.type === 'phone' && <Globe className="h-5 w-5 text-orange-500" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      {integration.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(integration.status)}
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                      {integration.errors > 0 && (
                        <Badge variant="destructive">
                          {integration.errors} errors
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {integration.needsReauth && (
                    <Button variant="outline" size="sm" onClick={() => handleReauthIntegration(integration.id)}>
                      <Lock className="h-4 w-4 mr-1" />
                      Reauth
                    </Button>
                  )}
                  {integration.status !== 'healthy' && (
                    <Button variant="outline" size="sm" onClick={() => handleFixIntegration(integration.id)}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Fix
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Last Sync:</span>
                  <div className="font-medium">
                    {integration.lastSync.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Token Usage:</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(integration.tokenHealth.used / integration.tokenHealth.total) * 100} className="flex-1" />
                    <span className="text-xs">
                      {integration.tokenHealth.used}/{integration.tokenHealth.total}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Scopes:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {integration.scopes.map((scope, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </GlassCardContent>
      </GlassCard>

      {/* Token Health Summary */}
      <GlassCard variant="gradient" intensity="light">
        <GlassCardHeader>
          <GlassCardTitle>Token Health Overview</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">2</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Healthy</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">1</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Warning</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">1</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Error</div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <GlassCard variant="gradient" intensity="medium">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Notification Settings
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="p-4 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">
                    {notification.name}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {notification.description}
                  </p>
                </div>
                <Switch
                  checked={notification.enabled}
                  onCheckedChange={(checked) => {
                    setNotifications(prev => prev.map(n => 
                      n.id === notification.id ? { ...n, enabled: checked } : n
                    ));
                  }}
                />
              </div>
              
              {notification.enabled && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">In-app notifications</span>
                    </div>
                    <Switch
                      checked={notification.inApp}
                      onCheckedChange={(checked) => {
                        setNotifications(prev => prev.map(n => 
                          n.id === notification.id ? { ...n, inApp: checked } : n
                        ));
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Email notifications</span>
                    </div>
                    <Switch
                      checked={notification.email}
                      onCheckedChange={(checked) => {
                        setNotifications(prev => prev.map(n => 
                          n.id === notification.id ? { ...n, email: checked } : n
                        ));
                      }}
                    />
                  </div>
                  
                  {notification.email && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email Frequency
                      </label>
                      <select
                        value={notification.frequency}
                        onChange={(e) => {
                          setNotifications(prev => prev.map(n => 
                            n.id === notification.id ? { ...n, frequency: e.target.value as any } : n
                          ));
                        }}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="daily">Daily Digest</option>
                        <option value="weekly">Weekly Digest</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-6">
      {/* Theme Settings */}
      <GlassCard variant="gradient" intensity="medium">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-500" />
            Appearance Settings
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          {/* Theme */}
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Theme</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'light', icon: Sun, label: 'Light', desc: 'Clean and bright' },
                { value: 'dark', icon: Moon, label: 'Dark', desc: 'Easy on the eyes' },
                { value: 'system', icon: Monitor, label: 'System', desc: 'Follows system' },
              ].map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => setAppearance(prev => ({ ...prev, theme: theme.value }))}
                  className={cn(
                    "p-4 border rounded-lg text-left transition-colors",
                    appearance.theme === theme.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <theme.icon className="h-6 w-6 text-slate-500 mb-2" />
                  <p className="font-medium text-slate-900 dark:text-slate-100">{theme.label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{theme.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Accent Color</h4>
            <div className="flex gap-2">
              {['blue', 'green', 'purple', 'orange', 'red', 'teal'].map((color) => (
                <button
                  key={color}
                  onClick={() => setAppearance(prev => ({ ...prev, accentColor: color }))}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    appearance.accentColor === color
                      ? "border-slate-900 dark:border-slate-100 scale-110"
                      : "border-slate-300 dark:border-slate-600 hover:scale-105"
                  )}
                  style={{
                    backgroundColor: color === 'blue' ? '#3b82f6' :
                                  color === 'green' ? '#10b981' :
                                  color === 'purple' ? '#8b5cf6' :
                                  color === 'orange' ? '#f59e0b' :
                                  color === 'red' ? '#ef4444' :
                                  '#14b8a6'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Glass Intensity */}
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Glass Effect Intensity</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'light', label: 'Light', desc: 'Subtle transparency' },
                { value: 'medium', label: 'Medium', desc: 'Balanced effect' },
                { value: 'strong', label: 'Strong', desc: 'Bold glassmorphism' },
              ].map((intensity) => (
                <button
                  key={intensity.value}
                  onClick={() => setAppearance(prev => ({ ...prev, glassIntensity: intensity.value as any }))}
                  className={cn(
                    "p-4 border rounded-lg text-left transition-colors",
                    appearance.glassIntensity === intensity.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <Sparkles className="h-6 w-6 text-slate-500 mb-2" />
                  <p className="font-medium text-slate-900 dark:text-slate-100">{intensity.label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{intensity.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">High Contrast Mode</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Increase contrast for better accessibility
              </p>
            </div>
            <Switch
              checked={appearance.highContrast}
              onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, highContrast: checked }))}
            />
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/10">
          <TabsTrigger value="lead-rules" className="text-sm">Lead Rules</TabsTrigger>
          <TabsTrigger value="integrations" className="text-sm">Integrations</TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm">Notifications</TabsTrigger>
          <TabsTrigger value="appearance" className="text-sm">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lead-rules" className="mt-6">
          {renderLeadRulesEditor()}
        </TabsContent>
        
        <TabsContent value="integrations" className="mt-6">
          {renderIntegrationsHealth()}
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          {renderNotifications()}
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-6">
          {renderAppearance()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
