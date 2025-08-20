"use client";
import { useState, useEffect } from 'react';
import AppShell from "@/components/app/AppShell";
import EnhancedRealEstateInbox from "@/components/inbox/EnhancedRealEstateInbox";
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
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [quickFilters, setQuickFilters] = useState([
    { label: "Unread", count: 24, active: false },
    { label: "High Priority", count: 8, active: false },
    { label: "This Week", count: 45, active: false },
    { label: "Overdue", count: 3, active: false }
  ]);

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

  const handleQuickFilter = (label: string) => {
    setQuickFilters((prev) =>
      prev.map((filter) =>
        filter.label === label
          ? { ...filter, active: !filter.active }
          : { ...filter, active: false }
      )
    );
    setSelectedFilter((current) => (current === label ? null : label));
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
                    onClick={() => {
                      setSelectedFilter(filter.id);
                      setQuickFilters((prev) =>
                        prev.map((f) => ({ ...f, active: false }))
                      );
                    }}
                    className="flex items-center gap-2"
                  >
                    {filter.icon}
                    {filter.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-muted-foreground mr-2">Quick filters:</span>
            {quickFilters.map((filter) => (
              <Button
                key={filter.label}
                variant={filter.active ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickFilter(filter.label)}
                className="text-xs h-7"
              >
                {filter.label}
                <span className="ml-1 text-xs opacity-70">({filter.count})</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Enhanced Real Estate Inbox Component */}
        <div className="h-[calc(100vh-200px)]">
          <EnhancedRealEstateInbox
            activeTab={activeTab}
            searchQuery={searchQuery}
            selectedFilter={selectedFilter || ""}
          />
        </div>
      </AppShell>
    </div>
  );
}


