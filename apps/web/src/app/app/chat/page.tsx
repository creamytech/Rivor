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

        {/* Enhanced Context and Controls Bar */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)98%,transparent)]">
          <div className="flex items-center justify-between">
            {/* Left: Context and AI Status */}
            <div className="flex items-center gap-4">
              {/* Enhanced Context Display */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Context:</span>
                  <a 
                    href="#" 
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1 font-medium"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Thread #1234 - Property Inquiry
                  </a>
                </div>
                
                {/* AI Status Badge */}
                <Badge 
                  variant="outline" 
                  className={`${aiStatusDisplay.color} border-current flex items-center gap-1`}
                >
                  <Bot className="h-3 w-3" />
                  {aiStatusDisplay.text}
                </Badge>
              </div>
            </div>
            
            {/* Right: Actions */}
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

          {/* Conversation History */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Recent conversations:</span>
            <div className="flex items-center gap-2">
              {conversationHistory.map((conversation, index) => (
                <Button
                  key={conversation.id}
                  variant={conversation.active ? "default" : "outline"}
                  size="sm"
                  onClick={() => console.log(`Switch to conversation: ${conversation.title}`)}
                  className="text-xs h-7"
                >
                  {conversation.title}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Chat Component */}
        <div className="px-6 pb-8">
          <EnhancedChat 
            aiStatus={aiStatus}
            onStatusChange={setAiStatus}
          />
        </div>
      </AppShell>
    </div>
  );
}
