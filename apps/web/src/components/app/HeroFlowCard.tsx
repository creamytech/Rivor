"use client";
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import FlowCard from '@/components/river/FlowCard';
import StatusBadge from '@/components/river/StatusBadge';
import DataEmpty from '@/components/river/DataEmpty';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Calendar, 
  Users, 
  TrendingUp, 
  Plus,
  Shield,
  ArrowRight
} from 'lucide-react';

interface FlowInsight {
  todayEmails: number;
  upcomingEvents: number;
  activeLeads: number;
  connectionStatus: 'connected' | 'partial' | 'none';
}

export default function HeroFlowCard() {
  const [insights, setInsights] = useState<FlowInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlowInsights();
  }, []);

  const fetchFlowInsights = async () => {
    try {
      const response = await fetch('/api/insights/flow');
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error('Failed to fetch flow insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <FlowCard variant="hero" className="animate-pulse">
        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
            </div>
            <div className="space-y-3">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FlowCard>
    );
  }

  return (
    <FlowCard variant="hero" className="relative overflow-hidden">
      {/* Background river flow effect */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10,50 Q50,10 90,50 T170,50' stroke='rgb(20,184,166)' stroke-width='2' fill='none' opacity='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 100px',
          backgroundRepeat: 'repeat-x'
        }}
      />
      
      <div className="relative z-10 p-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Welcome & Actions */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Where Deals Flow Seamlessly
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Connect your accounts to start syncing emails, calendar events, and managing your pipeline.
              </p>
            </div>

            {insights?.connectionStatus === 'none' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-3 py-2 rounded-lg">
                  <Shield className="h-4 w-4" />
                  <span>Your data is encrypted and secure</span>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => signIn('google', { callbackUrl: '/app' })}
                    className="w-full bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
                    size="lg"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Connect Google Account
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  
                  <Button
                    disabled
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Connect Microsoft
                    <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <StatusBadge 
                    status={insights?.connectionStatus === 'connected' ? 'live' : 'token_issue'} 
                    size="md"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {insights?.connectionStatus === 'connected' 
                      ? 'All systems operational' 
                      : 'Some accounts need attention'
                    }
                  </span>
                </div>
                
                <Button 
                  className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
                  onClick={() => window.location.href = '/app/inbox'}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Go to Inbox
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* Right side - Live Flow Insights */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Today's Flow
            </h3>
            
            {insights?.connectionStatus === 'none' ? (
              <DataEmpty
                icon={<TrendingUp className="h-12 w-12" />}
                title="Ready to Flow"
                description="Connect your accounts to see live insights about your emails, calendar, and deals."
                className="py-8"
              />
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {/* Today's Emails */}
                <FlowCard className="p-4 text-center">
                  <Mail className="h-8 w-8 text-teal-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {insights?.todayEmails || 0}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Today's Emails
                  </div>
                </FlowCard>

                {/* Upcoming Events */}
                <FlowCard className="p-4 text-center">
                  <Calendar className="h-8 w-8 text-azure-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {insights?.upcomingEvents || 0}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Upcoming Events
                  </div>
                </FlowCard>

                {/* Active Leads */}
                <FlowCard className="p-4 text-center">
                  <Users className="h-8 w-8 text-jade-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {insights?.activeLeads || 0}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Active Leads
                  </div>
                </FlowCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </FlowCard>
  );
}
