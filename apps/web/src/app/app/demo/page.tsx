"use client";
import AppShell from "@/components/app/AppShell";
import PageHeader from "@/components/app/PageHeader";
import SegmentedControl from "@/components/app/SegmentedControl";
import Toolbar, { ToolbarGroup, ToolbarItem } from "@/components/app/Toolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Mail, 
  Briefcase, 
  Calendar, 
  Users, 
  MessageSquare,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import { useState } from "react";

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabOptions = [
    { value: "overview", label: "Overview" },
    { value: "analytics", label: "Analytics" },
    { value: "settings", label: "Settings" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppShell>
        <PageHeader
          title="UI Improvements Demo"
          subtitle="Showcasing the new global header polish and page-specific enhancements"
          icon={<BarChart3 className="h-6 w-6" />}
          metaChips={[
            { label: "Last updated", value: "2h ago", color: "blue" },
            { label: "Status", value: "Active", color: "green" }
          ]}
          primaryAction={{
            label: "Create New",
            onClick: () => console.log("Create new"),
            icon: <Plus className="h-4 w-4" />
          }}
          secondaryActions={[
            {
              label: "More options",
              onClick: () => console.log("More options"),
              icon: <MoreHorizontal className="h-4 w-4" />
            }
          ]}
          gradientColors={{
            from: "from-blue-600/12",
            via: "via-indigo-600/12",
            to: "to-purple-600/12"
          }}
        >
          <SegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={setActiveTab}
          />
        </PageHeader>

        <Toolbar>
          <div className="flex items-center justify-between w-full">
            <ToolbarGroup>
              <ToolbarItem>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 bg-[var(--muted)] border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:border-transparent w-64"
                  />
                </div>
              </ToolbarItem>
              
              <ToolbarItem>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
            
            <ToolbarGroup>
              <ToolbarItem>
                <Button variant="outline" size="sm">
                  Export
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          </div>
        </Toolbar>

        <div className="px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Features Showcase */}
            <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
              <h2 className="text-xl font-semibold mb-4">Global Header Polish</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Condenses on scroll (56-64px)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Unified anatomy (left/center/right)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Meta chips under title</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Reduced gradient saturation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Page icon for recognition</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Sticky tabs/filters below</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Consistent spacing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Primary CTA + secondary icons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Subtle river drift animation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Backdrop blur effects</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Page-Specific Improvements */}
            <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
              <h2 className="text-xl font-semibold mb-4">Page-Specific Enhancements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Dashboard</span>
                  </div>
                  <ul className="text-sm space-y-1 text-[var(--muted-foreground)]">
                    <li>• Shorter greeting bar</li>
                    <li>• Stat cards first row</li>
                    <li>• 7-day delta chips</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Inbox</span>
                  </div>
                  <ul className="text-sm space-y-1 text-[var(--muted-foreground)]">
                    <li>• Sticky segmented control</li>
                    <li>• Saved filters dropdown</li>
                    <li>• Leads/Review/Other tabs</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Pipeline</span>
                  </div>
                  <ul className="text-sm space-y-1 text-[var(--muted-foreground)]">
                    <li>• Trimmed header height</li>
                    <li>• Sticky search/filter toolbar</li>
                    <li>• Board breathing room</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium">Calendar</span>
                  </div>
                  <ul className="text-sm space-y-1 text-[var(--muted-foreground)]">
                    <li>• Kebab menu for settings</li>
                    <li>• Today/Week/Day/Agenda</li>
                    <li>• Import ICS option</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Contacts</span>
                  </div>
                  <ul className="text-sm space-y-1 text-[var(--muted-foreground)]">
                    <li>• Orange accent maintained</li>
                    <li>• Segments dropdown</li>
                    <li>• Merge banner positioning</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-teal-500" />
                    <span className="font-medium">Chat</span>
                  </div>
                  <ul className="text-sm space-y-1 text-[var(--muted-foreground)]">
                    <li>• Context breadcrumb</li>
                    <li>• "Writes back" badge</li>
                    <li>• Thread link integration</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Interactive Demo */}
            <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
              <h2 className="text-xl font-semibold mb-4">Interactive Features</h2>
              <div className="space-y-4">
                <p className="text-[var(--muted-foreground)]">
                  Try scrolling to see the header condense, and explore the different page layouts above.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Recent Activity
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  );
}
