"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  Activity,
  TrendingUp,
  Clock,
  Mail,
  Phone,
  Calendar,
  Users,
  Target,
  Zap,
  Settings,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Star,
  Archive,
  Tag,
  Forward,
  Reply,
  Trash2,
  BookmarkPlus,
  Send,
  Eye,
  MessageSquare,
  Building2,
  DollarSign,
  FileText,
  Filter,
  Search,
  MoreHorizontal
} from 'lucide-react';

interface EmailAnalytics {
  totalEmails: number;
  unreadEmails: number;
  responseRate: number;
  averageResponseTime: number; // hours
  emailsByType: {
    name: string;
    value: number;
    color: string;
  }[];
  weeklyActivity: {
    day: string;
    emails: number;
    responses: number;
  }[];
  leadConversion: {
    month: string;
    leads: number;
    conversions: number;
  }[];
  topContacts: {
    name: string;
    email: string;
    emailCount: number;
    lastContact: Date;
    leadScore: number;
  }[];
}

interface BulkAction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  action: (selectedEmails: string[]) => Promise<void>;
  requiresConfirmation?: boolean;
}

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'email_received' | 'email_sent' | 'contact_created' | 'lead_created' | 'scheduled_time';
    conditions: any;
  };
  actions: {
    type: 'send_email' | 'create_task' | 'update_lead' | 'schedule_call' | 'tag_contact';
    parameters: any;
  }[];
  isActive: boolean;
  executionCount: number;
  lastExecuted?: Date;
  createdAt: Date;
}

interface ProductivityWorkflowProps {
  selectedEmails?: string[];
  onBulkAction?: (action: string, emailIds: string[]) => void;
  onWorkflowCreate?: (workflow: WorkflowRule) => void;
}

// Mock analytics data
const generateMockAnalytics = (): EmailAnalytics => {
  return {
    totalEmails: 847,
    unreadEmails: 23,
    responseRate: 89.5,
    averageResponseTime: 2.3,
    emailsByType: [
      { name: 'Buyer Inquiries', value: 342, color: '#3B82F6' },
      { name: 'Seller Leads', value: 278, color: '#10B981' },
      { name: 'Showing Requests', value: 156, color: '#8B5CF6' },
      { name: 'Market Questions', value: 71, color: '#F59E0B' }
    ],
    weeklyActivity: [
      { day: 'Mon', emails: 45, responses: 38 },
      { day: 'Tue', emails: 52, responses: 47 },
      { day: 'Wed', emails: 38, responses: 35 },
      { day: 'Thu', emails: 61, responses: 54 },
      { day: 'Fri', emails: 49, responses: 44 },
      { day: 'Sat', emails: 23, responses: 19 },
      { day: 'Sun', emails: 15, responses: 12 }
    ],
    leadConversion: [
      { month: 'Jan', leads: 45, conversions: 12 },
      { month: 'Feb', leads: 52, conversions: 15 },
      { month: 'Mar', leads: 61, conversions: 18 },
      { month: 'Apr', leads: 48, conversions: 14 },
      { month: 'May', leads: 67, conversions: 21 },
      { month: 'Jun', leads: 73, conversions: 25 }
    ],
    topContacts: [
      { name: 'Sarah Johnson', email: 'sarah.johnson@email.com', emailCount: 15, lastContact: new Date(Date.now() - 24 * 60 * 60 * 1000), leadScore: 95 },
      { name: 'Michael Chen', email: 'michael.chen@email.com', emailCount: 12, lastContact: new Date(Date.now() - 48 * 60 * 60 * 1000), leadScore: 87 },
      { name: 'Emily Rodriguez', email: 'emily.rodriguez@email.com', emailCount: 10, lastContact: new Date(Date.now() - 72 * 60 * 60 * 1000), leadScore: 82 },
      { name: 'David Wilson', email: 'david.wilson@email.com', emailCount: 8, lastContact: new Date(Date.now() - 96 * 60 * 60 * 1000), leadScore: 76 }
    ]
  };
};

