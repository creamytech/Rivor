"use client";
import AppShell from "@/components/app/AppShell";
import EnhancedPipelineBoard from "@/components/pipeline/EnhancedPipelineBoard";
import PageHeader from "@/components/app/PageHeader";
import Toolbar, { ToolbarGroup, ToolbarItem } from "@/components/app/Toolbar";
import { Button } from "@/components/ui/button";
import { Briefcase, Search, Filter, Group, Plus } from "lucide-react";

export default function PipelinePage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppShell>
        <PageHeader
          title="Deal Flow"
          subtitle="Track and manage your sales pipeline with visual boards and analytics"
          icon={<Briefcase className="h-6 w-6" />}
          metaChips={[
            { label: "Active deals", value: "24", color: "green" },
            { label: "Total value", value: "$2.4M", color: "blue" }
          ]}
          primaryAction={{
            label: "Add Deal",
            onClick: () => console.log("Add deal"),
            icon: <Plus className="h-4 w-4" />
          }}
          gradientColors={{
            from: "from-green-600/12",
            via: "via-emerald-600/12",
            to: "to-teal-600/12"
          }}
        />

        {/* Sticky Toolbar */}
        <Toolbar>
          <div className="flex items-center justify-between w-full">
            <ToolbarGroup>
              <ToolbarItem>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    placeholder="Search deals..."
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
              
              <ToolbarItem>
                <Button variant="outline" size="sm">
                  <Group className="h-4 w-4 mr-2" />
                  Group by
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

        {/* Enhanced Pipeline Board */}
        <div className="px-6 pb-8">
          <EnhancedPipelineBoard />
        </div>
      </AppShell>
    </div>
  );
}


