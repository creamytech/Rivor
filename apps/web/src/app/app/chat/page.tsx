"use client";
import AppShell from "@/components/app/AppShell";
import EnhancedChat from "@/components/chat/EnhancedChat";
import PageHeader from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  ExternalLink, 
  Bot, 
  Plus,
  History,
  Settings,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export default function ChatPage() {
  const [aiStatus, setAiStatus] = useState<'idle' | 'thinking' | 'processing'>('idle');
  const [conversationHistory, setConversationHistory] = useState([
    { id: '1', title: 'Property Inquiry - TechCorp', active: false },
    { id: '2', title: 'Lead Follow-up - Acme Corp', active: false },
    { id: '3', title: 'Meeting Scheduling - StartupXYZ', active: false }
  ]);

  const getAiStatusDisplay = () => {
    switch (aiStatus) {
      case 'thinking':
        return {
          icon: <Clock className="h-3 w-3 animate-pulse" />,
          text: 'AI is thinking...',
          color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
        };
      case 'processing':
        return {
          icon: <Sparkles className="h-3 w-3 animate-spin" />,
          text: 'Processing...',
          color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
        };
      default:
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'AI Active',
          color: 'text-green-600 bg-green-100 dark:bg-green-900/20'
        };
    }
  };

  const aiStatusDisplay = getAiStatusDisplay();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppShell>
        <PageHeader
          title="AI Assistant"
          subtitle="Get help with emails, leads, calendar events, and tasks using AI-powered tools"
          icon={<MessageSquare className="h-6 w-6" />}
          metaChips={[
            { label: "Context", value: "Thread #1234", color: "teal" },
            { label: "Status", value: "Active", color: "green" }
          ]}
          primaryAction={{
            label: "New Chat",
            onClick: () => console.log("New chat"),
            icon: <Plus className="h-4 w-4" />
          }}
          secondaryActions={[
            {
              label: "View Thread",
              onClick: () => console.log("View thread"),
              icon: <ExternalLink className="h-4 w-4" />
            }
          ]}
          gradientColors={{
            from: "from-teal-600/12",
            via: "via-cyan-600/12",
            to: "to-blue-600/12"
          }}
        />

        {/* Enhanced Context Breadcrumbs */}
        <div className="px-6 py-3 border-b border-[var(--border)] bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10">
          <div className="flex items-center justify-between">
            {/* Left: Enhanced Context Breadcrumbs */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Context:</span>
                <nav className="flex items-center gap-1">
                  <a href="/app/contacts" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline transition-colors">
                    Sarah Johnson
                  </a>
                  <span>→</span>
                  <a href="/app/pipeline" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline transition-colors">
                    Pipeline Deal
                  </a>
                  <span>→</span>
                  <a href="/app/inbox" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline transition-colors">
                    Email Thread
                  </a>
                  <span>→</span>
                  <span className="text-foreground font-medium">AI Assistant</span>
                </nav>
              </div>
            </div>
            
            {/* Right: AI Status and Actions */}
            <div className="flex items-center gap-3">
              {/* AI Status Badge */}
              <Badge 
                variant="outline" 
                className={`${aiStatusDisplay.color} border-current flex items-center gap-1`}
              >
                {aiStatusDisplay.icon}
                {aiStatusDisplay.text}
              </Badge>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Personalized Quick-Start Section */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10 border-b border-[var(--border)]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">Ready to Help You Today</h3>
            </div>
            
            {/* Personalized Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start gap-2 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
                onClick={() => console.log('Draft follow-up emails')}
              >
                <div className="flex items-center gap-2 w-full">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Draft Follow-ups</span>
                  <Badge variant="destructive" className="ml-auto text-xs h-5">12</Badge>
                </div>
                <p className="text-xs text-muted-foreground text-left">12 leads need follow-up emails - I can draft them for you</p>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start gap-2 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
                onClick={() => console.log('Schedule showings')}
              >
                <div className="flex items-center gap-2 w-full">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">Schedule Showings</span>
                  <Badge variant="secondary" className="ml-auto text-xs h-5">5</Badge>
                </div>
                <p className="text-xs text-muted-foreground text-left">5 property inquiries ready for showing appointments</p>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start gap-2 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
                onClick={() => console.log('Market analysis')}
              >
                <div className="flex items-center gap-2 w-full">
                  <Activity className="h-4 w-4 text-purple-500" />
                  <span className="font-medium text-sm">Market Analysis</span>
                  <Badge variant="outline" className="ml-auto text-xs h-5">New</Badge>
                </div>
                <p className="text-xs text-muted-foreground text-left">Generate reports for 3 active listings in your area</p>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area with AI Toolbox */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 px-6 py-4 overflow-hidden">
              <EnhancedChat 
                aiStatus={aiStatus}
                onStatusChange={setAiStatus}
              />
            </div>
          </div>
          
          {/* AI Toolbox Sidebar */}
          <div className="w-80 border-l border-[var(--border)] bg-gradient-to-b from-slate-50/50 to-blue-50/30 dark:from-slate-900/50 dark:to-slate-800/30">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Bot className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-lg">AI Toolbox</h3>
              </div>
              
              {/* Quick Actions Section */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">QUICK ACTIONS</h4>
                  <div className="space-y-2">
                    <Button variant="ghost" size="sm" className="w-full justify-start h-auto py-2">
                      <Mail className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Draft Email</div>
                        <div className="text-xs text-muted-foreground">AI-powered email writing</div>
                      </div>
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-auto py-2">
                      <CheckCircle className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Create Task</div>
                        <div className="text-xs text-muted-foreground">Smart task suggestions</div>
                      </div>
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-auto py-2">
                      <Calendar className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Schedule Meeting</div>
                        <div className="text-xs text-muted-foreground">Find optimal meeting times</div>
                      </div>
                    </Button>
                  </div>
                </div>
                
                {/* What I Can Do Section */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">WHAT I CAN DO</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                        <div>
                          <div className="font-medium text-xs">Lead Analysis</div>
                          <div className="text-xs text-muted-foreground">Analyze lead quality and suggest next actions</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500 mt-0.5" />
                        <div>
                          <div className="font-medium text-xs">Content Generation</div>
                          <div className="text-xs text-muted-foreground">Create property descriptions and marketing copy</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border">
                      <div className="flex items-start gap-2">
                        <Activity className="h-4 w-4 text-green-500 mt-0.5" />
                        <div>
                          <div className="font-medium text-xs">Pipeline Insights</div>
                          <div className="text-xs text-muted-foreground">Identify bottlenecks and optimization opportunities</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Suggested Actions */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">SUGGESTED FOR YOU</h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                      Reply to Sarah's inquiry
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                      Schedule Oak St showing
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      Log meeting notes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  );
}
