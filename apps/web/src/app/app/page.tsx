"use client";
import AppShell from "@/components/app/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Mail, 
  Calendar, 
  Users, 
  Briefcase, 
  CheckCircle, 
  AlertCircle,
  Plus,
  ArrowRight
} from "lucide-react";
import { PipelineEmpty, InboxEmpty, ContactsEmpty, CalendarEmpty } from "@/components/common/States";

export default function DashboardPage() {
  // Mock data - would come from API in real implementation
  const stats = [
    {
      title: "Active Deals",
      value: "12",
      change: "+3 this week",
      trend: "up" as const,
      icon: Briefcase
    },
    {
      title: "Unread Messages",
      value: "8",
      change: "2 hours ago",
      trend: "neutral" as const,
      icon: Mail
    },
    {
      title: "Meetings Today",
      value: "4",
      change: "Next: 2:30 PM",
      trend: "neutral" as const,
      icon: Calendar
    },
    {
      title: "Contacts",
      value: "247",
      change: "+15 this month",
      trend: "up" as const,
      icon: Users
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: "email",
      title: "New email from John Smith",
      time: "5 minutes ago",
      status: "unread"
    },
    {
      id: 2,
      type: "deal",
      title: "Deal moved to Proposal stage",
      time: "1 hour ago",
      status: "success"
    },
    {
      id: 3,
      type: "meeting",
      title: "Meeting with Acme Corp scheduled",
      time: "2 hours ago",
      status: "info"
    }
  ];

  const upcomingTasks = [
    {
      id: 1,
      title: "Follow up with ABC Company",
      due: "Today, 3:00 PM",
      priority: "high"
    },
    {
      id: 2,
      title: "Send proposal to XYZ Corp",
      due: "Tomorrow, 9:00 AM",
      priority: "medium"
    },
    {
      id: 3,
      title: "Review contract terms",
      due: "Friday, 2:00 PM",
      priority: "low"
    }
  ];

  return (
    <AppShell>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Good morning! 👋</h1>
          <p className="text-[var(--muted-foreground)]">
            Here's what's happening with your deals today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--muted-foreground)]">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                        {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {stat.change}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                      <Icon className="h-6 w-6 text-[var(--rivor-teal)]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates across your workspace</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--muted)] transition-colors">
                      <div className="flex-shrink-0">
                        {activity.type === "email" && <Mail className="h-4 w-4 text-blue-500" />}
                        {activity.type === "deal" && <Briefcase className="h-4 w-4 text-green-500" />}
                        {activity.type === "meeting" && <Calendar className="h-4 w-4 text-purple-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{activity.time}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {activity.status === "unread" && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                        {activity.status === "success" && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Tasks */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Tasks</CardTitle>
                    <CardDescription>Your priorities for today</CardDescription>
                  </div>
                  <Button variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border)]">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{task.due}</p>
                      </div>
                      <Badge 
                        variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-3" asChild>
                  <a href="/app/tasks" className="flex items-center justify-center gap-2">
                    View All Tasks
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                <a href="/app/inbox">
                  <Mail className="h-6 w-6" />
                  <span>Check Inbox</span>
                </a>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                <a href="/app/pipeline">
                  <Briefcase className="h-6 w-6" />
                  <span>Add Deal</span>
                </a>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                <a href="/app/calendar">
                  <Calendar className="h-6 w-6" />
                  <span>Schedule Meeting</span>
                </a>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                <a href="/app/contacts">
                  <Users className="h-6 w-6" />
                  <span>Add Contact</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
