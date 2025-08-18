"use client";
import AppShell from "@/components/app/AppShell";
import EnhancedCalendar from "@/components/calendar/EnhancedCalendar";
import PageHeader from "@/components/app/PageHeader";
import SegmentedControl from "@/components/app/SegmentedControl";
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
  Calendar, 
  MoreHorizontal, 
  Download, 
  Settings, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock
} from "lucide-react";
import { useState } from "react";

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const viewOptions = [
    { value: "today", label: "Today" },
    { value: "week", label: "Week" },
    { value: "day", label: "Day" },
    { value: "agenda", label: "Agenda" }
  ];

  const getDateRangeText = () => {
    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();
    
    if (isToday) return "Today";
    
    const diffTime = Math.abs(today.getTime() - currentDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `${diffDays} days from now`;
    
    return currentDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: currentDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

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
          primaryAction={{
            label: "Create Event",
            onClick: () => console.log("Create event"),
            icon: <Plus className="h-4 w-4" />
          }}
          secondaryActions={[
            {
              label: "More options",
              onClick: () => {}, // Handled by dropdown
              icon: <MoreHorizontal className="h-4 w-4" />
            }
          ]}
          gradientColors={{
            from: "from-purple-600/12",
            via: "via-indigo-600/12",
            to: "to-blue-600/12"
          }}
        />

        {/* Enhanced Calendar Controls */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)98%,transparent)]">
          <div className="flex items-center justify-between">
            {/* Left: View Controls */}
            <div className="flex items-center gap-4">
              <SegmentedControl
                options={viewOptions}
                value={viewMode}
                onChange={setViewMode}
              />
            </div>
            
            {/* Center: Date Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 px-3">
                <span className="font-medium text-sm">{getDateRangeText()}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="h-7 px-2 text-xs"
                >
                  Today
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Calendar Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => console.log("Import ICS")}>
                    <Download className="h-4 w-4 mr-2" />
                    Import ICS
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log("Export Calendar")}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Calendar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => console.log("Calendar Settings")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Calendar Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log("Sync Status")}>
                    <Clock className="h-4 w-4 mr-2" />
                    Sync Status
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Enhanced Calendar Component */}
        <div className="px-6 pb-8">
          <EnhancedCalendar 
            viewMode={viewMode} 
            currentDate={currentDate}
          />
        </div>
      </AppShell>
    </div>
  );
}


