"use client";
import AppShell from "@/components/app/AppShell";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertCircle, RefreshCw, ExternalLink, Shield, Mail, Calendar, User, Plus, Download } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-[var(--muted-foreground)]">Manage your account and organization settings</p>
        </div>
        
        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input placeholder="Enter your full name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input placeholder="your.email@company.com" disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timezone</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="america/new_york">America/New_York</SelectItem>
                        <SelectItem value="america/los_angeles">America/Los_Angeles</SelectItem>
                        <SelectItem value="europe/london">Europe/London</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button variant="brand">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Microsoft Outlook
                  </CardTitle>
                  <CardDescription>
                    Connect your Microsoft Outlook account to sync emails and calendar events
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                      <Badge variant="status">Healthy</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </Button>
                      <Button variant="outline" size="sm">
                        Disconnect
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t">
                    <div className="text-sm font-medium">Permissions & Scopes</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Read emails</span>
                        <Badge variant="outline">Mail.Read</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Send emails</span>
                        <Badge variant="outline">Mail.Send</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Calendar access</span>
                        <Badge variant="outline">Calendars.ReadWrite</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Offline access</span>
                        <Badge variant="outline">offline_access</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="text-sm font-medium">Health Check</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Token valid and refreshed recently</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Webhook subscription active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Data sync operational</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Google Gmail
                    <Badge variant="secondary">Coming Soon</Badge>
                  </CardTitle>
                  <CardDescription>
                    Connect your Google account to sync Gmail and Google Calendar (feature flagged)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Feature Flag Required</span>
                      </div>
                    </div>
                    <Button variant="outline" disabled>
                      Connect Google
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Authenticator App</div>
                        <div className="text-sm text-[var(--muted-foreground)]">
                          TOTP enabled • Last used 2 hours ago
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="status">Enabled</Badge>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Backup Codes</div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      8 unused backup codes remaining
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View Codes</Button>
                      <Button variant="outline" size="sm">Generate New</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Active Sessions
                  </CardTitle>
                  <CardDescription>
                    Manage your active login sessions and devices
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      device: "Chrome on Windows",
                      location: "New York, US",
                      ip: "192.168.1.100",
                      lastActive: "Current session",
                      isCurrent: true
                    },
                    {
                      device: "Safari on iPhone",
                      location: "New York, US", 
                      ip: "203.0.113.42",
                      lastActive: "2 hours ago",
                      isCurrent: false
                    },
                    {
                      device: "Chrome on MacBook",
                      location: "Boston, US",
                      ip: "198.51.100.10", 
                      lastActive: "1 day ago",
                      isCurrent: false
                    }
                  ].map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          💻
                        </div>
                        <div>
                          <div className="font-medium">{session.device}</div>
                          <div className="text-sm text-[var(--muted-foreground)]">
                            {session.location} • {session.ip}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {session.lastActive}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.isCurrent ? (
                          <Badge variant="status">Current</Badge>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-red-600">
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full">
                    Revoke All Other Sessions
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Data Encryption
                  </CardTitle>
                  <CardDescription>
                    Manage encryption keys and data protection settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">KMS Provider</div>
                        <div className="text-xs text-[var(--muted-foreground)]">AWS KMS</div>
                      </div>
                      <Badge variant="status">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">DEK Version</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Last rotated 30 days ago</div>
                      </div>
                      <Button variant="outline" size="sm">Rotate Key</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Retention</CardTitle>
                  <CardDescription>Configure how long data is stored</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Retention Period</label>
                    <Select defaultValue="90">
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Next purge scheduled for March 15, 2024
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <a href="/app/audit-log" className="inline-flex items-center gap-2">
                      View Audit Log
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>Manage your organization details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organization Name</label>
                  <Input placeholder="Enter organization name" />
                </div>
                <Button variant="brand">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Manage team members, roles, and invitations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Members list, roles, invites, and SSO configuration will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription details and usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                  <div>
                    <div className="font-semibold text-lg">Professional Plan</div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      $49/month • Billed monthly
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Active
                    </Badge>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">
                      Renews Feb 15, 2024
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Users</div>
                    <div className="text-2xl font-bold">3 <span className="text-sm font-normal text-[var(--muted-foreground)]">/ 10</span></div>
                    <div className="w-full bg-[var(--muted)] rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '30%'}}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Email Storage</div>
                    <div className="text-2xl font-bold">2.1 <span className="text-sm font-normal text-[var(--muted-foreground)]">/ 100 GB</span></div>
                    <div className="w-full bg-[var(--muted)] rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '2.1%'}}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">AI Requests</div>
                    <div className="text-2xl font-bold">847 <span className="text-sm font-normal text-[var(--muted-foreground)]">/ 5,000</span></div>
                    <div className="w-full bg-[var(--muted)] rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{width: '17%'}}></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline">Add Users</Button>
                  <Button variant="ghost" className="text-red-600">Cancel Subscription</Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Manage your payment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      💳
                    </div>
                    <div>
                      <div className="font-medium">•••• •••• •••• 4242</div>
                      <div className="text-sm text-[var(--muted-foreground)]">Expires 12/25</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm">Remove</Button>
                  </div>
                </div>
                
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>Download invoices and view payment history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: "Jan 15, 2024", amount: "$49.00", status: "Paid", invoice: "INV-2024-001" },
                    { date: "Dec 15, 2023", amount: "$49.00", status: "Paid", invoice: "INV-2023-012" },
                    { date: "Nov 15, 2023", amount: "$49.00", status: "Paid", invoice: "INV-2023-011" },
                    { date: "Oct 15, 2023", amount: "$49.00", status: "Paid", invoice: "INV-2023-010" }
                  ].map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-b-0">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium">{invoice.invoice}</div>
                          <div className="text-sm text-[var(--muted-foreground)]">{invoice.date}</div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={invoice.status === "Paid" ? "bg-green-100 text-green-700" : ""}
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{invoice.amount}</span>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4">
                  <Button variant="outline">View All Invoices</Button>
                </div>
              </CardContent>
            </Card>

            {/* Usage Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Analytics</CardTitle>
                <CardDescription>Track your feature usage over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">This Month</div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Emails Processed</span>
                        <span className="text-sm font-medium">1,247</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">AI Requests</span>
                        <span className="text-sm font-medium">847</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Leads Created</span>
                        <span className="text-sm font-medium">23</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Contacts Added</span>
                        <span className="text-sm font-medium">45</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Last 30 Days</div>
                    <div className="h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-sm text-[var(--muted-foreground)]">
                      Usage Chart Placeholder
                    </div>
                  </div>
                </div>
                
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Detailed Analytics
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>View security and activity logs</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <a href="/app/audit-log" className="inline-flex items-center gap-2">
                    View Full Audit Log
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help">
            <Card>
              <CardHeader>
                <CardTitle>Help & Support</CardTitle>
                <CardDescription>Get help and access documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Documentation links, support contact, and help resources.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}


