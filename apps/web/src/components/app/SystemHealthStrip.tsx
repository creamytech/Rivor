"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi,
  Database,
  Mail,
  Calendar,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  Server,
  Key,
  RefreshCw,
  Settings
} from 'lucide-react';

interface SystemStatus {
  id: string;
  name: string;
  status: 'online' | 'warning' | 'offline';
  lastSync?: Date;
  message?: string;
  icon: React.ReactNode;
}

interface SystemHealthStripProps {
  className?: string;
}

export default function SystemHealthStrip({ className = '' }: SystemHealthStripProps) {
  const [systemStatuses, setSystemStatuses] = useState<SystemStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchSystemHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSystemHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockSystemStatuses: SystemStatus[] = [
        {
          id: 'api_tokens',
          name: 'API Tokens',
          status: Math.random() > 0.1 ? 'online' : 'warning',
          message: 'All tokens valid',
          icon: <Key className="h-3 w-3" />
        },
        {
          id: 'database',
          name: 'Database',
          status: 'online',
          lastSync: new Date(Date.now() - 2 * 60 * 1000),
          message: 'Connected',
          icon: <Database className="h-3 w-3" />
        },
        {
          id: 'email_sync',
          name: 'Email Sync',
          status: Math.random() > 0.2 ? 'online' : 'warning',
          lastSync: new Date(Date.now() - 5 * 60 * 1000),
          message: 'Syncing normally',
          icon: <Mail className="h-3 w-3" />
        },
        {
          id: 'calendar_integration',
          name: 'Calendar',
          status: 'online',
          lastSync: new Date(Date.now() - 1 * 60 * 1000),
          message: 'Google Calendar connected',
          icon: <Calendar className="h-3 w-3" />
        },
        {
          id: 'zillow_integration',
          name: 'Zillow API',
          status: Math.random() > 0.15 ? 'online' : 'warning',
          lastSync: new Date(Date.now() - 10 * 60 * 1000),
          message: 'Lead sync active',
          icon: <RefreshCw className="h-3 w-3" />
        },
        {
          id: 'security',
          name: 'Security',
          status: 'online',
          message: 'All systems secure',
          icon: <Shield className="h-3 w-3" />
        }
      ];

      setSystemStatuses(mockSystemStatuses);
      setLastUpdated(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-3 w-3 text-orange-500" />;
      case 'offline': return <XCircle className="h-3 w-3 text-red-500" />;
      default: return <Clock className="h-3 w-3 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-50 text-green-700 border-green-200';
      case 'warning': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'offline': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h`;
  };

  const overallStatus = systemStatuses.some(s => s.status === 'offline') ? 'offline' : 
                      systemStatuses.some(s => s.status === 'warning') ? 'warning' : 'online';

  const onlineCount = systemStatuses.filter(s => s.status === 'online').length;
  const warningCount = systemStatuses.filter(s => s.status === 'warning').length;
  const offlineCount = systemStatuses.filter(s => s.status === 'offline').length;

  if (isLoading) {
    return (
      <Card className="border-0 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-sm">
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
              <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                ))}
              </div>
            </div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-0 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-sm backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* System Status Overview */}
            <div className="flex items-center gap-6">
              {/* Overall Health */}
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-full ${getStatusColor(overallStatus)}`}>
                  {getStatusIcon(overallStatus)}
                </div>
                <div className="text-sm">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    System Health
                  </span>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {onlineCount} online • {warningCount} warnings • {offlineCount} offline
                  </div>
                </div>
              </div>

              {/* Individual System Status */}
              <div className="flex items-center gap-2">
                {systemStatuses.map((system, index) => (
                  <motion.div
                    key={system.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                    className="relative group"
                  >
                    <Badge 
                      variant="outline" 
                      className={`text-xs h-7 px-3 ${getStatusColor(system.status)} hover:shadow-sm transition-shadow cursor-pointer`}
                    >
                      <div className="flex items-center gap-2">
                        {system.icon}
                        <span className="font-medium">{system.name}</span>
                        {getStatusIcon(system.status)}
                        {system.lastSync && (
                          <span className="text-xs opacity-70">
                            {getTimeAgo(system.lastSync)}
                          </span>
                        )}
                      </div>
                    </Badge>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {system.message}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-slate-900 dark:border-t-slate-100" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* System Actions */}
            <div className="flex items-center gap-3">
              {/* Performance Stats */}
              <div className="hidden md:flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500" />
                  <span>Fast</span>
                </div>
                <div className="flex items-center gap-1">
                  <Server className="h-3 w-3 text-blue-500" />
                  <span>99.9% uptime</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span>Updated {getTimeAgo(lastUpdated)} ago</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={fetchSystemHealth}
                  className="h-7 px-3 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 px-3 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Warning Messages */}
          {warningCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-2 text-xs">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                <span className="text-orange-600 dark:text-orange-400">
                  {warningCount} system{warningCount !== 1 ? 's' : ''} need{warningCount === 1 ? 's' : ''} attention
                </span>
                <Button variant="ghost" size="sm" className="h-5 px-2 text-xs text-orange-600 hover:text-orange-700">
                  View Details
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}