"use client";
import AppShell from "@/components/app/AppShell";
import PageHeader from "@/components/app/PageHeader";
import SegmentedControl from "@/components/app/SegmentedControl";
import Toolbar, { ToolbarGroup, ToolbarItem } from "@/components/app/Toolbar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <AppShell>
        <PageHeader
          title="UI Improvements Demo"
          subtitle="Showcasing the simplified header and balanced page content"
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
        />

        {/* Page-specific content moved back to page */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <SegmentedControl
              options={tabOptions}
              value={activeTab}
              onChange={setActiveTab}
            />
          </div>
        </div>

        {/* Page toolbar */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)98%,transparent)]">
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
        </div>

        <div className="px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Simplified Header Features */}
            <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
              <h2 className="text-xl font-semibold mb-4">Simplified Header Design</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Minimal header with core info only</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Title, subtitle, meta chips, actions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Page-specific content moved to page</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Better balance between header and content</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Reduced repetitive UI code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">More substantial page content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Cleaner separation of concerns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Easier to maintain and extend</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Page-Specific Improvements */}
            <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
              <h2 className="text-xl font-semibold mb-4">Page Content Structure</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Inbox</span>
                  </div>
                  <ul className="text-sm space-y-1 text-[var(--muted-foreground)]">
                    <li>• Segmented controls in page</li>
                    <li>• Saved filters dropdown</li>
                    <li>• Clean header with meta info</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Pipeline</span>
                  </div>
                  <ul className="text-sm space-y-1 text-[var(--muted-foreground)]">
                    <li>• Search/filter toolbar in page</li>
                    <li>• Board breathing room</li>
                    <li>• Simple header with stats</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium">Calendar</span>
                  </div>
                  <ul className="text-sm space-y-1 text-[var(--muted-foreground)]">
                    <li>• View controls in page</li>
                    <li>• Kebab menu for settings</li>
                    <li>• Minimal header design</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Contacts</span>
                  </div>
                  <ul className="text-sm space-y-1 text-[var(--muted-foreground)]">
                    <li>• Segments dropdown in page</li>
                    <li>• Merge banner positioning</li>
                    <li>• Orange accent maintained</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-teal-500" />
                    <span className="font-medium">Chat</span>
                  </div>
                  <ul className="text-sm space-y-1 text-[var(--muted-foreground)]">
                    <li>• Context breadcrumb in page</li>
                    <li>• "Writes back" badge</li>
                    <li>• Clean header structure</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Dashboard</span>
                  </div>
                  <ul className="text-sm space-y-1 text-[var(--muted-foreground)]">
                    <li>• Stat cards first row</li>
                    <li>• 7-day delta chips</li>
                    <li>• Shorter greeting bar</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Interactive Demo */}
            <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
              <h2 className="text-xl font-semibold mb-4">Improved Balance</h2>
              <div className="space-y-4">
                <p className="text-[var(--muted-foreground)]">
                  The header now focuses on essential information while page-specific controls and content live where they belong - in the page itself. This creates a better balance and reduces repetitive UI code.
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
  );
}
