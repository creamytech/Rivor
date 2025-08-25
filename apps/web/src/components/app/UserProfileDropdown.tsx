"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Shield,
  CreditCard,
  HelpCircle,
  Moon,
  Sun,
  Monitor,
  Bell,
  Zap
} from 'lucide-react';

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileDropdown({ isOpen, onClose }: UserProfileDropdownProps) {
  const { data: session } = useSession();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    return session.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const menuItems = [
    {
      id: 'profile',
      label: 'Profile',
      description: 'View and edit your profile',
      icon: <User className="h-4 w-4" />,
      action: () => window.location.href = '/app/settings/profile'
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Account and app preferences',
      icon: <Settings className="h-4 w-4" />,
      action: () => window.location.href = '/app/settings'
    },
    {
      id: 'integrations',
      label: 'Integrations',
      description: 'Manage connected accounts',
      icon: <Zap className="h-4 w-4" />,
      action: () => window.location.href = '/app/settings/integrations'
    },
    {
      id: 'billing',
      label: 'Billing',
      description: 'Subscription and payment',
      icon: <CreditCard className="h-4 w-4" />,
      action: () => window.location.href = '/app/settings/billing'
    },
    {
      id: 'security',
      label: 'Security',
      description: 'Password and 2FA settings',
      icon: <Shield className="h-4 w-4" />,
      action: () => window.location.href = '/app/settings/security'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Manage notification preferences',
      icon: <Bell className="h-4 w-4" />,
      action: () => window.location.href = '/app/settings/notifications'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          ref={dropdownRef}
          className="absolute top-full right-0 mt-2 w-80 rounded-lg shadow-2xl overflow-hidden z-50"
          style={{
            background: 'var(--glass-surface)',
            backdropFilter: 'blur(20px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* User Info Header */}
          <div 
            className="p-4 border-b"
            style={{
              borderColor: 'var(--glass-border)',
              background: 'var(--glass-surface-subtle)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)'
            }}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate" style={{ color: 'var(--glass-text)' }}>
                  {session?.user?.name || 'User'}
                </h3>
                <p className="text-sm truncate" style={{ color: 'var(--glass-text-muted)' }}>
                  {session?.user?.email || 'user@example.com'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    Pro Plan
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{
                  background: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--glass-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ color: 'var(--glass-text-muted)' }}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>
                    {item.label}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <div 
            className="px-4 py-3 border-t"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                Theme
              </span>
              <div 
                className="flex items-center gap-1 rounded-lg p-1"
                style={{ background: 'var(--glass-surface-subtle)' }}
              >
                {[
                  { key: 'light', icon: <Sun className="h-4 w-4" />, label: 'Light' },
                  { key: 'dark', icon: <Moon className="h-4 w-4" />, label: 'Dark' },
                  { key: 'system', icon: <Monitor className="h-4 w-4" />, label: 'System' }
                ].map(({ key, icon, label }) => (
                  <button
                    key={key}
                    className="px-2 py-1 rounded-md text-xs font-medium transition-colors"
                    style={{ color: 'var(--glass-text-muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--glass-surface-hover)';
                      e.currentTarget.style.color = 'var(--glass-text)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--glass-text-muted)';
                    }}
                    title={label}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div 
            className="p-4 border-t"
            style={{
              borderColor: 'var(--glass-border)',
              background: 'var(--glass-surface-subtle)'
            }}
          >
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/app/help'}
                className="flex-1"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSignOut}
                className="flex-1"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
