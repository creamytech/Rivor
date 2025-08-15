"use client";
import { useState } from 'react';
import FlowCard from '@/components/river/FlowCard';
import RiverTabs from '@/components/river/RiverTabs';
import { 
  User, 
  Building2, 
  Link, 
  Shield, 
  Bell, 
  Palette, 
  Download,
  Trash2,
  Activity
} from 'lucide-react';

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}

interface SettingsLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: SettingsTab[];
}

export default function SettingsLayout({ 
  children, 
  activeTab, 
  onTabChange, 
  tabs 
}: SettingsLayoutProps) {
  return (
    <FlowCard className="min-h-[600px]">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Settings
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage your account and organization
            </p>
          </div>
          
          <nav className="p-4">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.icon}
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </FlowCard>
  );
}

// Export all the tab configurations for easy use
export const settingsTabs: SettingsTab[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="h-4 w-4" />,
    component: () => null // Will be defined in the main settings page
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: <Building2 className="h-4 w-4" />,
    component: () => null
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: <Link className="h-4 w-4" />,
    component: () => null
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield className="h-4 w-4" />,
    component: () => null
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell className="h-4 w-4" />,
    component: () => null
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: <Palette className="h-4 w-4" />,
    component: () => null
  },
  {
    id: 'audit',
    label: 'Audit Log',
    icon: <Activity className="h-4 w-4" />,
    component: () => null
  },
  {
    id: 'data',
    label: 'Data & Privacy',
    icon: <Download className="h-4 w-4" />,
    component: () => null
  }
];
