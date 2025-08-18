"use client";
import AppShell from "@/components/app/AppShell";
import EnhancedCalendar from "@/components/calendar/EnhancedCalendar";
import PageHeader from "@/components/app/PageHeader";
import SegmentedControl from "@/components/app/SegmentedControl";
import { Button } from "@/components/ui/button";
import { Calendar, MoreHorizontal, Download, Settings } from "lucide-react";
import { useState } from "react";

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState("week");
  const [kebabOpen, setKebabOpen] = useState(false);

  const viewOptions = [
    { value: "today", label: "Today" },
    { value: "week", label: "Week" },
    { value: "day", label: "Day" },
    { value: "agenda", label: "Agenda" }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppShell>
        <PageHeader
          title="Calendar Flow"
          subtitle="Manage your schedule with smart suggestions and intelligent scheduling"
          icon={<Calendar className="h-6 w-6" />}
          metaChips={[
            { label: "Today", value: "3 events", color: "purple" },
            { label: "This week", value: "12 events", color: "blue" }
          ]}
          secondaryActions={[
            {
              label: "More options",
              onClick: () => setKebabOpen(!kebabOpen),
              icon: <MoreHorizontal className="h-4 w-4" />
            }
          ]}
          gradientColors={{
            from: "from-purple-600/12",
            via: "via-indigo-600/12",
            to: "to-blue-600/12"
          }}
        >
          <div className="flex items-center justify-between">
            <SegmentedControl
              options={viewOptions}
              value={viewMode}
              onChange={setViewMode}
            />
            
            {kebabOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                <div className="p-1">
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)] rounded-md flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Import ICS
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)] rounded-md flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Calendar Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </PageHeader>

        {/* Enhanced Calendar Component */}
        <div className="px-6 pb-8">
          <EnhancedCalendar viewMode={viewMode} />
        </div>
      </AppShell>
    </div>
  );
}


