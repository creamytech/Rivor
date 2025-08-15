"use client";
import { useState } from 'react';
import AppShell from '@/components/app/AppShell';
import SettingsLayout, { settingsTabs } from '@/components/settings/SettingsLayout';
import IntegrationsSettings from '@/components/settings/IntegrationsSettings';
import OrganizationSettings from '@/components/settings/OrganizationSettings';
import AuditLogSettings from '@/components/settings/AuditLogSettings';
import FlowRibbon from '@/components/river/FlowRibbon';
import { ToastProvider } from '@/components/river/RiverToast';
import TokenErrorBanner from '@/components/common/TokenErrorBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, 
  Building2, 
  Shield, 
  Bell, 
  Palette, 
  Download,
  Save,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Profile Settings Component
function ProfileSettings() {
  const [profile, setProfile] = useState({
    name: 'John Smith',
    email: 'john@company.com',
    title: 'Sales Manager',
    timezone: 'America/New_York',
    language: 'en'
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Profile Settings
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Update your personal information and preferences.
        </p>
      </div>

      <div className="max-w-lg space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-azure-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
            {profile.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <Button variant="outline" size="sm">
              Change Photo
            </Button>
            <p className="text-xs text-slate-500 mt-1">
              JPG, PNG or GIF. Max size of 2MB.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Full Name
            </label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Email Address
            </label>
            <Input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Job Title
            </label>
            <Input
              value={profile.title}
              onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Timezone
            </label>
            <select
              value={profile.timezone}
              onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
              className={cn(
                "w-full rounded-md border border-slate-300 dark:border-slate-600",
                "bg-white dark:bg-slate-800 px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              )}
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
            </select>
          </div>

          <div className="pt-4">
            <Button className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Security Settings Component
function SecuritySettings() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Security Settings
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage your account security and authentication methods.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
            Password
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Change your password to keep your account secure.
          </p>
          <Button variant="outline">
            Change Password
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
            Two-Factor Authentication
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Add an extra layer of security to your account.
          </p>
          <Button className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white">
            Enable 2FA
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
            Active Sessions
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Manage devices that are currently signed in to your account.
          </p>
          <Button variant="outline">
            View Sessions
          </Button>
        </div>
      </div>
    </div>
  );
}

// Notifications Settings Component
function NotificationsSettings() {
  const [notifications, setNotifications] = useState({
    emailDigest: true,
    newLeads: true,
    taskReminders: true,
    meetingReminders: true,
    systemUpdates: false,
    marketingEmails: false
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Notification Preferences
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choose what notifications you want to receive.
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(notifications).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Get notified about this activity
              </p>
            </div>
            <Button
              variant={value ? "default" : "outline"}
              size="sm"
              onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
            >
              {value ? "On" : "Off"}
            </Button>
          </div>
        ))}
      </div>

      <div className="pt-6">
        <Button className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white">
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

// Appearance Settings Component
function AppearanceSettings() {
  const [theme, setTheme] = useState('system');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Appearance
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Customize the look and feel of your Rivor experience.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
            Theme
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
              { id: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
              { id: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setTheme(option.id)}
                className={cn(
                  'p-3 rounded-lg border-2 transition-colors text-center',
                  theme === option.id
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                <div className="flex flex-col items-center gap-2">
                  {option.icon}
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
            Motion Preferences
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Animations</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Enable smooth transitions and animations</div>
              </div>
              <Button variant="default" size="sm">
                On
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Data & Privacy Settings Component
function DataPrivacySettings() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Data & Privacy
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Control your data and privacy settings.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
            Export Your Data
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Download a copy of all your data stored in Rivor.
          </p>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Request Export
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
            Data Retention
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Control how long your data is stored in Rivor.
          </p>
          <select className={cn(
            "rounded-md border border-slate-300 dark:border-slate-600",
            "bg-white dark:bg-slate-800 px-3 py-2 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          )}>
            <option value="1year">1 Year</option>
            <option value="2years">2 Years</option>
            <option value="3years">3 Years</option>
            <option value="indefinite">Indefinite</option>
          </select>
        </div>

        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
            Delete Account
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'organization':
        return <OrganizationSettings />;
      case 'integrations':
        return <IntegrationsSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationsSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'audit':
        return <AuditLogSettings />;
      case 'data':
        return <DataPrivacySettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <FlowRibbon />
        <AppShell>
          <div className="container py-6 space-y-6">
            <TokenErrorBanner />
            
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Settings
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Manage your account, organization, and application preferences.
                </p>
              </div>
              
              <SettingsLayout
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={settingsTabs}
              >
                {renderTabContent()}
              </SettingsLayout>
            </div>
          </div>
        </AppShell>
      </div>
    </ToastProvider>
  );
}