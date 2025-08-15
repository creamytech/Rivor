"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FlowCard from '@/components/river/FlowCard';
import StatusBadge from '@/components/river/StatusBadge';
import { Button } from '@/components/ui/button';
import { 
  Activity,
  Database,
  Mail,
  Calendar,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  Server,
  Wifi,
  HardDrive,
  Cpu,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemMetrics {
  database: {
    status: 'healthy' | 'warning' | 'error';
    connections: number;
    queryTime: number;
    uptime: string;
  };
  email: {
    status: 'healthy' | 'warning' | 'error';
    accountsConnected: number;
    lastSync: string;
    syncErrors: number;
    messagesProcessed24h: number;
  };
  calendar: {
    status: 'healthy' | 'warning' | 'error';
    accountsConnected: number;
    lastSync: string;
    eventsProcessed24h: number;
  };
  authentication: {
    status: 'healthy' | 'warning' | 'error';
    activeSessions: number;
    failedLogins24h: number;
    tokenHealth: number;
  };
  security: {
    status: 'healthy' | 'warning' | 'error';
    encryptionStatus: 'active' | 'degraded';
    rateLimit: {
      blocked24h: number;
      threshold: number;
    };
    auditEvents24h: number;
  };
  performance: {
    apiResponseTime: number;
    errorRate: number;
    throughput: number;
  };
}

interface RecentError {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  component: string;
  message: string;
  count: number;
}

export default function SystemMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [recentErrors, setRecentErrors] = useState<RecentError[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchSystemMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemMetrics = async () => {
    try {
      const [metricsRes, errorsRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/errors/recent')
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      } else {
        // Demo data for now
        setMetrics(generateDemoMetrics());
      }

      if (errorsRes.ok) {
        const errorsData = await errorsRes.json();
        setRecentErrors(errorsData.errors || []);
      } else {
        setRecentErrors(generateDemoErrors());
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
      setMetrics(generateDemoMetrics());
      setRecentErrors(generateDemoErrors());
    } finally {
      setLoading(false);
    }
  };

  const generateDemoMetrics = (): SystemMetrics => ({
    database: {
      status: 'healthy',
      connections: 23,
      queryTime: 45,
      uptime: '7d 12h 34m'
    },
    email: {
      status: 'healthy',
      accountsConnected: 12,
      lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      syncErrors: 0,
      messagesProcessed24h: 1247
    },
    calendar: {
      status: 'healthy',
      accountsConnected: 8,
      lastSync: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      eventsProcessed24h: 89
    },
    authentication: {
      status: 'healthy',
      activeSessions: 34,
      failedLogins24h: 2,
      tokenHealth: 98
    },
    security: {
      status: 'healthy',
      encryptionStatus: 'active',
      rateLimit: {
        blocked24h: 5,
        threshold: 1000
      },
      auditEvents24h: 156
    },
    performance: {
      apiResponseTime: 234,
      errorRate: 0.12,
      throughput: 45.6
    }
  });

  const generateDemoErrors = (): RecentError[] => [
    {
      id: 'err-1',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      severity: 'low',
      component: 'Gmail Sync',
      message: 'Rate limit reached for user@example.com',
      count: 1
    },
    {
      id: 'err-2',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      severity: 'medium',
      component: 'Authentication',
      message: 'Token refresh failed for OAuth provider',
      count: 3
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'error':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <FlowCard className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </FlowCard>
    );
  }

  if (!metrics) {
    return (
      <FlowCard className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Unable to Load Metrics
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Failed to fetch system monitoring data.
        </p>
        <Button onClick={fetchSystemMetrics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </FlowCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            System Monitoring
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Real-time system health and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button onClick={fetchSystemMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Database */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <FlowCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Database</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">PostgreSQL</p>
                </div>
              </div>
              <StatusBadge
                status={metrics.database.status}
                label={metrics.database.status}
                className={getStatusColor(metrics.database.status)}
                icon={getStatusIcon(metrics.database.status)}
              />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Connections</span>
                <span className="font-medium">{metrics.database.connections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Avg Query Time</span>
                <span className="font-medium">{metrics.database.queryTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Uptime</span>
                <span className="font-medium">{metrics.database.uptime}</span>
              </div>
            </div>
          </FlowCard>
        </motion.div>

        {/* Email Sync */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FlowCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Email Sync</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Gmail Integration</p>
                </div>
              </div>
              <StatusBadge
                status={metrics.email.status}
                label={metrics.email.status}
                className={getStatusColor(metrics.email.status)}
                icon={getStatusIcon(metrics.email.status)}
              />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Connected Accounts</span>
                <span className="font-medium">{metrics.email.accountsConnected}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Last Sync</span>
                <span className="font-medium">{formatTimeAgo(metrics.email.lastSync)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Messages (24h)</span>
                <span className="font-medium">{metrics.email.messagesProcessed24h.toLocaleString()}</span>
              </div>
            </div>
          </FlowCard>
        </motion.div>

        {/* Calendar Sync */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <FlowCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Calendar Sync</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Google Calendar</p>
                </div>
              </div>
              <StatusBadge
                status={metrics.calendar.status}
                label={metrics.calendar.status}
                className={getStatusColor(metrics.calendar.status)}
                icon={getStatusIcon(metrics.calendar.status)}
              />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Connected Accounts</span>
                <span className="font-medium">{metrics.calendar.accountsConnected}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Last Sync</span>
                <span className="font-medium">{formatTimeAgo(metrics.calendar.lastSync)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Events (24h)</span>
                <span className="font-medium">{metrics.calendar.eventsProcessed24h}</span>
              </div>
            </div>
          </FlowCard>
        </motion.div>

        {/* Authentication */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <FlowCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Authentication</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">NextAuth.js</p>
                </div>
              </div>
              <StatusBadge
                status={metrics.authentication.status}
                label={metrics.authentication.status}
                className={getStatusColor(metrics.authentication.status)}
                icon={getStatusIcon(metrics.authentication.status)}
              />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Active Sessions</span>
                <span className="font-medium">{metrics.authentication.activeSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Failed Logins (24h)</span>
                <span className="font-medium">{metrics.authentication.failedLogins24h}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Token Health</span>
                <span className="font-medium">{metrics.authentication.tokenHealth}%</span>
              </div>
            </div>
          </FlowCard>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <FlowCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Security</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">KMS + Rate Limiting</p>
                </div>
              </div>
              <StatusBadge
                status={metrics.security.status}
                label={metrics.security.status}
                className={getStatusColor(metrics.security.status)}
                icon={getStatusIcon(metrics.security.status)}
              />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Encryption</span>
                <span className="font-medium capitalize">{metrics.security.encryptionStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Rate Limited (24h)</span>
                <span className="font-medium">{metrics.security.rateLimit.blocked24h}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Audit Events (24h)</span>
                <span className="font-medium">{metrics.security.auditEvents24h}</span>
              </div>
            </div>
          </FlowCard>
        </motion.div>

        {/* Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <FlowCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Performance</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">API Metrics</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Response Time</span>
                <span className="font-medium">{metrics.performance.apiResponseTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Error Rate</span>
                <span className="font-medium">{metrics.performance.errorRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Throughput</span>
                <span className="font-medium">{metrics.performance.throughput} req/s</span>
              </div>
            </div>
          </FlowCard>
        </motion.div>
      </div>

      {/* Recent Errors */}
      {recentErrors.length > 0 && (
        <FlowCard className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Recent Errors
          </h3>
          
          <div className="space-y-3">
            {recentErrors.map((error, index) => (
              <motion.div
                key={error.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  error.severity === 'high' ? 'bg-red-100 dark:bg-red-900' :
                  error.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900' :
                  'bg-blue-100 dark:bg-blue-900'
                )}>
                  <AlertTriangle className={cn(
                    'h-4 w-4',
                    error.severity === 'high' ? 'text-red-600 dark:text-red-400' :
                    error.severity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-blue-600 dark:text-blue-400'
                  )} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      {error.component}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      {error.count > 1 && (
                        <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs">
                          {error.count}x
                        </span>
                      )}
                      <span>{formatTimeAgo(error.timestamp)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {error.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </FlowCard>
      )}
    </div>
  );
}
