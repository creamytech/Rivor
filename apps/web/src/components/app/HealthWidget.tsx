"use client";
import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Settings,
  Clock,
  Zap
} from 'lucide-react';

interface IntegrationStatus {
  id: string;
  name: string;
  type: 'email' | 'calendar' | 'contacts';
  status: 'healthy' | 'warning' | 'error' | 'disconnected';
  lastSync: string;
  errors: number;
  needsReauth: boolean;
  isConnected: boolean;
}

interface HealthWidgetProps {
  integrations?: IntegrationStatus[];
  onFix?: (integrationId: string) => void;
  onReauth?: (integrationId: string) => void;
}

export default function HealthWidget({ 
  integrations = [], 
  onFix, 
  onReauth 
}: HealthWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-slate-400" />;
      default:
        return <Wifi className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'disconnected':
        return 'text-slate-500';
      default:
        return 'text-slate-500';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'error':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'disconnected':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return '📧';
      case 'calendar':
        return '📅';
      case 'contacts':
        return '👥';
      default:
        return '🔗';
    }
  };

  const hasIssues = integrations.some(integration => 
    integration.status !== 'healthy' || integration.needsReauth
  );

  const totalErrors = integrations.reduce((sum, integration) => sum + integration.errors, 0);

  return (
    <GlassCard variant="gradient" intensity="medium" className="h-full">
      <GlassCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <GlassCardTitle className="text-lg">Health</GlassCardTitle>
          </div>
          <div className="flex items-center gap-2">
            {hasIssues && (
              <Badge variant="destructive" className="text-xs">
                {totalErrors} issues
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </GlassCardHeader>
      
      <GlassCardContent className="p-0">
        <div className="space-y-3">
          {integrations.map((integration) => (
            <div 
              key={integration.id}
              className={`p-3 rounded-lg border transition-colors ${
                integration.status === 'healthy' 
                  ? 'bg-green-50/50 dark:bg-green-900/20 border-green-200/50 dark:border-green-800/50' 
                  : integration.status === 'warning'
                  ? 'bg-yellow-50/50 dark:bg-yellow-900/20 border-yellow-200/50 dark:border-yellow-800/50'
                  : 'bg-red-50/50 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(integration.type)}</span>
                  <span className="font-medium text-sm">{integration.name}</span>
                  {getStatusIcon(integration.status)}
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getStatusBadgeColor(integration.status)}`}
                >
                  {integration.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last sync: {integration.lastSync}
                </div>
                {integration.errors > 0 && (
                  <span className="text-red-500">
                    {integration.errors} errors
                  </span>
                )}
              </div>

              {isExpanded && (
                <div className="border-t border-white/20 pt-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Connection: {integration.isConnected ? 'Active' : 'Inactive'}
                    </span>
                    {integration.needsReauth && (
                      <span className="text-yellow-600 dark:text-yellow-400">
                        Needs reauthorization
                      </span>
                    )}
                  </div>
                </div>
              )}

              {(integration.status !== 'healthy' || integration.needsReauth) && (
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onFix?.(integration.id)}
                    className="text-xs h-7"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Fix
                  </Button>
                  {integration.needsReauth && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReauth?.(integration.id)}
                      className="text-xs h-7"
                    >
                      Reauth
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {integrations.length === 0 && (
          <div className="p-6 text-center">
            <Wifi className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-2">No integrations</p>
            <p className="text-xs text-slate-500">
              Connect your accounts to get started
            </p>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
