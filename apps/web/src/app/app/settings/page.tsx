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
        // Show success message
        console.log('Profile updated successfully');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
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
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
            Profile Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <Input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={profile.email}
                disabled
                className="w-full bg-slate-50 dark:bg-slate-800"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Email cannot be changed
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Job Title
              </label>
              <Input
                type="text"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                placeholder="Enter your job title"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Timezone
              </label>
              <select
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            onClick={handleSaveProfile}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Security Settings Component
function SecuritySettings() {
  const { data: session } = useSession();

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  if (!session?.user) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-600 dark:text-slate-400">
          Loading security settings...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
            Connected Accounts
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {session.user.name || session.user.email}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
            Sign Out
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Sign out of your account. You will need to sign in again to access your data.
          </p>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950/30"
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
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: false,
    marketingEmails: false
  });
  const [loading, setLoading] = useState(false);

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        console.log('Notification preferences updated successfully');
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
            Notification Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Email Notifications</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Receive notifications via email</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Push Notifications</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Receive push notifications in browser</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.pushNotifications}
                onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Weekly Digest</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Receive weekly summary emails</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.weeklyDigest}
                onChange={(e) => setPreferences({ ...preferences, weeklyDigest: e.target.checked })}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Marketing Emails</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Receive product updates and announcements</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.marketingEmails}
                onChange={(e) => setPreferences({ ...preferences, marketingEmails: e.target.checked })}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            onClick={handleSavePreferences}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Appearance Settings Component
function AppearanceSettings() {
  const [theme, setTheme] = useState('system');
  const [loading, setLoading] = useState(false);

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
        console.log('Theme updated successfully');
      } else {
        throw new Error('Failed to update theme');
      }
    } catch (error) {
      console.error('Failed to update theme:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
            Theme Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleThemeChange('light')}
              className={cn(
                "p-4 border rounded-lg text-left transition-colors",
                theme === 'light'
                  ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              )}
            >
              <Sun className="h-6 w-6 text-yellow-500 mb-2" />
              <p className="font-medium text-slate-900 dark:text-slate-100">Light</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Clean and bright interface</p>
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={cn(
                "p-4 border rounded-lg text-left transition-colors",
                theme === 'dark'
                  ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              )}
            >
              <Moon className="h-6 w-6 text-blue-500 mb-2" />
              <p className="font-medium text-slate-900 dark:text-slate-100">Dark</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Easy on the eyes</p>
            </button>
            <button
              onClick={() => handleThemeChange('system')}
              className={cn(
                "p-4 border rounded-lg text-left transition-colors",
                theme === 'system'
                  ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              )}
            >
              <Monitor className="h-6 w-6 text-slate-500 mb-2" />
              <p className="font-medium text-slate-900 dark:text-slate-100">System</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Follows your system preference</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Data & Privacy Settings Component
function DataPrivacySettings() {
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
      } else {
        throw new Error('Failed to export data');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const response = await fetch('/api/user/delete', {
          method: 'DELETE'
        });

        if (response.ok) {
          signOut({ callbackUrl: '/' });
        } else {
          throw new Error('Failed to delete account');
        }
      } catch (error) {
        console.error('Failed to delete account:', error);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
            Data Export
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Download a copy of all your data including emails, contacts, and settings.
          </p>
          <Button
            onClick={handleExportData}
            variant="outline"
            className="bg-white dark:bg-slate-800"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
        
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
            Delete Account
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button
            onClick={handleDeleteAccount}
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main Settings Page Component
export default function SettingsPage() {
  return (
    <ToastProvider>
      <SettingsPageContent />
    </ToastProvider>
  );
}

function SettingsPageContent() {
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
  );
}