const generateMockWorkflows = (): WorkflowRule[] => {
  return [
    {
      id: 'workflow-1',
      name: 'Auto-respond to Buyer Inquiries',
      description: 'Send immediate acknowledgment and schedule follow-up for buyer inquiries',
      trigger: {
        type: 'email_received',
        conditions: { emailType: 'buyer_inquiry', keywords: ['buy', 'purchase', 'interested'] }
      },
      actions: [
        { type: 'send_email', parameters: { template: 'buyer_acknowledgment', delay: 0 } },
        { type: 'create_task', parameters: { title: 'Follow up with buyer', dueDate: '+24h' } }
      ],
      isActive: true,
      executionCount: 127,
      lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'workflow-2',
      name: 'Hot Lead Notification',
      description: 'Alert when high-value lead emails are received',
      trigger: {
        type: 'email_received',
        conditions: { leadScore: '>80', priceRange: '>500000' }
      },
      actions: [
        { type: 'send_email', parameters: { to: 'agent@realty.com', template: 'hot_lead_alert' } },
        { type: 'update_lead', parameters: { priority: 'high', tags: ['hot_lead'] } }
      ],
      isActive: true,
      executionCount: 23,
      lastExecuted: new Date(Date.now() - 6 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'workflow-3',
      name: 'Weekly Market Update',
      description: 'Send market updates to all active clients every Friday',
      trigger: {
        type: 'scheduled_time',
        conditions: { schedule: 'weekly', day: 'friday', time: '09:00' }
      },
      actions: [
        { type: 'send_email', parameters: { template: 'market_update', recipients: 'active_clients' } }
      ],
      isActive: false,
      executionCount: 8,
      lastExecuted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    }
  ];
};

export default function ProductivityWorkflow({ selectedEmails = [], onBulkAction, onWorkflowCreate }: ProductivityWorkflowProps) {
  const [analytics, setAnalytics] = useState<EmailAnalytics>(generateMockAnalytics());
  const [workflows, setWorkflows] = useState<WorkflowRule[]>(generateMockWorkflows());
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showWorkflows, setShowWorkflows] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedBulkAction, setSelectedBulkAction] = useState<string>('');

  const bulkActions: BulkAction[] = [
    {
      id: 'mark_read',
      name: 'Mark as Read',
      description: 'Mark selected emails as read',
      icon: <Eye className="h-4 w-4" />,
      action: async (emails) => console.log('Marking as read:', emails)
    },
    {
      id: 'mark_unread',
      name: 'Mark as Unread',
      description: 'Mark selected emails as unread',
      icon: <Mail className="h-4 w-4" />,
      action: async (emails) => console.log('Marking as unread:', emails)
    },
    {
      id: 'archive',
      name: 'Archive',
      description: 'Archive selected emails',
      icon: <Archive className="h-4 w-4" />,
      action: async (emails) => console.log('Archiving:', emails)
    },
    {
      id: 'tag_hot_lead',
      name: 'Tag as Hot Lead',
      description: 'Tag contacts as hot leads',
      icon: <Star className="h-4 w-4" />,
      action: async (emails) => console.log('Tagging as hot lead:', emails)
    },
    {
      id: 'schedule_follow_up',
      name: 'Schedule Follow-up',
      description: 'Create follow-up tasks for selected contacts',
      icon: <Calendar className="h-4 w-4" />,
      action: async (emails) => console.log('Scheduling follow-up:', emails)
    },
    {
      id: 'forward_to_agent',
      name: 'Forward to Agent',
      description: 'Forward emails to another agent',
      icon: <Forward className="h-4 w-4" />,
      action: async (emails) => console.log('Forwarding to agent:', emails)
    },
    {
      id: 'delete',
      name: 'Delete',
      description: 'Delete selected emails permanently',
      icon: <Trash2 className="h-4 w-4" />,
      action: async (emails) => console.log('Deleting:', emails),
      requiresConfirmation: true
    }
  ];

  const executeBulkAction = async (actionId: string) => {
    const action = bulkActions.find(a => a.id === actionId);
    if (!action) return;

    if (action.requiresConfirmation) {
      const confirmed = window.confirm(`Are you sure you want to ${action.name.toLowerCase()} ${selectedEmails.length} email(s)?`);
      if (!confirmed) return;
    }

    await action.action(selectedEmails);
    onBulkAction?.(actionId, selectedEmails);
    setShowBulkActions(false);
  };

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId ? { ...w, isActive: !w.isActive } : w
    ));
  };

  return (
    <div className="space-y-4">
      {/* Productivity Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Response Rate</p>
                <p className="text-2xl font-bold text-blue-800">{analytics.responseRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={analytics.responseRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-green-800">{analytics.averageResponseTime}h</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Active Workflows</p>
                <p className="text-2xl font-bold text-purple-800">
                  {workflows.filter(w => w.isActive).length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Unread Emails</p>
                <p className="text-2xl font-bold text-orange-800">{analytics.unreadEmails}</p>
              </div>
              <Mail className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Email Analytics
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Email Performance Analytics</DialogTitle>
              <DialogDescription>
                Comprehensive analytics for your real estate email communications
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="conversion">Conversion</TabsTrigger>
                <TabsTrigger value="contacts">Top Contacts</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Email Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics.emailsByType}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {analytics.emailsByType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Key Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-800">{analytics.totalEmails}</div>
                          <div className="text-sm text-blue-600">Total Emails</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-800">{analytics.responseRate}%</div>
                          <div className="text-sm text-green-600">Response Rate</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-800">{analytics.averageResponseTime}h</div>
                          <div className="text-sm text-purple-600">Avg Response</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-800">{analytics.unreadEmails}</div>
                          <div className="text-sm text-orange-600">Unread</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Weekly Email Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={analytics.weeklyActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="emails" fill="#3B82F6" name="Emails Received" />
                        <Bar dataKey="responses" fill="#10B981" name="Responses Sent" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="conversion" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lead Conversion Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={analytics.leadConversion}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2} name="Leads" />
                        <Line type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={2} name="Conversions" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contacts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Active Contacts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.topContacts.map((contact, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-gray-600">{contact.email}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{contact.emailCount} emails</div>
                            <div className="text-xs text-gray-500">
                              Last: {contact.lastContact.toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">{contact.leadScore}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Bulk Actions
              {selectedEmails.length > 0 && (
                <Badge variant="secondary">{selectedEmails.length}</Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Actions</DialogTitle>
              <DialogDescription>
                Perform actions on {selectedEmails.length} selected email{selectedEmails.length !== 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {bulkActions.map(action => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => executeBulkAction(action.id)}
                  disabled={selectedEmails.length === 0}
                >
                  {action.icon}
                  <div className="ml-2 text-left">
                    <div className="font-medium">{action.name}</div>
                    <div className="text-xs text-gray-600">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showWorkflows} onOpenChange={setShowWorkflows}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Workflow Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Workflow Automation</DialogTitle>
              <DialogDescription>
                Automate repetitive tasks and improve your email productivity
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {workflows.map(workflow => (
                <Card key={workflow.id} className={workflow.isActive ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{workflow.name}</h3>
                          <Badge variant={workflow.isActive ? "default" : "secondary"}>
                            {workflow.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                        
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="font-medium">Executions:</span> {workflow.executionCount}
                          </div>
                          <div>
                            <span className="font-medium">Last run:</span> {
                              workflow.lastExecuted ? workflow.lastExecuted.toLocaleDateString() : 'Never'
                            }
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {workflow.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleWorkflow(workflow.id)}
                        >
                          {workflow.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Workflow Details */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Trigger:</span> {workflow.trigger.type.replace('_', ' ')}
                        </div>
                        <div>
                          <span className="font-medium">Actions:</span> {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button className="w-full" variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Create New Workflow
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Quick Actions Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-3">
            <Button variant="outline" size="sm" className="flex flex-col h-auto p-3">
              <Mail className="h-5 w-5 mb-1" />
              <span className="text-xs">Mark Read</span>
            </Button>
            <Button variant="outline" size="sm" className="flex flex-col h-auto p-3">
              <Star className="h-5 w-5 mb-1" />
              <span className="text-xs">Hot Lead</span>
            </Button>
            <Button variant="outline" size="sm" className="flex flex-col h-auto p-3">
              <Calendar className="h-5 w-5 mb-1" />
              <span className="text-xs">Schedule</span>
            </Button>
            <Button variant="outline" size="sm" className="flex flex-col h-auto p-3">
              <Archive className="h-5 w-5 mb-1" />
              <span className="text-xs">Archive</span>
            </Button>
            <Button variant="outline" size="sm" className="flex flex-col h-auto p-3">
              <Forward className="h-5 w-5 mb-1" />
              <span className="text-xs">Forward</span>
            </Button>
            <Button variant="outline" size="sm" className="flex flex-col h-auto p-3">
              <Tag className="h-5 w-5 mb-1" />
              <span className="text-xs">Tag</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">+15%</div>
              <div className="text-sm text-gray-600">Response rate improvement this month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">2.1h</div>
              <div className="text-sm text-gray-600">Average time saved by automation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">89%</div>
              <div className="text-sm text-gray-600">Email engagement rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}