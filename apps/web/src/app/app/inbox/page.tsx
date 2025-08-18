"use client";
import { useState, useEffect } from 'react';
import AppShell from "@/components/app/AppShell";
import EnhancedInbox from "@/components/inbox/EnhancedInbox";
import PageHeader from "@/components/app/PageHeader";
import SegmentedControl from "@/components/app/SegmentedControl";
import Toolbar, { ToolbarGroup, ToolbarItem } from "@/components/app/Toolbar";
import { Button } from "@/components/ui/button";
import { Mail, Filter, Bookmark, Search, MoreHorizontal } from "lucide-react";

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState("leads");
  const [savedFiltersOpen, setSavedFiltersOpen] = useState(false);

  const tabOptions = [
    { value: "leads", label: "Leads", count: 24 },
    { value: "review", label: "Review", count: 8 },
    { value: "other", label: "Other", count: 156 }
  ];

  const savedFilters = [
    "High Priority Leads",
    "Follow-up Required", 
    "New Inquiries",
    "Meeting Requests"
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppShell>
        <PageHeader
          title="Inbox"
          subtitle="Manage your email conversations and leads with intelligent filtering"
          icon={<Mail className="h-6 w-6" />}
          metaChips={[
            { label: "Last sync", value: "2h ago", color: "blue" },
            { label: "Unread", value: "24", color: "red" }
          ]}
          secondaryActions={[
            {
              label: "Saved Filters",
              onClick: () => setSavedFiltersOpen(!savedFiltersOpen),
              icon: <Filter className="h-4 w-4" />
            }
          ]}
          gradientColors={{
            from: "from-blue-600/12",
            via: "via-purple-600/12", 
            to: "to-teal-600/12"
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
            
            {savedFiltersOpen && (
              <div className="absolute right-6 top-full mt-2 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <div className="text-sm font-medium text-[var(--muted-foreground)] px-2 py-1 mb-2">
                    Saved Filters
                  </div>
                  {savedFilters.map((filter, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-[var(--muted)] rounded-md flex items-center gap-2"
                    >
                      <Bookmark className="h-3 w-3" />
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Inbox Component */}
        <div className="px-6 pb-8">
          <EnhancedInbox activeTab={activeTab} />
        </div>
      </AppShell>
    </div>
  );
}


