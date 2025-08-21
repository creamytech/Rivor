"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '@/components/app/AppShell';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Settings,
  User,
  Mail,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Key,
  Webhook,
  CreditCard,
  Users,
  Building,
  Phone,
  MapPin,
  Clock,
  Moon,
  Sun,
  Monitor,
  Check,
  X,
  AlertTriangle,
  Info,
  Save,
  RefreshCw,
  Upload,
  Download,
  Trash2,
  Edit,
  Plus,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface UserSettings {
  profile: {
    name: string;
    email: string;
    company: string;
    phone: string;
    timezone: string;
    language: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    leadAlerts: boolean;
    taskReminders: boolean;
    weeklyReports: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    compactMode: boolean;
    animations: boolean;
  };
  integrations: {
    googleCalendar: boolean;
    docusign: boolean;
    zoom: boolean;
    slack: boolean;
  };
  privacy: {
    dataSharing: boolean;
    analytics: boolean;
    marketingEmails: boolean;
    twoFactorAuth: boolean;
  };
}

export default function SettingsPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const sections: SettingsSection[] = [
    {
      id: 'profile',
      title: 'Profile',
      description: 'Personal information and account details',
      icon: <User className="h-5 w-5" />,
      color: 'blue'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Alert preferences and communication settings',
      icon: <Bell className="h-5 w-5" />,
      color: 'orange'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Theme, colors, and display preferences',
      icon: <Palette className="h-5 w-5" />,
      color: 'purple'
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Connected apps and external services',
      icon: <Webhook className="h-5 w-5" />,
      color: 'green'
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Data protection and security settings',
      icon: <Shield className="h-5 w-5" />,
      color: 'red'
    }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockSettings: UserSettings = {
        profile: {
          name: 'John Smith',
          email: 'john.smith@realtygroup.com',
          company: 'Premier Realty Group',
          phone: '+1 (555) 123-4567',
          timezone: 'America/New_York',
          language: 'en-US'
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          leadAlerts: true,
          taskReminders: true,
          weeklyReports: false
        },
        appearance: {
          theme: 'system',
          accentColor: 'blue',
          compactMode: false,
          animations: true
        },
        integrations: {
          googleCalendar: true,
          docusign: false,
          zoom: true,
          slack: false
        },
        privacy: {
          dataSharing: false,
          analytics: true,
          marketingEmails: false,
          twoFactorAuth: true
        }
      };

      setTimeout(() => {
        setSettings(mockSettings);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof UserSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value
      }
    }));
  };

  const resetSettings = () => {
    setShowResetModal(false);
    fetchSettings();
  };

  if (loading) {
    return (
      <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
        <AppShell>
          <div className="flex items-center justify-center min-h-screen">
            <div className="glass-spinner-large"></div>
          </div>
        </AppShell>
      </div>
    );
  }

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        <div className="px-4 mt-4 mb-2 main-content-area">
          {/* Liquid Glass Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card glass-border-active mb-6"
            style={{ 
              backgroundColor: 'var(--glass-surface)', 
              color: 'var(--glass-text)',
              backdropFilter: 'var(--glass-blur)'
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="glass-icon-container">
                    <Settings className="h-6 w-6" style={{ color: 'var(--glass-primary)' }} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold glass-text-gradient">Settings</h1>
                    <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                      Manage your account and application preferences
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="glass-button-secondary"
                    onClick={() => setShowResetModal(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button 
                    variant="liquid"
                    size="lg"
                    className="glass-hover-glow"
                    onClick={saveSettings}
                    disabled={saving}
                  >
                    <Save className={`h-5 w-5 mr-2 ${saving ? 'animate-spin' : ''}`} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>

              {/* Settings Navigation */}
              <div className="glass-pill-container">
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    variant={activeTab === section.id ? 'liquid' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(section.id)}
                    className="glass-pill-button"
                  >
                    {section.icon}
                    <span className="ml-2">{section.title}</span>
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-12 gap-6">
            {/* Settings Sidebar */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="col-span-3"
            >
              <div className="glass-card glass-border mb-6"
                   style={{ backgroundColor: 'var(--glass-surface)' }}>
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-4 glass-text-gradient">Categories</h2>
                  <div className="space-y-2">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveTab(section.id)}
                        className={cn(
                          'w-full flex items-start gap-3 p-3 rounded-lg transition-all duration-200 text-left',
                          'glass-button-hover',
                          activeTab === section.id 
                            ? 'glass-button-active' 
                            : 'glass-button-secondary'
                        )}
                      >
                        <div className={`glass-icon-container-small text-${section.color}-500`}>
                          {section.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">{section.title}</h3>
                          <p className="text-xs mt-1" style={{ color: 'var(--glass-text-muted)' }}>
                            {section.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="glass-card glass-border"
                   style={{ backgroundColor: 'var(--glass-surface-subtle)' }}>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="glass-icon-container-small">
                      <Sparkles className="h-4 w-4" style={{ color: 'var(--glass-accent)' }} />
                    </div>
                    <span className="text-sm font-semibold glass-text-gradient">
                      Quick Setup
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="glass-suggestion-pill">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span>Complete profile setup</span>
                    </div>
                    <div className="glass-suggestion-pill">
                      <Zap className="h-4 w-4 text-green-500" />
                      <span>Connect integrations</span>
                    </div>
                    <div className="glass-suggestion-pill">
                      <Shield className="h-4 w-4 text-red-500" />
                      <span>Enable 2FA security</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Main Settings Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="col-span-9"
            >
              <div className="glass-card glass-border-active"
                   style={{ backgroundColor: 'var(--glass-surface)' }}>
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {/* Profile Settings */}
                    {activeTab === 'profile' && (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="glass-icon-container-small text-blue-500">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold glass-text-gradient">Profile Settings</h2>
                            <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                              Manage your personal information and account details
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                              Full Name
                            </label>
                            <Input
                              value={settings?.profile.name || ''}
                              onChange={(e) => updateSetting('profile', 'name', e.target.value)}
                              className="mt-2 glass-input"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                              Email Address
                            </label>
                            <Input
                              type="email"
                              value={settings?.profile.email || ''}
                              onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                              className="mt-2 glass-input"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                              Company
                            </label>
                            <Input
                              value={settings?.profile.company || ''}
                              onChange={(e) => updateSetting('profile', 'company', e.target.value)}
                              className="mt-2 glass-input"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                              Phone Number
                            </label>
                            <Input
                              value={settings?.profile.phone || ''}
                              onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
                              className="mt-2 glass-input"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                              Timezone
                            </label>
                            <Select 
                              value={settings?.profile.timezone} 
                              onValueChange={(value) => updateSetting('profile', 'timezone', value)}
                            >
                              <SelectTrigger className="mt-2 glass-input">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="glass-dropdown">
                                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                <SelectItem value="America/Chicago">Central Time</SelectItem>
                                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                              Language
                            </label>
                            <Select 
                              value={settings?.profile.language} 
                              onValueChange={(value) => updateSetting('profile', 'language', value)}
                            >
                              <SelectTrigger className="mt-2 glass-input">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="glass-dropdown">
                                <SelectItem value="en-US">English (US)</SelectItem>
                                <SelectItem value="es-ES">Español</SelectItem>
                                <SelectItem value="fr-FR">Français</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Notifications Settings */}
                    {activeTab === 'notifications' && (
                      <motion.div
                        key="notifications"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="glass-icon-container-small text-orange-500">
                            <Bell className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold glass-text-gradient">Notification Settings</h2>
                            <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                              Control how and when you receive notifications
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {[
                            { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                            { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser and mobile push notifications' },
                            { key: 'leadAlerts', label: 'Lead Alerts', description: 'Instant alerts for new leads' },
                            { key: 'taskReminders', label: 'Task Reminders', description: 'Reminders for upcoming tasks' },
                            { key: 'weeklyReports', label: 'Weekly Reports', description: 'Weekly performance summary emails' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-white/30 dark:bg-black/20">
                              <div>
                                <h3 className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                                  {item.label}
                                </h3>
                                <p className="text-xs mt-1" style={{ color: 'var(--glass-text-muted)' }}>
                                  {item.description}
                                </p>
                              </div>
                              <Switch
                                checked={settings?.notifications[item.key as keyof typeof settings.notifications] || false}
                                onCheckedChange={(checked) => updateSetting('notifications', item.key, checked)}
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Appearance Settings */}
                    {activeTab === 'appearance' && (
                      <motion.div
                        key="appearance"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="glass-icon-container-small text-purple-500">
                            <Palette className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold glass-text-gradient">Appearance Settings</h2>
                            <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                              Customize the look and feel of your interface
                            </p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {/* Theme Selection */}
                          <div>
                            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--glass-text)' }}>
                              Theme Mode
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
                                { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
                                { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> }
                              ].map((themeOption) => (
                                <button
                                  key={themeOption.value}
                                  onClick={() => updateSetting('appearance', 'theme', themeOption.value)}
                                  className={cn(
                                    'flex items-center gap-2 p-3 rounded-lg border-2 transition-all',
                                    settings?.appearance.theme === themeOption.value
                                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                  )}
                                >
                                  {themeOption.icon}
                                  <span className="text-sm font-medium">{themeOption.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Other Appearance Options */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-white/30 dark:bg-black/20">
                              <div>
                                <h3 className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                                  Compact Mode
                                </h3>
                                <p className="text-xs mt-1" style={{ color: 'var(--glass-text-muted)' }}>
                                  Use smaller spacing and components
                                </p>
                              </div>
                              <Switch
                                checked={settings?.appearance.compactMode || false}
                                onCheckedChange={(checked) => updateSetting('appearance', 'compactMode', checked)}
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-white/30 dark:bg-black/20">
                              <div>
                                <h3 className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                                  Animations
                                </h3>
                                <p className="text-xs mt-1" style={{ color: 'var(--glass-text-muted)' }}>
                                  Enable smooth transitions and animations
                                </p>
                              </div>
                              <Switch
                                checked={settings?.appearance.animations || false}
                                onCheckedChange={(checked) => updateSetting('appearance', 'animations', checked)}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Integrations Settings */}
                    {activeTab === 'integrations' && (
                      <motion.div
                        key="integrations"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="glass-icon-container-small text-green-500">
                            <Webhook className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold glass-text-gradient">Integrations</h2>
                            <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                              Connect and manage external services
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[
                            { 
                              key: 'googleCalendar', 
                              name: 'Google Calendar', 
                              description: 'Sync events and appointments',
                              icon: <Globe className="h-5 w-5" />,
                              color: 'blue'
                            },
                            { 
                              key: 'docusign', 
                              name: 'DocuSign', 
                              description: 'Electronic signature integration',
                              icon: <Key className="h-5 w-5" />,
                              color: 'yellow'
                            },
                            { 
                              key: 'zoom', 
                              name: 'Zoom', 
                              description: 'Video conferencing integration',
                              icon: <Phone className="h-5 w-5" />,
                              color: 'purple'
                            },
                            { 
                              key: 'slack', 
                              name: 'Slack', 
                              description: 'Team communication and alerts',
                              icon: <Users className="h-5 w-5" />,
                              color: 'green'
                            }
                          ].map((integration) => (
                            <div key={integration.key} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`glass-icon-container-small text-${integration.color}-500`}>
                                    {integration.icon}
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                                      {integration.name}
                                    </h3>
                                    <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                                      {integration.description}
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  checked={settings?.integrations[integration.key as keyof typeof settings.integrations] || false}
                                  onCheckedChange={(checked) => updateSetting('integrations', integration.key, checked)}
                                />
                              </div>
                              
                              {settings?.integrations[integration.key as keyof typeof settings.integrations] && (
                                <div className="flex items-center gap-2 text-xs text-green-600">
                                  <Check className="h-3 w-3" />
                                  Connected
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Privacy & Security Settings */}
                    {activeTab === 'privacy' && (
                      <motion.div
                        key="privacy"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="glass-icon-container-small text-red-500">
                            <Shield className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold glass-text-gradient">Privacy & Security</h2>
                            <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                              Control your data privacy and account security
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {[
                            { 
                              key: 'twoFactorAuth', 
                              label: 'Two-Factor Authentication', 
                              description: 'Add an extra layer of security to your account',
                              type: 'security'
                            },
                            { 
                              key: 'dataSharing', 
                              label: 'Data Sharing', 
                              description: 'Allow anonymous usage data to improve the product',
                              type: 'privacy'
                            },
                            { 
                              key: 'analytics', 
                              label: 'Analytics Tracking', 
                              description: 'Help us improve by sharing usage analytics',
                              type: 'privacy'
                            },
                            { 
                              key: 'marketingEmails', 
                              label: 'Marketing Emails', 
                              description: 'Receive product updates and marketing communications',
                              type: 'privacy'
                            }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-white/30 dark:bg-black/20">
                              <div className="flex items-start gap-3">
                                {item.type === 'security' ? (
                                  <Shield className="h-4 w-4 text-red-500 mt-1" />
                                ) : (
                                  <Info className="h-4 w-4 text-blue-500 mt-1" />
                                )}
                                <div>
                                  <h3 className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                                    {item.label}
                                  </h3>
                                  <p className="text-xs mt-1" style={{ color: 'var(--glass-text-muted)' }}>
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={settings?.privacy[item.key as keyof typeof settings.privacy] || false}
                                onCheckedChange={(checked) => updateSetting('privacy', item.key, checked)}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Danger Zone */}
                        <div className="mt-8 p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                          <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                            <div>
                              <h3 className="text-sm font-medium text-red-700 dark:text-red-300">
                                Danger Zone
                              </h3>
                              <p className="text-xs mt-1 text-red-600 dark:text-red-400">
                                These actions cannot be undone
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                              <Download className="h-4 w-4 mr-2" />
                              Export Data
                            </Button>
                            <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </AppShell>

      {/* Reset Settings Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-orange-500" />
              Reset Settings
            </DialogTitle>
            <DialogDescription>
              This will reset all settings to their default values. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={resetSettings}>
              Reset All Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}