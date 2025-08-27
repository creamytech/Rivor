"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  Calendar,
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  Target,
  Phone,
  Mail,
  FileText,
  BarChart3,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssistantStats {
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    automated: number;
  };
  followUps: {
    active: number;
    completed: number;
    sequences: number;
    responseRate: number;
  };
  qualifications: {
    total: number;
    tierA: number;
    tierB: number;
    tierC: number;
    averageScore: number;
  };
  automation: {
    rulesActive: number;
    tasksAutomated: number;
    timesSaved: number; // in hours
    efficiency: number; // percentage
  };
}

interface AssistantDashboardProps {
  className?: string;
}

export function AssistantDashboard({ className }: AssistantDashboardProps) {
  const [stats, setStats] = useState<AssistantStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAssistantData();
  }, []);

  const fetchAssistantData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments stats
      const appointmentsRes = await fetch('/api/assistant/appointments');
      const appointmentsData = appointmentsRes.ok ? await appointmentsRes.json() : null;

      // Fetch follow-up stats  
      const followUpRes = await fetch('/api/assistant/followup?type=executions');
      const followUpData = followUpRes.ok ? await followUpRes.json() : null;

      // Fetch qualification stats
      const qualificationRes = await fetch('/api/assistant/lead-qualification');
      const qualificationData = qualificationRes.ok ? await qualificationRes.json() : null;

      // Compile stats
      const compiledStats: AssistantStats = {
        appointments: {
          total: appointmentsData?.appointments?.length || 0,
          pending: appointmentsData?.summary?.byStatus?.pending || 0,
          confirmed: appointmentsData?.summary?.byStatus?.confirmed || 0,
          completed: appointmentsData?.summary?.byStatus?.completed || 0,
          automated: Math.round((appointmentsData?.appointments?.length || 0) * 0.8) // Assume 80% automated
        },
        followUps: {
          active: followUpData?.summary?.active || 0,
          completed: followUpData?.summary?.completed || 0,
          sequences: 5, // Mock data
          responseRate: 65 // Mock data
        },
        qualifications: {
          total: qualificationData?.stats?.totalLeads || 0,
          tierA: qualificationData?.stats?.tierBreakdown?.A || 0,
          tierB: qualificationData?.stats?.tierBreakdown?.B || 0,
          tierC: qualificationData?.stats?.tierBreakdown?.C || 0,
          averageScore: Math.round(qualificationData?.stats?.averageScore || 0)
        },
        automation: {
          rulesActive: 12, // Mock data
          tasksAutomated: 847, // Mock data
          timesSaved: 156, // Mock data
          efficiency: 87 // Mock data
        }
      };

      setStats(compiledStats);

      // Set recent activity (mock data for now)
      setRecentActivity([
        {
          type: 'appointment',
          title: 'Property showing scheduled automatically',
          description: 'AI scheduled showing for 123 Oak Street',
          time: '2 minutes ago',
          icon: Calendar,
          color: 'text-blue-500'
        },
        {
          type: 'qualification',
          title: 'Lead qualified as A-tier (Score: 89)',
          description: 'High-value buyer lead from website form',
          time: '15 minutes ago',
          icon: Target,
          color: 'text-green-500'
        },
        {
          type: 'followup',
          title: 'Follow-up sequence started',
          description: 'Warm lead nurturing sequence for John Smith',
          time: '1 hour ago',
          icon: MessageSquare,
          color: 'text-purple-500'
        },
        {
          type: 'task',
          title: 'Task auto-generated',
          description: 'Call hot lead within 2 hours - Mary Johnson',
          time: '2 hours ago',
          icon: Phone,
          color: 'text-orange-500'
        }
      ]);

    } catch (error) {
      console.error('Error fetching assistant data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Unable to load assistant data</p>
          <Button onClick={fetchAssistantData} className="mt-4">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.appointments.total}</p>
                <p className="text-xs text-gray-500">Appointments Managed</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {stats.appointments.automated} automated
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.followUps.active}</p>
                <p className="text-xs text-gray-500">Active Follow-ups</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {stats.followUps.responseRate}% response rate
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.qualifications.tierA}</p>
                <p className="text-xs text-gray-500">Hot Leads (A-tier)</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Avg score: {stats.qualifications.averageScore}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.automation.timesSaved}h</p>
                <p className="text-xs text-gray-500">Time Saved This Month</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {stats.automation.efficiency}% efficiency
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Performance Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Management */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-500" />
                AI Appointment Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{stats.appointments.pending}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{stats.appointments.confirmed}</div>
                  <div className="text-xs text-gray-500">Confirmed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-600">{stats.appointments.completed}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">{stats.appointments.automated}</div>
                  <div className="text-xs text-gray-500">Auto-scheduled</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Automation Rate</span>
                <span className="text-sm font-medium">
                  {Math.round((stats.appointments.automated / Math.max(stats.appointments.total, 1)) * 100)}%
                </span>
              </div>
              <Progress 
                value={(stats.appointments.automated / Math.max(stats.appointments.total, 1)) * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          {/* Lead Qualification */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-green-500" />
                AI Lead Qualification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-500">{stats.qualifications.tierA}</div>
                  <div className="text-xs text-gray-500">A-tier (Hot)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-500">{stats.qualifications.tierB}</div>
                  <div className="text-xs text-gray-500">B-tier (Warm)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-500">{stats.qualifications.tierC}</div>
                  <div className="text-xs text-gray-500">C-tier (Cold)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{stats.qualifications.averageScore}</div>
                  <div className="text-xs text-gray-500">Avg Score</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>A-tier (Hot Leads)</span>
                  <span>{Math.round((stats.qualifications.tierA / Math.max(stats.qualifications.total, 1)) * 100)}%</span>
                </div>
                <Progress value={(stats.qualifications.tierA / Math.max(stats.qualifications.total, 1)) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Follow-up Automation */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                Smart Follow-up Sequences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">{stats.followUps.active}</div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{stats.followUps.completed}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{stats.followUps.sequences}</div>
                  <div className="text-xs text-gray-500">Sequences</div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Response Rate</span>
                <span className="text-sm font-medium">{stats.followUps.responseRate}%</span>
              </div>
              <Progress value={stats.followUps.responseRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recent Activity & Controls */}
        <div className="space-y-6">
          {/* AI Assistant Status */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-green-500" />
                  AI Assistant Status
                </div>
                <Badge className="bg-green-100 text-green-800 border-0">
                  Active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Automation Rules</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{stats.automation.rulesActive}</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tasks Automated</span>
                  <span className="text-sm font-medium">{stats.automation.tasksAutomated}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Efficiency Score</span>
                  <span className="text-sm font-medium text-green-600">{stats.automation.efficiency}%</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-3 w-3 mr-1" />
                  Configure
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent AI Activity */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Recent AI Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className={cn("rounded-full p-1.5 bg-gray-100 dark:bg-gray-800", activity.color)}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              <Button variant="ghost" size="sm" className="w-full mt-3">
                View All Activity
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                  <Calendar className="h-3 w-3 mr-2" />
                  Schedule
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Target className="h-3 w-3 mr-2" />
                  Qualify
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <MessageSquare className="h-3 w-3 mr-2" />
                  Follow-up
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <FileText className="h-3 w-3 mr-2" />
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}