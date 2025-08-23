"use client";
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Settings, 
  Shield, 
  Bell, 
  Palette, 
  Users, 
  Database, 
  Key, 
  Globe, 
  Mail, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  X,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  Heart,
  MessageSquare,
  FileText,
  Image,
  Monitor,
  Smartphone,
  Moon,
  Sun,
  Sparkles
} from 'lucide-react';

interface LeadRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    field: string;
    operator: string;
    value: string;
  }[];
  actions: {
    type: string;
    value: string;
  }[];
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface Integration {
  id: string;
  name: string;
  type: 'email' | 'calendar' | 'crm' | 'analytics';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync: string;
  errorCount: number;
  scopes: string[];
  icon: string;
}

interface NotificationSetting {
  id: string;
  type: string;
  enabled: boolean;
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
}

interface AppearanceSetting {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  glassIntensity: 'low' | 'medium' | 'high';
  highContrast: boolean;
  animations: boolean;
}

interface EnhancedSettingsProps {
  className?: string;
}

interface AddRuleModalProps {
  onClose: () => void;
  onSave: (rule: Partial<LeadRule>) => void;
}

function AddRuleModal({ onClose, onSave }: AddRuleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && description.trim()) {
      onSave({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="w-full max-w-md mx-4 glass-modal rounded-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Add Lead Rule</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Rule Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter rule name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter rule description"
              required
            />
          </div>
          
          <div className="flex items-center gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Create Rule
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EnhancedSettings({ className = '' }: EnhancedSettingsProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('appearance'); // Start with appearance tab
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<LeadRule | null>(null);
  
  // Local state for settings
  const [localNotifications, setLocalNotifications] = useState<NotificationSetting[]>([]);
  const [localAppearance, setLocalAppearance] = useState<AppearanceSetting | null>(null);
  const [localLeadRules, setLocalLeadRules] = useState<LeadRule[]>([]);
  
  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('rivor-notifications');
      if (savedNotifications) {
        setLocalNotifications(JSON.parse(savedNotifications));
      } else {
        setLocalNotifications(defaultNotifications);
        localStorage.setItem('rivor-notifications', JSON.stringify(defaultNotifications));
      }
      
      const savedAppearance = localStorage.getItem('rivor-appearance');
      if (savedAppearance) {
        setLocalAppearance(JSON.parse(savedAppearance));
      } else {
        setLocalAppearance(defaultAppearance);
        localStorage.setItem('rivor-appearance', JSON.stringify(defaultAppearance));
      }
      
      const savedLeadRules = localStorage.getItem('rivor-lead-rules');
      if (savedLeadRules) {
        setLocalLeadRules(JSON.parse(savedLeadRules));
      } else {
        setLocalLeadRules(defaultLeadRules);
        localStorage.setItem('rivor-lead-rules', JSON.stringify(defaultLeadRules));
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
      // Fallback to defaults
      setLocalNotifications(defaultNotifications);
      setLocalAppearance(defaultAppearance);
      setLocalLeadRules(defaultLeadRules);
    }
  }, []);

  // Fetch real data from tRPC with error handling
  const { data: leadRulesData, isLoading: leadRulesLoading, error: leadRulesError, refetch: refetchLeadRules } = trpc.settings.getLeadRules.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false
  });
  const { data: notificationsData, isLoading: notificationsLoading, error: notificationsError, refetch: refetchNotifications } = trpc.settings.getNotifications.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false
  });
  const { data: appearanceData, isLoading: appearanceLoading, error: appearanceError, refetch: refetchAppearance } = trpc.settings.getAppearance.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false
  });

  // Mutations
  const updateLeadRulesMutation = trpc.settings.updateLeadRules.useMutation({
    onSuccess: () => refetchLeadRules()
  });

  const updateNotificationsMutation = trpc.settings.updateNotifications.useMutation({
    onSuccess: () => refetchNotifications()
  });

  const updateAppearanceMutation = trpc.settings.updateAppearance.useMutation({
    onSuccess: () => refetchAppearance()
  });

  // Fallback data for when API calls fail
  const defaultLeadRules: LeadRule[] = [
    {
      id: 'default-1',
      name: 'High Value Lead',
      description: 'Automatically prioritize leads with high property value',
      enabled: true,
      conditions: [
        { field: 'price', operator: 'greater than', value: '500000' }
      ],
      actions: [
        { type: 'assign', value: 'senior_agent' },
        { type: 'priority', value: 'high' }
      ],
      priority: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'default-2', 
      name: 'First Time Buyer',
      description: 'Route first-time buyers to specialized agents',
      enabled: true,
      conditions: [
        { field: 'buyer_type', operator: 'equals', value: 'first_time' }
      ],
      actions: [
        { type: 'assign', value: 'fthb_specialist' }
      ],
      priority: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const defaultNotifications: NotificationSetting[] = [
    {
      id: 'new-lead',
      type: 'New Lead',
      enabled: true,
      channels: { email: true, push: true, inApp: true },
      frequency: 'immediate'
    },
    {
      id: 'task-due',
      type: 'Task Due',
      enabled: true,
      channels: { email: false, push: true, inApp: true },
      frequency: 'daily'
    },
    {
      id: 'weekly-report',
      type: 'Weekly Report',
      enabled: false,
      channels: { email: true, push: false, inApp: false },
      frequency: 'weekly'
    }
  ];

  const defaultAppearance: AppearanceSetting = {
    theme: 'system',
    accentColor: 'blue',
    glassIntensity: 'medium',
    highContrast: false,
    animations: true
  };

  // Use local state as primary source, fallback to API data only if local is empty
  const leadRules = localLeadRules.length > 0 ? localLeadRules : defaultLeadRules;
  const notifications = localNotifications.length > 0 ? localNotifications : defaultNotifications;
  const appearance = localAppearance || defaultAppearance;

  // Mock integrations data (would come from tRPC in real implementation)
  const integrations: Integration[] = [
    {
      id: '1',
      name: 'Gmail',
      type: 'email',
      status: 'connected',
      lastSync: '2 minutes ago',
      errorCount: 0,
      scopes: ['read', 'send', 'modify'],
      icon: '📧'
    },
    {
      id: '2',
      name: 'Google Calendar',
      type: 'calendar',
      status: 'connected',
      lastSync: '5 minutes ago',
      errorCount: 0,
      scopes: ['read', 'write'],
      icon: '📅'
    },
    {
      id: '3',
      name: 'Outlook',
      type: 'email',
      status: 'error',
      lastSync: '1 hour ago',
      errorCount: 3,
      scopes: ['read', 'send'],
      icon: '📧'
    }
  ];

  const handleAddRule = (ruleData: Partial<LeadRule>) => {
    try {
      const newRule: LeadRule = {
        id: `rule_${Date.now()}`,
        name: ruleData.name || 'New Rule',
        description: ruleData.description || 'New rule description',
        enabled: true,
        conditions: ruleData.conditions || [],
        actions: ruleData.actions || [],
        priority: leadRules.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedRules = [...leadRules, newRule];
      setLocalLeadRules(updatedRules);
      localStorage.setItem('rivor-lead-rules', JSON.stringify(updatedRules));
      
      setShowAddRuleModal(false);
      console.log('Added new lead rule:', newRule);
    } catch (error) {
      console.error('Error adding rule:', error);
    }
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<LeadRule>) => {
    try {
      const updatedRules = leadRules.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates, updatedAt: new Date().toISOString() } : rule
      );
      setLocalLeadRules(updatedRules);
      localStorage.setItem('rivor-lead-rules', JSON.stringify(updatedRules));
      setEditingRule(null);
      console.log('Updated lead rule:', ruleId, updates);
    } catch (error) {
      console.error('Error updating rule:', error);
      setEditingRule(null);
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    try {
      const updatedRules = leadRules.filter(rule => rule.id !== ruleId);
      setLocalLeadRules(updatedRules);
      localStorage.setItem('rivor-lead-rules', JSON.stringify(updatedRules));
      console.log('Deleted lead rule:', ruleId);
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const handleNotificationToggle = (notificationId: string, field: keyof NotificationSetting['channels'] | 'enabled', value: boolean) => {
    try {
      const updatedNotifications = notifications.map(notification => {
        if (notification.id !== notificationId) return notification;
        
        if (field === 'enabled') {
          return { ...notification, enabled: value };
        } else {
          return { 
            ...notification, 
            channels: { ...notification.channels, [field]: value }
          };
        }
      });
      
      // Update local state and localStorage immediately
      setLocalNotifications(updatedNotifications);
      localStorage.setItem('rivor-notifications', JSON.stringify(updatedNotifications));
      
      console.log(`Updated notification ${notificationId} ${field} to ${value}`);
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const handleAppearanceUpdate = (updates: Partial<AppearanceSetting>) => {
    try {
      const updatedAppearance = { ...appearance, ...updates };
      
      // Update local state and localStorage immediately
      setLocalAppearance(updatedAppearance);
      localStorage.setItem('rivor-appearance', JSON.stringify(updatedAppearance));
      
      console.log('Updated appearance settings:', updates);
    } catch (error) {
      console.error('Error updating appearance:', error);
    }
  };

  const handleIntegrationReauth = async (integrationId: string) => {
    // This would trigger reauthorization
    console.log('Reauthorizing integration:', integrationId);
  };

  const handleIntegrationFix = async (integrationId: string) => {
    // This would attempt to fix the integration
    console.log('Fixing integration:', integrationId);
  };

  const handleRestartOnboarding = () => {
    try {
      // Clear onboarding completion status
      localStorage.removeItem('rivor-onboarding-completed');
      localStorage.removeItem('rivor-onboarding-completed-date');
      localStorage.removeItem('rivor-onboarding-skipped-date');
      
      // Refresh the page to trigger onboarding
      window.location.reload();
    } catch (error) {
      console.error('Failed to restart onboarding:', error);
      alert('Failed to restart tour. Please refresh the page manually.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <X className="h-4 w-4" />;
    }
  };

  // Only show loading if still loading and no errors occurred
  const isInitialLoading = (leadRulesLoading && !leadRulesError) || 
                          (notificationsLoading && !notificationsError) || 
                          (appearanceLoading && !appearanceError);
  
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your account, lead rules, integrations, and preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="lead-rules" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Lead Rules</span>
              <span className="sm:hidden">Rules</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Globe className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Integrations</span>
              <span className="sm:hidden">Apps</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Bell className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Palette className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Appearance</span>
              <span className="sm:hidden">Theme</span>
            </TabsTrigger>
          </TabsList>

          {/* Lead Rules Tab */}
          <TabsContent value="lead-rules" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Lead Rules
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Automatically categorize and route incoming leads
                </p>
              </div>
              <Button onClick={() => setShowAddRuleModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>

            <div className="grid gap-4">
              {leadRules.map((rule) => (
                <GlassCard key={rule.id} variant="gradient" intensity="medium">
                  <GlassCardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-slate-900 dark:text-slate-100">
                            {rule.name}
                          </h3>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'} className="text-xs">
                            {rule.enabled ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Priority {rule.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {rule.description}
                        </p>
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Conditions:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {rule.conditions.map((condition, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {condition.field} {condition.operator} {condition.value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRule(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              ))}
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Integrations
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your connected services and data sources
              </p>
            </div>

            <div className="grid gap-4">
              {integrations.map((integration) => (
                <GlassCard key={integration.id} variant="gradient" intensity="medium">
                  <GlassCardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{integration.icon}</div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-100">
                            {integration.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusColor(integration.status)}`}
                            >
                              {getStatusIcon(integration.status)}
                              <span className="ml-1 capitalize">{integration.status}</span>
                            </Badge>
                            <span className="text-xs text-slate-500">
                              Last sync: {integration.lastSync}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {integration.status === 'error' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleIntegrationFix(integration.id)}
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Fix
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleIntegrationReauth(integration.id)}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Reauth
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              ))}
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Notifications
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Configure how and when you receive notifications
              </p>
            </div>

            <div className="grid gap-4">
              {notifications.map((notification) => (
                <GlassCard key={notification.id} variant="gradient" intensity="medium">
                  <GlassCardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">
                          {notification.type}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Frequency: {notification.frequency}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Email</span>
                          <Switch
                            checked={notification.channels.email}
                            onCheckedChange={(checked) => 
                              handleNotificationToggle(notification.id, 'email', checked)
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Push</span>
                          <Switch
                            checked={notification.channels.push}
                            onCheckedChange={(checked) => 
                              handleNotificationToggle(notification.id, 'push', checked)
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">In-App</span>
                          <Switch
                            checked={notification.channels.inApp}
                            onCheckedChange={(checked) => 
                              handleNotificationToggle(notification.id, 'inApp', checked)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              ))}
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Appearance & Themes
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Customize your workspace appearance and preferences
              </p>
            </div>

            <div className="grid gap-6">
              {/* Theme Selection */}
              <GlassCard variant="gradient" intensity="medium">
                <GlassCardHeader>
                  <GlassCardTitle>
                    <Palette className="h-5 w-5 mr-2" />
                    Theme Selection
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <ThemeSwitcher />
                </GlassCardContent>
              </GlassCard>

              {/* Accent Color */}
              <GlassCard variant="gradient" intensity="medium">
                <GlassCardHeader>
                  <GlassCardTitle>Accent Color</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="grid grid-cols-6 gap-2">
                    {['blue', 'green', 'purple', 'orange', 'red', 'pink'].map((color) => (
                      <Button
                        key={color}
                        variant={appearance.accentColor === color ? 'default' : 'outline'}
                        className="h-12"
                        onClick={() => handleAppearanceUpdate({ accentColor: color })}
                      >
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ 
                            backgroundColor: color === 'blue' ? '#3b82f6' :
                                           color === 'green' ? '#10b981' :
                                           color === 'purple' ? '#8b5cf6' :
                                           color === 'orange' ? '#f59e0b' :
                                           color === 'red' ? '#ef4444' : '#ec4899'
                          }}
                        />
                      </Button>
                    ))}
                  </div>
                </GlassCardContent>
              </GlassCard>

              {/* Glass Intensity */}
              <GlassCard variant="gradient" intensity="medium">
                <GlassCardHeader>
                  <GlassCardTitle>Glass Effect Intensity</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="flex items-center gap-4">
                    {(['low', 'medium', 'high'] as const).map((intensity) => (
                      <Button
                        key={intensity}
                        variant={appearance.glassIntensity === intensity ? 'default' : 'outline'}
                        onClick={() => handleAppearanceUpdate({ glassIntensity: intensity })}
                      >
                        {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                      </Button>
                    ))}
                  </div>
                </GlassCardContent>
              </GlassCard>

              {/* Accessibility */}
              <GlassCard variant="gradient" intensity="medium">
                <GlassCardHeader>
                  <GlassCardTitle>Accessibility & Animations</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          High Contrast Mode
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Increase contrast for better visibility
                        </p>
                      </div>
                      <Switch
                        checked={appearance.highContrast}
                        onCheckedChange={(checked) => 
                          handleAppearanceUpdate({ highContrast: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          Animations
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Enable smooth transitions and animations
                        </p>
                      </div>
                      <Switch
                        checked={appearance.animations}
                        onCheckedChange={(checked) => 
                          handleAppearanceUpdate({ animations: checked })
                        }
                      />
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>

              {/* Onboarding */}
              <GlassCard variant="gradient" intensity="medium">
                <GlassCardHeader>
                  <GlassCardTitle>Getting Started</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          Welcome Walkthrough
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Take the tour again to learn about Rivor's features
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleRestartOnboarding}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Restart Tour
                      </Button>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Rule Modal */}
        {showAddRuleModal && <AddRuleModal onClose={() => setShowAddRuleModal(false)} onSave={handleAddRule} />}
      </div>
    </div>
  );
}
