"use client";
import AppShell from "@/components/app/AppShell";
import EnhancedChat from "@/components/chat/EnhancedChat";
import PageHeader from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ExternalLink, Bot } from "lucide-react";

export default function ChatPage() {
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

        {/* Page-specific content moved back to page */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)98%,transparent)]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <span>Context:</span>
              <a href="#" className="text-[var(--foreground)] hover:underline flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Thread #1234 - Property Inquiry
              </a>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300 flex items-center gap-1">
              <Bot className="h-3 w-3" />
              Writes back
            </Badge>
          </div>
        </div>

        {/* Enhanced Chat Component */}
        <div className="px-6 pb-8">
          <EnhancedChat />
        </div>
      </AppShell>
    </div>
  );
}
