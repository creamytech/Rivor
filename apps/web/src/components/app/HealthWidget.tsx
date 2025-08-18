"use client";
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Wifi, WifiOff, Settings, Clock, Zap, Mail, Calendar } from 'lucide-react';

interface Integration {
  id: string;
  provider: string;
  status: string;
  lastSyncedAt: string | null;
  errorReason: string | null;
}

interface HealthWidgetProps {
  integrations: Integration[];
  onFix: (id: string) => void;
  onReauth: (id: string) => void;
}

export default function HealthWidget({ integrations = [], onFix, onReauth }: HealthWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // tRPC mutations
  const fixMutation = trpc.integrations.fix.useMutation();
  const reauthMutation = trpc.integrations.reauth.useMutation();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'action_needed':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'action_needed':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'disconnected':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Healthy';
      case 'action_needed':
        return 'Needs Attention';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const hasIssues = integrations.some(integration => integration.status !== 'connected');
  const totalErrors = integrations.filter(integration => integration.errorReason).length;

  return (
    <GlassCard variant="river-flow" intensity="medium" flowDirection="up" className="h-full flex flex-col">
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
      <GlassCardContent className="p-0 flex-1 flex flex-col">
        <div className="space-y-3">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className={`p-3 rounded-lg border transition-colors ${
                integration.status === 'connected'
                  ? 'bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : integration.status === 'action_needed'
                  ? 'bg-yellow-50/50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(integration.status)}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {integration.provider}
                  </span>
                </div>
                <Badge className={getStatusColor(integration.status)}>
                  {getStatusLabel(integration.status)}
                </Badge>
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {integration.lastSyncedAt ? (
                  <span>Last sync: {new Date(integration.lastSyncedAt).toLocaleString()}</span>
                ) : (
                  <span>Never synced</span>
                )}
              </div>

              {integration.errorReason && (
                <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                  Error: {integration.errorReason}
                </div>
              )}

              <div className="flex items-center gap-2">
                {integration.status !== 'connected' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fixMutation.mutate({ id: integration.id, type: integration.provider.includes('email') ? 'email' : 'calendar' })}
                    className="text-xs"
                    disabled={fixMutation.isLoading}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Fix
                  </Button>
                )}
                {integration.status === 'action_needed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reauthMutation.mutate({ id: integration.id, type: integration.provider.includes('email') ? 'email' : 'calendar' })}
                    className="text-xs"
                    disabled={reauthMutation.isLoading}
                  >
                    <Wifi className="h-3 w-3 mr-1" />
                    Reauth
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

                 {integrations.length === 0 && (
           <div className="flex-1 flex items-center justify-center p-6">
             <div className="text-center space-y-4">
               {/* Illustrated onboarding card */}
               <div className="relative">
                 <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full flex items-center justify-center">
                   <WifiOff className="h-8 w-8 text-blue-500" />
                 </div>
                 <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                   <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">!</span>
                 </div>
               </div>
               
               <div className="space-y-2">
                 <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                   Connect Your Integrations
                 </h3>
                 <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
                   Link your email and calendar to start detecting leads and syncing data automatically.
                 </p>
               </div>
               
               <div className="flex flex-col gap-2">
                 <Button
                   size="sm"
                   onClick={() => console.log('Connect Gmail')}
                   className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                 >
                   <Mail className="h-4 w-4 mr-2" />
                   Connect Gmail
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => console.log('Connect Calendar')}
                   className="w-full"
                 >
                   <Calendar className="h-4 w-4 mr-2" />
                   Connect Calendar
                 </Button>
               </div>
             </div>
           </div>
         )}
      </GlassCardContent>
    </GlassCard>
  );
}
