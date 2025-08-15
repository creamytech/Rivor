"use client";

import { useState } from "react";
import { Bell, Search, Settings, User, Mail, Calendar, PieChart, Users, MessageSquare, Plus, MoreHorizontal, ArrowRight, TrendingUp, Clock, Star, Archive, Send, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/branding/Logo";

// Mock data for demo
const mockThreads = [
  {
    id: "1",
    subject: "RE: Property Inquiry - 123 Main Street",
    participants: "John Smith, Sarah Chen",
    lastMessage: "Hi there! I'm very interested in the 123 Main Street property. Could we schedule a viewing this weekend?",
    time: "2 hours ago",
    unread: true,
    priority: "high",
    attachments: 2
  },
  {
    id: "2", 
    subject: "Quarterly Budget Review Meeting",
    participants: "Mike Johnson, Team",
    lastMessage: "Please review the Q4 budget proposals before our meeting tomorrow at 2 PM.",
    time: "5 hours ago",
    unread: false,
    priority: "medium",
    attachments: 1
  },
  {
    id: "3",
    subject: "Welcome to Our Premium Service!",
    participants: "Premium Support",
    lastMessage: "Thank you for upgrading! Here's everything you need to know about your new features.",
    time: "1 day ago",
    unread: false,
    priority: "low",
    attachments: 0
  }
];

const mockLeads = [
  {
    id: "1",
    name: "Acme Corporation",
    contact: "John Doe",
    email: "john@acme.com", 
    value: "$50,000",
    stage: "Proposal",
    probability: 75,
    lastActivity: "Called yesterday",
    source: "Website"
  },
  {
    id: "2",
    name: "Tech Startup Inc",
    contact: "Jane Smith", 
    email: "jane@techstartup.com",
    value: "$25,000",
    stage: "Negotiation",
    probability: 60,
    lastActivity: "Email sent",
    source: "Referral"
  },
  {
    id: "3",
    name: "Global Enterprises",
    contact: "Bob Wilson",
    email: "bob@global.com",
    value: "$100,000", 
    stage: "Qualified",
    probability: 40,
    lastActivity: "Demo scheduled",
    source: "LinkedIn"
  }
];

const mockContacts = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@company.com",
    company: "Johnson & Associates",
    phone: "(555) 123-4567",
    lastContact: "2 days ago",
    tags: ["VIP", "Referral Source"]
  },
  {
    id: "2", 
    name: "Michael Chen",
    email: "m.chen@techcorp.com",
    company: "TechCorp Industries",
    phone: "(555) 987-6543", 
    lastContact: "1 week ago",
    tags: ["Decision Maker", "Tech"]
  }
];

