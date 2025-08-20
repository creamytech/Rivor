"use client";
import { useState, useEffect } from 'react';
import AppShell from "@/components/app/AppShell";
import EnhancedRealEstateInbox from "@/components/inbox/EnhancedRealEstateInbox";
import SegmentedControl from "@/components/app/SegmentedControl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Search,
  Star,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Edit3,
  ChevronDown,
  ArrowUpDown,
  RefreshCw,
  Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState("leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'lead_score'>('date');
  const [quickFilters, setQuickFilters] = useState([
    { id: "unread", label: "Unread", count: 24, active: false, icon: <Mail className="h-3 w-3" /> },
    { id: "high_priority", label: "High Priority", count: 8, active: false, icon: <AlertTriangle className="h-3 w-3" /> },
    { id: "this_week", label: "This Week", count: 45, active: false, icon: <Clock className="h-3 w-3" /> },
    { id: "overdue", label: "Overdue", count: 3, active: false, icon: <AlertTriangle className="h-3 w-3" /> }
  ]);

  const sortOptions = [
    { value: 'date', label: 'Date', icon: <Clock className="h-4 w-4" /> },
    { value: 'priority', label: 'Priority', icon: <AlertTriangle className="h-4 w-4" /> },
    { value: 'lead_score', label: 'Lead Score', icon: <Star className="h-4 w-4" /> }
  ];

  const [tabOptions, setTabOptions] = useState([
    { value: "leads", label: "Leads", count: 0, icon: <Star className="h-3 w-3" /> },
    { value: "review", label: "Review", count: 0, icon: <AlertTriangle className="h-3 w-3" /> },
    { value: "other", label: "Other", count: 0, icon: <Mail className="h-3 w-3" /> }
  ]);

  const savedFilters = [
    { id: "high-priority", label: "High Priority Leads", icon: <AlertTriangle className="h-4 w-4" /> },
    { id: "follow-up", label: "Follow-up Required", icon: <Clock className="h-4 w-4" /> },
    { id: "new-inquiries", label: "New Inquiries", icon: <Star className="h-4 w-4" /> },
    { id: "meeting-requests", label: "Meeting Requests", icon: <CheckCircle className="h-4 w-4" /> }
  ];

  const handleQuickFilter = (filterId: string) => {
    setQuickFilters((prev) =>
      prev.map((filter) =>
        filter.id === filterId
          ? { ...filter, active: !filter.active }
          : { ...filter, active: false }
      )
    );
    setSelectedFilter((current) => (current === filterId ? null : filterId));
  };

  const activeFilterCount = quickFilters.filter(f => f.active).length;
  const activeSortOption = sortOptions.find(option => option.value === sortBy);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppShell>
        {/* Redesigned Header with Better Hierarchy */}
        <div className="px-8 py-6 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)98%,transparent)]">
          {/* Top Header Row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Tab Navigation */}
              <SegmentedControl
                options={tabOptions}
                value={activeTab}
                onChange={setActiveTab}
                className="flex-shrink-0"
              />
              <div className="h-6 w-px bg-border mx-2" />
              
              {/* Inbox Stats */}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Inbox className="h-4 w-4" />
                <span className="text-sm font-medium">Inbox</span>
              </div>
            </div>

            {/* Floating Compose Button - Gmail Style */}
            <div className="relative">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl px-6 py-3 h-auto font-medium"
              >
                <Edit3 className="h-5 w-5 mr-2" />
                Compose
              </Button>
            </div>
          </div>

          {/* Consolidated Search, Filters & Sort Row */}
          <div className="flex items-center gap-4">
            {/* Enhanced Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search emails, contacts, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter Chips - Inline */}
            <div className="flex items-center gap-2 flex-1">
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => handleQuickFilter(filter.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap",
                    filter.active 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/50"
                  )}
                >
                  {filter.icon}
                  {filter.label}
                  <Badge 
                    variant={filter.active ? "secondary" : "outline"} 
                    className={cn(
                      "text-[10px] h-4 px-1 ml-1",
                      filter.active ? "bg-primary-foreground/20 text-primary-foreground" : ""
                    )}
                  >
                    {filter.count}
                  </Badge>
                </button>
              ))}
            </div>

            {/* Compact Controls */}
            <div className="flex items-center gap-2">
              {/* Filters & Sort Combined */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 h-10">
                    <Filter className="h-4 w-4" />
                    <ArrowUpDown className="h-3 w-3" />
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setSortBy(option.value as any)}
                      className={cn(
                        "flex items-center gap-3 py-2",
                        sortBy === option.value && "bg-accent"
                      )}
                    >
                      {option.icon}
                      {option.label}
                      {sortBy === option.value && (
                        <CheckCircle className="h-4 w-4 ml-auto text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
                  {savedFilters.map((filter) => (
                    <DropdownMenuItem
                      key={filter.id}
                      onClick={() => {
                        setSelectedFilter(filter.id);
                        setQuickFilters((prev) =>
                          prev.map((f) => ({ ...f, active: false }))
                        );
                      }}
                      className="flex items-center gap-3 py-2"
                    >
                      {filter.icon}
                      {filter.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Refresh Button */}
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {/* Active Filter Indicator */}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Real Estate Inbox Component */}
        <div className="h-[calc(100vh-240px)]">
          <EnhancedRealEstateInbox
            activeTab={activeTab}
            searchQuery={searchQuery}
            selectedFilter={selectedFilter || ""}
            sortBy={sortBy}
          />
        </div>
      </AppShell>
    </div>
  );
}


