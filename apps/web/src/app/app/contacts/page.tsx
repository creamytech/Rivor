"use client";
import AppShell from "@/components/app/AppShell";
import EnhancedContacts from "@/components/contacts/EnhancedContacts";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Users, ChevronDown, Tag } from "lucide-react";
import { useState } from "react";

export default function ContactsPage() {
  const [segmentsOpen, setSegmentsOpen] = useState(false);

  const segments = [
    "All Contacts",
    "Hot Leads", 
    "Clients",
    "Prospects",
    "Vendors"
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppShell>
        <PageHeader
          title="Contact Flow"
          subtitle="Manage your contacts with smart organization and enrichment"
          icon={<Users className="h-6 w-6" />}
          metaChips={[
            { label: "Total contacts", value: "1,247", color: "orange" },
            { label: "Last sync", value: "1h ago", color: "blue" }
          ]}
          secondaryActions={[
            {
              label: "Segments",
              onClick: () => setSegmentsOpen(!segmentsOpen),
              icon: <ChevronDown className="h-4 w-4" />
            }
          ]}
          gradientColors={{
            from: "from-orange-600/12",
            via: "via-amber-600/12",
            to: "to-yellow-600/12"
          }}
        />

        {/* Page-specific content moved back to page */}
        <div className="px-6 py-4">
          {segmentsOpen && (
            <div className="absolute right-6 top-full mt-2 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-50">
              <div className="p-1">
                <div className="text-sm font-medium text-[var(--muted-foreground)] px-3 py-1 mb-1">
                  Segments
                </div>
                {segments.map((segment, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)] rounded-md flex items-center gap-2"
                  >
                    <Tag className="h-3 w-3" />
                    {segment}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Possible merges banner - positioned under header */}
        <div className="px-6 py-3 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 text-sm text-orange-800 dark:text-orange-200">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>3 possible contact merges detected</span>
            <Button variant="ghost" size="sm" className="ml-auto text-orange-700 dark:text-orange-300">
              Review
            </Button>
          </div>
        </div>

        {/* Enhanced Contacts Component */}
        <div className="px-6 pb-8">
          <EnhancedContacts />
        </div>
      </AppShell>
    </div>
  );
}
