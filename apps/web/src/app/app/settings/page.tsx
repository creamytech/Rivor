"use client";
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
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
  Download,
  Save,
  Moon,
  Sun,
  Monitor,
  LogOut,
  User,
  Mail,
  Calendar,
  Shield,
  Bell,
  Palette,
  Activity,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/river/RiverToast';

// Profile Settings Component
function ProfileSettings() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    title: '',
    timezone: 'America/New_York',
    language: 'en'
  });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || '',
        email: session.user.email || '',
        title: '',
        timezone: 'America/New_York',
        language: 'en'
      });
    }
  }, [session]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        await update(); // Update session
        addToast({
          type: 'success',
          title: 'Profile Updated',
          description: 'Your profile has been updated successfully.'
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-600 dark:text-slate-400">
          Loading profile...
        </div>
      </div>
    );
  }

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
            {session.user.image ? (
              <img 
                src={session.user.image} 
                alt={session.user.name || 'Profile'} 
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              profile.name.split(' ').map(n => n[0]).join('') || 'U'
            )}
          </div>
          <div>
            <p className="text-sm text-slate-500">
              Profile photo from {session.user.email?.includes('@gmail.com') ? 'Google' : 'OAuth provider'}
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
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Email Address
            </label>
            <Input
              type="email"
              value={profile.email}
              disabled
              className="bg-slate-50 dark:bg-slate-800"
            />
            <p className="text-xs text-slate-500 mt-1">
              Email is managed by your OAuth provider
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Job Title
            </label>
            <Input
              value={profile.title}
              onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Sales Manager"
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
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Australia/Sydney">Sydney</option>
            </select>
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleSaveProfile}
              disabled={loading}
              className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Security Settings Component
function SecuritySettings() {
  const { data: session } = useSession();
  const { addToast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Logout failed:', error);
      addToast({
        type: 'error',
        title: 'Logout Failed',
        description: 'Please try again.'
      });
    }
  };

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
            Connected Accounts
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Your account is connected via OAuth providers.
          </p>
          <div className="space-y-2">
            {session?.user?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700 dark:text-slate-300">{session.user.email}</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Connected</span>
              </div>
            )}
          </div>
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

        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
            Sign Out
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            Sign out of your current session. You'll need to sign in again to access your account.
          </p>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
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
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications)
      });

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Preferences Saved',
          description: 'Your notification preferences have been updated.'
        });
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      addToast({
        type: 'error',
        title: 'Save Failed',
        description: 'Failed to save preferences. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

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
        <Button 
          onClick={handleSavePreferences}
          disabled={loading}
          className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}

// Appearance Settings Component
function AppearanceSettings() {
  const [theme, setTheme] = useState('system');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    setLoading(true);
    try {
      const response = await fetch('/api/user/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme })
      });

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Theme Updated',
          description: 'Your appearance preferences have been saved.'
        });
      } else {
        throw new Error('Failed to update theme');
      }
    } catch (error) {
      console.error('Failed to update theme:', error);
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: 'Failed to update theme. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

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
                onClick={() => handleThemeChange(option.id)}
                disabled={loading}
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
  const { addToast } = useToast();

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/user/export', {
        method: 'POST'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rivor-data-export.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        addToast({
          type: 'success',
          title: 'Export Started',
          description: 'Your data export has been downloaded.'
        });
      } else {
        throw new Error('Failed to export data');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      addToast({
        type: 'error',
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.'
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE'
      });

      if (response.ok) {
        await signOut({ callbackUrl: '/' });
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      addToast({
        type: 'error',
        title: 'Delete Failed',
        description: 'Failed to delete account. Please try again.'
      });
    }
  };

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
          <Button variant="outline" onClick={handleExportData}>
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
          <Button 
            variant="outline" 
            onClick={handleDeleteAccount}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { data: session, status } = useSession();

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

  if (status === 'loading') {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <FlowRibbon />
        <AppShell>
          <div className="container py-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
              <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </AppShell>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <FlowRibbon />
        <AppShell>
          <div className="container py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Authentication Required
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Please sign in to access your settings.
              </p>
            </div>
          </div>
        </AppShell>
      </div>
    );
  }

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