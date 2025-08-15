"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PillFilter from '@/components/river/PillFilter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search,
  Download,
  Filter,
  User,
  Mail,
  Calendar,
  Users,
  Settings,
  Shield,
  Link,
  Trash2,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high';
  category: 'auth' | 'data' | 'settings' | 'integration' | 'user_management';
}

export default function AuditLogSettings() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');

  const filters = [
    { id: 'all', label: 'All Activities', count: auditLogs.length },
    { id: 'auth', label: 'Authentication', count: auditLogs.filter(log => log.category === 'auth').length },
    { id: 'data', label: 'Data Changes', count: auditLogs.filter(log => log.category === 'data').length },
    { id: 'settings', label: 'Settings', count: auditLogs.filter(log => log.category === 'settings').length },
    { id: 'integration', label: 'Integrations', count: auditLogs.filter(log => log.category === 'integration').length },
    { id: 'user_management', label: 'User Management', count: auditLogs.filter(log => log.category === 'user_management').length }
  ];

  const dateRangeOptions = [
    { id: '1d', label: 'Last 24 hours' },
    { id: '7d', label: 'Last 7 days' },
    { id: '30d', label: 'Last 30 days' },
    { id: '90d', label: 'Last 90 days' }
  ];

  useEffect(() => {
    fetchAuditLogs();
  }, [dateRange, currentFilter]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        range: dateRange,
        category: currentFilter === 'all' ? '' : currentFilter,
        search: searchQuery
      });

      const response = await fetch(`/api/audit-log?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      // Set demo data for now
      setAuditLogs(generateDemoAuditLogs());
    } finally {
      setLoading(false);
    }
  };

  const generateDemoAuditLogs = (): AuditLogEntry[] => {
    const actions = [
      { action: 'sign_in', resource: 'auth', details: 'User signed in successfully', category: 'auth' as const, severity: 'low' as const },
      { action: 'connect_google', resource: 'integration', details: 'Connected Google account for email sync', category: 'integration' as const, severity: 'medium' as const },
      { action: 'create_lead', resource: 'lead', details: 'Created new lead: "Enterprise Client"', category: 'data' as const, severity: 'low' as const },
      { action: 'invite_user', resource: 'user', details: 'Invited new user: colleague@company.com', category: 'user_management' as const, severity: 'medium' as const },
      { action: 'update_settings', resource: 'settings', details: 'Updated notification preferences', category: 'settings' as const, severity: 'low' as const },
      { action: 'delete_contact', resource: 'contact', details: 'Deleted contact: John Doe', category: 'data' as const, severity: 'high' as const },
      { action: 'export_data', resource: 'data', details: 'Exported contact data (CSV)', category: 'data' as const, severity: 'medium' as const },
      { action: 'email_sync', resource: 'email', details: 'Synced 15 new emails from Gmail', category: 'integration' as const, severity: 'low' as const }
    ];

    return Array.from({ length: 20 }, (_, i) => {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      
      return {
        id: `audit-${i + 1}`,
        timestamp: timestamp.toISOString(),
        userId: 'user-1',
        userName: 'John Smith',
        userEmail: 'john@company.com',
        action: randomAction.action,
        resource: randomAction.resource,
        resourceId: `resource-${i + 1}`,
        details: randomAction.details,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: randomAction.severity,
        category: randomAction.category
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const handleExportLogs = async () => {
    try {
      const params = new URLSearchParams({
        range: dateRange,
        category: currentFilter === 'all' ? '' : currentFilter,
        search: searchQuery,
        format: 'csv'
      });

      const response = await fetch(`/api/audit-log/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'sign_in':
      case 'sign_out':
        return <Shield className="h-4 w-4" />;
      case 'create_lead':
      case 'update_lead':
      case 'delete_lead':
        return <Users className="h-4 w-4" />;
      case 'connect_google':
      case 'disconnect_google':
        return <Link className="h-4 w-4" />;
      case 'invite_user':
      case 'remove_user':
        return <User className="h-4 w-4" />;
      case 'send_email':
      case 'email_sync':
        return <Mail className="h-4 w-4" />;
      case 'create_event':
      case 'update_event':
        return <Calendar className="h-4 w-4" />;
      case 'update_settings':
        return <Settings className="h-4 w-4" />;
      case 'export_data':
        return <Download className="h-4 w-4" />;
      case 'delete_contact':
      case 'delete_data':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'auth':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'data':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'settings':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'integration':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'user_management':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredLogs = auditLogs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query) ||
        log.userName.toLowerCase().includes(query) ||
        log.userEmail.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Audit Log
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Track all activities and changes in your organization for security and compliance.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={cn(
              "rounded-md border border-slate-300 dark:border-slate-600",
              "bg-white dark:bg-slate-800 px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            )}
          >
            {dateRangeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          
          <Button onClick={handleExportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button onClick={fetchAuditLogs} variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <PillFilter
          options={filters}
          value={currentFilter}
          onChange={setCurrentFilter}
        />
      </div>

      {/* Audit Log Entries */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No audit logs found
            </h4>
            <p className="text-slate-600 dark:text-slate-400">
              {searchQuery ? 'Try adjusting your search criteria.' : 'No activities recorded in the selected time range.'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  getSeverityColor(log.severity) === 'text-red-600 dark:text-red-400' ? 'bg-red-100 dark:bg-red-900' :
                  getSeverityColor(log.severity) === 'text-amber-600 dark:text-amber-400' ? 'bg-amber-100 dark:bg-amber-900' :
                  'bg-green-100 dark:bg-green-900'
                )}>
                  {getActionIcon(log.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {log.details}
                      </h4>
                      <span className={cn(
                        'px-2 py-0.5 text-xs rounded-full',
                        getCategoryColor(log.category)
                      )}>
                        {log.category.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span>{log.userName} ({log.userEmail})</span>
                    <span>•</span>
                    <span>{log.ipAddress}</span>
                    {log.resourceId && (
                      <>
                        <span>•</span>
                        <span>ID: {log.resourceId}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