export default function DemoPage() {
  const [selectedThread, setSelectedThread] = useState(mockThreads[0]);
  const [activeTab, setActiveTab] = useState("inbox");
  const [showAISummary, setShowAISummary] = useState(false);

  const demoNav = [
    { id: "inbox", label: "Inbox", icon: Mail, count: 3 },
    { id: "pipeline", label: "Pipeline", icon: PieChart, count: 12 },
    { id: "contacts", label: "Contacts", icon: Users, count: 24 },
    { id: "chat", label: "AI Chat", icon: MessageSquare, count: 0 },
    { id: "analytics", label: "Analytics", icon: TrendingUp, count: 0 }
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Demo Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Logo />
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <Sparkles className="h-3 w-3 mr-1" />
              DEMO MODE
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Search anything... (⌘K)</span>
            </div>
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-4 space-y-2">
            {demoNav.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeTab === item.id 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count > 0 && (
                  <Badge variant="secondary" className="h-5 text-xs">
                    {item.count}
                  </Badge>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            
            {/* Inbox Tab */}
            <TabsContent value="inbox" className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Inbox</h1>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Compose
                  </Button>
                  <Button variant="outline" size="sm">
                    <Bot className="h-4 w-4 mr-1" />
                    AI Draft
                  </Button>
                </div>
              </div>

              <div className="grid lg:grid-cols-[400px_1fr] gap-6">
                {/* Thread List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Email Threads</CardTitle>
                    <CardDescription>Manage your conversations</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-1">
                      {mockThreads.map((thread) => (
                        <div
                          key={thread.id}
                          onClick={() => setSelectedThread(thread)}
                          className={`p-4 cursor-pointer transition-colors border-l-4 ${
                            selectedThread.id === thread.id
                              ? "bg-blue-50 border-l-blue-500 dark:bg-blue-950"
                              : "border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-medium truncate ${thread.unread ? "text-black dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                                  {thread.subject}
                                </p>
                                {thread.unread && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                              </div>
                              <p className="text-xs text-gray-500 truncate mt-1">{thread.participants}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                {thread.lastMessage}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 ml-2">
                              <span className="text-xs text-gray-500">{thread.time}</span>
                              {thread.attachments > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {thread.attachments} files
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Thread Content */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{selectedThread.subject}</CardTitle>
                        <CardDescription>{selectedThread.participants}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">John Smith</span>
                        <span className="text-sm text-gray-500">{selectedThread.time}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedThread.lastMessage}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowAISummary(!showAISummary)}
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                      >
                        <Bot className="h-4 w-4" />
                        {showAISummary ? "Hide" : "Show"} AI Summary
                      </Button>
                      <Button variant="outline" size="sm">
                        <Send className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                    </div>

                    {showAISummary && (
                      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            AI Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="font-medium">Key Points:</p>
                              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 ml-2">
                                <li>Property inquiry for 123 Main Street</li>
                                <li>Customer interested in weekend viewing</li>
                                <li>High priority lead - respond quickly</li>
                              </ul>
                            </div>
                            <div>
                              <p className="font-medium">Suggested Actions:</p>
                              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 ml-2">
                                <li>Schedule property viewing</li>
                                <li>Send property details and pricing</li>
                                <li>Add to CRM as hot lead</li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Pipeline Tab */}
            <TabsContent value="pipeline" className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Sales Pipeline</h1>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Lead
                </Button>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {["Qualified", "Proposal", "Negotiation"].map((stage) => (
                  <Card key={stage}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {stage}
                        <Badge variant="outline">
                          {mockLeads.filter(lead => lead.stage === stage).length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {mockLeads
                        .filter(lead => lead.stage === stage)
                        .map((lead) => (
                          <div key={lead.id} className="border rounded-lg p-3 bg-white dark:bg-gray-800 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{lead.name}</h4>
                              <span className="text-sm font-medium text-green-600">{lead.value}</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{lead.contact}</p>
                            <p className="text-xs text-gray-500">{lead.email}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">{lead.lastActivity}</span>
                              <Badge variant="outline" className="text-xs">
                                {lead.probability}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Contacts</h1>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Contact
                </Button>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {mockContacts.map((contact) => (
                  <Card key={contact.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{contact.name}</CardTitle>
                          <CardDescription>{contact.company}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{contact.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">📞</span>
                          <span>{contact.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>Last contact: {contact.lastContact}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {contact.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* AI Chat Tab */}
            <TabsContent value="chat" className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">AI Assistant</h1>
              </div>

              <Card className="max-w-4xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Chat with your AI Assistant
                  </CardTitle>
                  <CardDescription>
                    Ask questions about your data, get insights, or request help with tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-w-md">
                        <p className="text-sm">Hi! I'm your AI assistant. I can help you with:</p>
                        <ul className="text-sm list-disc list-inside mt-2 text-gray-600 dark:text-gray-400">
                          <li>Summarizing email threads</li>
                          <li>Drafting professional emails</li>
                          <li>Analyzing your pipeline</li>
                          <li>Finding contact information</li>
                          <li>Scheduling and reminders</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 justify-end">
                      <div className="bg-blue-500 text-white rounded-lg p-3 max-w-md">
                        <p className="text-sm">Can you help me draft a follow-up email for the property inquiry?</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-w-md">
                        <p className="text-sm">I'd be happy to help! Based on the property inquiry from John Smith, here's a professional follow-up email draft:</p>
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          <strong>Subject:</strong> RE: Property Viewing - 123 Main Street<br/><br/>
                          <strong>Dear John,</strong><br/><br/>
                          Thank you for your interest in 123 Main Street. I'd be delighted to arrange a viewing this weekend...
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <input 
                      type="text" 
                      placeholder="Ask me anything..." 
                      className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                      disabled
                    />
                    <Button disabled>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Analytics</h1>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">$175,000</div>
                    <p className="text-sm text-gray-500">+12% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active Leads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">12</div>
                    <p className="text-sm text-gray-500">3 new this week</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Conversion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">68%</div>
                    <p className="text-sm text-gray-500">+5% improvement</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Performance</CardTitle>
                  <CardDescription>Revenue by stage over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    📊 Interactive charts would appear here in the real app
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </main>
      </div>

      {/* Demo Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 text-center">
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            ✨ DEMO DATA ONLY
          </Badge>
          <span>This is a preview with mock data.</span>
          <Button variant="link" size="sm" className="h-auto p-0 text-blue-600">
            Sign up for real access →
          </Button>
        </div>
      </footer>
    </div>
  );
}


