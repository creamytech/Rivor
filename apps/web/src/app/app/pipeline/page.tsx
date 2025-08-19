"use client";
import AppShell from "@/components/app/AppShell";
import EnhancedPipelineBoard from "@/components/pipeline/EnhancedPipelineBoard";
import Toolbar, { ToolbarGroup, ToolbarItem } from "@/components/app/Toolbar";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Search,
  Filter,
  Group,
  Plus,
  Download,
  Upload,
  Settings,
  BarChart3,
  Calendar,
  DollarSign,
  User,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PipelinePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState("stage");
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/summary?context=pipeline');
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      setSummary('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const quickFilters = [
    { label: "High Value", count: 12, active: false },
    { label: "Overdue", count: 3, active: false },
    { label: "This Week", count: 8, active: false },
    { label: "Hot Leads", count: 5, active: false }
  ];

  const groupByOptions = [
    { value: "stage", label: "Stage", icon: <BarChart3 className="h-4 w-4" /> },
    { value: "owner", label: "Owner", icon: <User className="h-4 w-4" /> },
    { value: "value", label: "Value", icon: <DollarSign className="h-4 w-4" /> },
    { value: "date", label: "Date", icon: <Calendar className="h-4 w-4" /> }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppShell>
        {/* Enhanced Sticky Toolbar */}
        <div className="sticky top-[calc(56px+80px)] z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-[var(--border)]">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between w-full">
              {/* Left Group - Search and Filters */}
              <ToolbarGroup>
                <ToolbarItem>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search deals, contacts, or companies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-80"
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
              
              {/* Right Group - Actions */}
              <ToolbarGroup>
                <ToolbarItem>
                  <Button variant="outline" size="sm" onClick={fetchSummary} disabled={loading}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {loading ? 'Summarizing...' : 'AI Summary'}
                  </Button>
                </ToolbarItem>

                <ToolbarItem>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </ToolbarItem>

                <ToolbarItem>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </ToolbarItem>

                <ToolbarItem>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-muted-foreground mr-2">Quick filters:</span>
              {quickFilters.map((filter, index) => (
                <Button
                  key={index}
                  variant={filter.active ? "default" : "outline"}
                  size="sm"
                  onClick={() => console.log(`Apply filter: ${filter.label}`)}
                  className="text-xs h-7"
                >
                  {filter.label}
                  <span className="ml-1 text-xs opacity-70">({filter.count})</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Pipeline Board */}
        <div className="px-6 pb-8">
          {summary && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm">AI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">{summary}</p>
              </CardContent>
            </Card>
          )}
          <EnhancedPipelineBoard searchQuery={searchQuery} groupBy={groupBy} />
        </div>
      </AppShell>
    </div>
  );
}


