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
  Sun
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

export default function EnhancedSettings({ className = '' }: EnhancedSettingsProps) {
  const { currentTheme, themeId } = useTheme();
  const [activeTab, setActiveTab] = useState('lead-rules');
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<LeadRule | null>(null);

  // Fetch real data from tRPC
  const { data: leadRulesData, isLoading: leadRulesLoading, refetch: refetchLeadRules } = trpc.settings.getLeadRules.useQuery();
  const { data: notificationsData, isLoading: notificationsLoading, refetch: refetchNotifications } = trpc.settings.getNotifications.useQuery();
  const { data: appearanceData, isLoading: appearanceLoading, refetch: refetchAppearance } = trpc.settings.getAppearance.useQuery();

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

  const leadRules = leadRulesData || [];
  const notifications = notificationsData || [];
  const appearance = appearanceData || {
    theme: 'system',
    accentColor: 'blue',
    glassIntensity: 'medium',
    highContrast: false,
    animations: true
  };

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

  const handleAddRule = async (ruleData: Partial<LeadRule>) => {
    try {
      await updateLeadRulesMutation.mutateAsync({
        rules: [...leadRules, { ...ruleData, id: `rule_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as LeadRule]
      });
      setShowAddRuleModal(false);
    } catch (error) {
      console.error('Error adding rule:', error);
    }
  };

  const handleUpdateRule = async (ruleId: string, updates: Partial<LeadRule>) => {
    try {
      const updatedRules = leadRules.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates, updatedAt: new Date().toISOString() } : rule
      );
      await updateLeadRulesMutation.mutateAsync({ rules: updatedRules });
      setEditingRule(null);
    } catch (error) {
      console.error('Error updating rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const updatedRules = leadRules.filter(rule => rule.id !== ruleId);
      await updateLeadRulesMutation.mutateAsync({ rules: updatedRules });
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const handleNotificationToggle = async (notificationId: string, enabled: boolean) => {
    try {
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId ? { ...notification, enabled } : notification
      );
      await updateNotificationsMutation.mutateAsync({ notifications: updatedNotifications });
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const handleAppearanceUpdate = async (updates: Partial<AppearanceSetting>) => {
    try {
      await updateAppearanceMutation.mutateAsync({ ...appearance, ...updates });
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

  if (leadRulesLoading || notificationsLoading || appearanceLoading) {
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
                              handleNotificationToggle(notification.id, checked)
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Push</span>
                          <Switch
                            checked={notification.channels.push}
                            onCheckedChange={(checked) => 
                              handleNotificationToggle(notification.id, checked)
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">In-App</span>
                          <Switch
                            checked={notification.channels.inApp}
                            onCheckedChange={(checked) => 
                              handleNotificationToggle(notification.id, checked)
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
              <h2 
                className="text-xl font-semibold mb-2"
                style={{ color: currentTheme.colors.textPrimary }}
              >
                Appearance & Themes
              </h2>
              <p style={{ color: currentTheme.colors.textSecondary }}>
                Personalize your Rivor workspace with beautiful river-inspired themes
              </p>
            </div>

            <div className="grid gap-6">
              {/* River Theme Selection */}
              <GlassCard 
                variant="gradient" 
                intensity="medium"
                style={{
                  background: currentTheme.colors.glassBg,
                  border: `1px solid ${currentTheme.colors.border}`,
                  backdropFilter: currentTheme.colors.glassBlur,
                }}
              >
                <GlassCardHeader>
                  <GlassCardTitle style={{ color: currentTheme.colors.textPrimary }}>
                    <Palette className="h-5 w-5 mr-2" style={{ color: currentTheme.colors.primary }} />
                    River Theme Selection
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{
                          background: currentTheme.colors.primaryMuted,
                          border: `1px solid ${currentTheme.colors.primary}`,
                        }}
                      >
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ background: currentTheme.colors.gradient }}
                        />
                        <span 
                          className="text-sm font-medium"
                          style={{ color: currentTheme.colors.primary }}
                        >
                          Current: {currentTheme.name}
                        </span>
                      </div>
                    </div>
                    
                    {/* Full Theme Switcher */}
                    <ThemeSwitcher />
                  </div>
                </GlassCardContent>
              </GlassCard>

              {/* Theme Information */}
              <GlassCard 
                variant="gradient" 
                intensity="medium"
                style={{
                  background: currentTheme.colors.glassBg,
                  border: `1px solid ${currentTheme.colors.border}`,
                  backdropFilter: currentTheme.colors.glassBlur,
                }}
              >
                <GlassCardHeader>
                  <GlassCardTitle style={{ color: currentTheme.colors.textPrimary }}>
                    <Activity className="h-5 w-5 mr-2" style={{ color: currentTheme.colors.secondary }} />
                    Current Theme Details
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 
                        className="font-semibold mb-2"
                        style={{ color: currentTheme.colors.textPrimary }}
                      >
                        {currentTheme.name} Theme
                      </h4>
                      <p 
                        className="text-sm mb-3"
                        style={{ color: currentTheme.colors.textSecondary }}
                      >
                        {currentTheme.description}
                      </p>
                      <p 
                        className="text-xs italic"
                        style={{ color: currentTheme.colors.textMuted }}
                      >
                        {currentTheme.personality}
                      </p>
                    </div>
                    
                    {/* Color Palette Display */}
                    <div>
                      <h5 
                        className="text-sm font-medium mb-2"
                        style={{ color: currentTheme.colors.textSecondary }}
                      >
                        Color Palette
                      </h5>
                      <div className="flex gap-2">
                        <div 
                          className="w-8 h-8 rounded-lg border"
                          style={{ 
                            backgroundColor: currentTheme.colors.primary,
                            borderColor: currentTheme.colors.border 
                          }}
                          title="Primary Color"
                        />
                        <div 
                          className="w-8 h-8 rounded-lg border"
                          style={{ 
                            backgroundColor: currentTheme.colors.secondary,
                            borderColor: currentTheme.colors.border 
                          }}
                          title="Secondary Color"
                        />
                        <div 
                          className="w-8 h-8 rounded-lg border"
                          style={{ 
                            backgroundColor: currentTheme.colors.accent,
                            borderColor: currentTheme.colors.border 
                          }}
                          title="Accent Color"
                        />
                        <div 
                          className="w-8 h-8 rounded-lg border"
                          style={{ 
                            background: currentTheme.colors.gradient,
                            borderColor: currentTheme.colors.border 
                          }}
                          title="Gradient"
                        />
                      </div>
                    </div>
                  </div>
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
                        <div className={`w-4 h-4 rounded-full bg-${color}-500`}></div>
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
                  <GlassCardTitle>Accessibility</GlassCardTitle>
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
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Rule Modal */}
        {showAddRuleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <GlassCard className="w-full max-w-md">
              <GlassCardHeader>
                <GlassCardTitle>Add Lead Rule</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Rule Name
                    </label>
                    <Input
                      placeholder="Enter rule name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Description
                    </label>
                    <Input
                      placeholder="Enter rule description"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 pt-4">
                    <Button className="flex-1">
                      Create Rule
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddRuleModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
