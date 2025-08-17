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
  ArrowRight,
  Sparkles
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
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl relative overflow-hidden hover:shadow-2xl transition-all duration-300">
      {/* Enhanced background with subtle flow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/20 via-transparent to-blue-50/20 dark:from-teal-900/10 dark:via-transparent dark:to-blue-900/10" />
      
      {/* Animated flow lines */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse" style={{ animationDuration: '3s', animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10 p-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Welcome & Actions */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-teal-400 animate-pulse" />
                <span className="text-sm font-medium text-teal-400 uppercase tracking-wide">Today's Flow</span>
              </div>
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
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
                  className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-8 text-center">
                <div className="mb-4">
                  <TrendingUp className="h-12 w-12 text-teal-400 mx-auto animate-pulse" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Ready to Flow
                </h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Connect your accounts to see live insights about your emails, calendar, and deals.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {/* Today's Emails */}
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-4 text-center hover:scale-105 transition-all duration-300 group">
                  <div className="relative">
                    <Mail className="h-8 w-8 text-teal-500 mx-auto mb-2 group-hover:animate-bounce" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full animate-pulse" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {insights?.todayEmails || 0}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Today's Emails
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-4 text-center hover:scale-105 transition-all duration-300 group">
                  <div className="relative">
                    <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2 group-hover:animate-bounce" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {insights?.upcomingEvents || 0}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Upcoming Events
                  </div>
                </div>

                {/* Active Leads */}
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-4 text-center hover:scale-105 transition-all duration-300 group">
                  <div className="relative">
                    <Users className="h-8 w-8 text-green-500 mx-auto mb-2 group-hover:animate-bounce" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {insights?.activeLeads || 0}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Active Leads
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
