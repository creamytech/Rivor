"use client";
import { useState, useEffect } from 'react';
import AppShell from "@/components/app/AppShell";
import EnhancedInbox from "@/components/inbox/EnhancedInbox";
import SegmentedControl from "@/components/app/SegmentedControl";
import Toolbar, { ToolbarGroup, ToolbarItem } from "@/components/app/Toolbar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Filter,
  Bookmark,
  Search,
  MoreHorizontal,
  Star,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState("leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/summary?context=inbox');
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      setSummary('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const [tabOptions, setTabOptions] = useState([
    { value: "leads", label: "Leads", count: 0, icon: <Star className="h-3 w-3" /> },
    { value: "review", label: "Review", count: 0, icon: <AlertTriangle className="h-3 w-3" /> },
    { value: "other", label: "Other", count: 0, icon: <Mail className="h-3 w-3" /> }
  ]);

  const savedFilters = [
    { id: "high-priority", label: "High Priority Leads", icon: <AlertTriangle className="h-3 w-3" /> },
    { id: "follow-up", label: "Follow-up Required", icon: <Clock className="h-3 w-3" /> },
    { id: "new-inquiries", label: "New Inquiries", icon: <Star className="h-3 w-3" /> },
    { id: "meeting-requests", label: "Meeting Requests", icon: <CheckCircle className="h-3 w-3" /> }
  ];

  const [quickFilters, setQuickFilters] = useState([
    { id: "unread", key: "unread", label: "Unread", count: 0, active: false },
    { id: "high-priority", key: "highPriority", label: "High Priority", count: 0, active: false },
    { id: "this-week", key: "thisWeek", label: "This Week", count: 0, active: false },
    { id: "overdue", key: "overdue", label: "Overdue", count: 0, active: false }
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/inbox/stats");
        if (response.ok) {
          const data = await response.json();
          if (data.tabs) {
            setTabOptions((prev) =>
              prev.map((t) => ({ ...t, count: data.tabs[t.value] ?? 0 }))
            );
          }
          if (data.quickFilters) {
            setQuickFilters((prev) =>
              prev.map((f) => ({ ...f, count: data.quickFilters[f.key] ?? 0 }))
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch inbox stats:", error);
      }
    };

    fetchStats();
  }, []);

  const handleQuickFilter = (id: string) => {
    setQuickFilters((prev) =>
      prev.map((f) => ({ ...f, active: f.id === id ? !f.active : false }))
    );
    setSelectedFilter((prev) => (prev === id ? null : id));
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppShell>
        {/* Enhanced Search and Filter Bar */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)98%,transparent)]">
          <div className="flex items-center gap-4">
            {/* Enhanced Segmented Control */}
            <SegmentedControl
              options={tabOptions}
              value={activeTab}
              onChange={setActiveTab}
              className="flex-shrink-0"
            />
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search emails, contacts, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

          {/* Saved Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Saved Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {savedFilters.map((filter) => (
                <DropdownMenuItem
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className="flex items-center gap-2"
                >
                  {filter.icon}
                  {filter.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={fetchSummary} disabled={loading}>
            <Sparkles className="h-4 w-4 mr-2" />
            {loading ? 'Summarizing...' : 'AI Summary'}
          </Button>
        </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-muted-foreground mr-2">Quick filters:</span>
            {quickFilters.map((filter) => (
              <Button
                key={filter.id}
                variant={filter.active ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickFilter(filter.id)}
                className="text-xs h-7"
              >
                {filter.label}
                <span className="ml-1 text-xs opacity-70">({filter.count})</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Enhanced Inbox Component */}
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
          <EnhancedInbox
            activeTab={activeTab}
            searchQuery={searchQuery}
            selectedFilter={selectedFilter}
          />
        </div>
      </AppShell>
    </div>
  );
}


