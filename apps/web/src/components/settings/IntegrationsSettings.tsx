"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StatusBadge from '@/components/river/StatusBadge';
import { Button } from '@/components/ui/button';
import { 
  Gmail, 
  Calendar,
  RefreshCw,
  Pause,
  Play,
  Unlink,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/river/RiverToast';

interface Integration {
  id: string;
  name: string;
  type: 'email' | 'calendar';
  provider: 'google' | 'microsoft';
  status: 'not_connected' | 'connecting' | 'backfilling' | 'live' | 'error' | 'paused';
  email?: string;
  syncStatus: string;
  lastSyncAt?: string;
  errorMessage?: string;
  accountsCount: number;
  itemsCount: number;
}

export default function IntegrationsSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/status');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrationAction = async (integrationId: string, action: 'connect' | 'reconnect' | 'pause' | 'resume' | 'disconnect') => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchIntegrations();
        
        const actionMessages = {
          connect: 'Integration connected successfully',
          reconnect: 'Integration reconnected successfully',
          pause: 'Integration paused',
          resume: 'Integration resumed',
          disconnect: 'Integration disconnected'
        };

        addToast({
          type: 'success',
          title: 'Success',
          description: actionMessages[action]
        });
      } else {
        throw new Error('Failed to perform action');
      }
    } catch (error) {
      console.error('Integration action failed:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to perform action. Please try again.'
      });
    }
  };

  const getStatusInfo = (status: Integration['status']) => {
    switch (status) {
      case 'not_connected':
        return { color: 'bg-slate-100 text-slate-700', icon: <Unlink className="h-3 w-3" />, label: 'Not Connected' };
      case 'connecting':
        return { color: 'bg-blue-100 text-blue-700', icon: <RefreshCw className="h-3 w-3 animate-spin" />, label: 'Connecting' };
      case 'backfilling':
        return { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" />, label: 'Syncing' };
      case 'live':
        return { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" />, label: 'Live' };
      case 'error':
        return { color: 'bg-red-100 text-red-700', icon: <AlertCircle className="h-3 w-3" />, label: 'Error' };
      case 'paused':
        return { color: 'bg-orange-100 text-orange-700', icon: <Pause className="h-3 w-3" />, label: 'Paused' };
      default:
        return { color: 'bg-slate-100 text-slate-700', icon: <Unlink className="h-3 w-3" />, label: 'Unknown' };
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <div className="w-6 h-6 bg-red-500 rounded text-white flex items-center justify-center text-xs font-bold">G</div>;
      case 'microsoft':
        return <div className="w-6 h-6 bg-blue-500 rounded text-white flex items-center justify-center text-xs font-bold">M</div>;
      default:
        return <div className="w-6 h-6 bg-slate-500 rounded text-white flex items-center justify-center text-xs font-bold">?</div>;
    }
  };

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
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
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
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
          Connected Services
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage your email and calendar integrations. Disconnect accounts to stop syncing data.
        </p>
      </div>

      <div className="space-y-4">
        {integrations.map((integration, index) => {
          const statusInfo = getStatusInfo(integration.status);
          
          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2">
                    {getProviderIcon(integration.provider)}
                    <div className="w-6 h-6 text-slate-500">
                      {integration.type === 'email' ? <Gmail className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {integration.name}
                      </h4>
                      <StatusBadge
                        status={integration.status}
                        label={statusInfo.label}
                        className={statusInfo.color}
                        showIcon={false}
                      />
                      {integration.status === 'live' && (
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <Zap className="h-3 w-3" />
                          <span>Live sync</span>
                        </div>
                      )}
                    </div>
                    
                    {integration.email && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {integration.email}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{integration.accountsCount} account{integration.accountsCount !== 1 ? 's' : ''}</span>
                      <span>{integration.itemsCount.toLocaleString()} items synced</span>
                      <span>Last sync: {formatLastSync(integration.lastSyncAt)}</span>
                    </div>
                    
                    {integration.errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-xs text-red-700 dark:text-red-300">
                          {integration.errorMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {integration.status === 'not_connected' && (
                    <Button
                      onClick={() => handleIntegrationAction(integration.id, 'connect')}
                      className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
                      size="sm"
                    >
                      Connect
                    </Button>
                  )}
                  
                  {integration.status === 'error' && (
                    <Button
                      onClick={() => handleIntegrationAction(integration.id, 'reconnect')}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reconnect
                    </Button>
                  )}
                  
                  {integration.status === 'live' && (
                    <Button
                      onClick={() => handleIntegrationAction(integration.id, 'pause')}
                      variant="outline"
                      size="sm"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  
                  {integration.status === 'paused' && (
                    <Button
                      onClick={() => handleIntegrationAction(integration.id, 'resume')}
                      variant="outline"
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  
                  {['live', 'paused', 'error'].includes(integration.status) && (
                    <Button
                      onClick={() => handleIntegrationAction(integration.id, 'disconnect')}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Coming Soon Section */}
      <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
          Coming Soon
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          More integrations are on the way to make Rivor even more powerful.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 opacity-50">
            <div className="w-6 h-6 bg-blue-500 rounded text-white flex items-center justify-center text-xs font-bold">M</div>
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">Microsoft 365</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Email & Calendar</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 opacity-50">
            <div className="w-6 h-6 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">S</div>
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">Salesforce</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">CRM Sync</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
