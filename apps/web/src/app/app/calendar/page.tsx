"use client";
import { useState } from "react";
import AppShell from "@/components/app/AppShell";
import CalendarWeekView from "@/components/calendar/CalendarWeekView";
import CalendarMonthView from "@/components/calendar/CalendarMonthView";
import CreateEventModal from "@/components/calendar/CreateEventModal";
import FlowRibbon from "@/components/river/FlowRibbon";
import RiverTabs from "@/components/river/RiverTabs";
import FlowCard from "@/components/river/FlowCard";
import { ToastProvider, useToast } from "@/components/river/RiverToast";
import TokenErrorBanner from "@/components/common/TokenErrorBanner";
import { Calendar, CalendarDays, Plus } from "lucide-react";

type View = "month" | "week";

function CalendarPageContent() {
  const [view, setView] = useState<View>("week");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedHour, setSelectedHour] = useState<number>(9);
  const { addToast } = useToast();

  const handleEventCreate = (date: Date, hour?: number) => {
    setSelectedDate(date);
    setSelectedHour(hour || 9);
    setShowCreateModal(true);
  };

  const handleEventCreated = (event: unknown) => {
    addToast({
      type: 'success',
      title: 'Event Created',
      description: `"${event.title}" has been added to your calendar.`
    });
    // Trigger refresh by updating key or calling parent refresh
  };

  const handleEventClick = (event: unknown) => {
    // TODO: Open event detail modal
    console.log('Event clicked:', event);
  };

  const tabs = [
    {
      id: 'week',
      label: 'Week',
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: 'month',
      label: 'Month',
      icon: <CalendarDays className="h-4 w-4" />
    }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <FlowRibbon />
      <AppShell>
        <div className="container py-6 space-y-6">
          <TokenErrorBanner />
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Calendar
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Manage your schedule and sync with Google Calendar.
                </p>
              </div>
              
              <RiverTabs
                tabs={tabs}
                value={view}
                onChange={(value) => setView(value as View)}
                variant="pills"
              />
            </div>
            
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              {/* Main Calendar View */}
              <div className="min-h-[600px]">
                {view === 'week' ? (
                  <CalendarWeekView
                    onEventCreate={handleEventCreate}
                    onEventClick={handleEventClick}
                  />
                ) : (
                  <CalendarMonthView
                    onEventCreate={(date) => handleEventCreate(date)}
                    onEventClick={handleEventClick}
                  />
                )}
              </div>
              
              {/* Sidebar */}
              <div className="space-y-4">
                <FlowCard className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        Quick Actions
                      </h3>
                    </div>
                    
                    <button
                      onClick={() => handleEventCreate(new Date())}
                      className="w-full bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Event
                    </button>
                  </div>
                </FlowCard>
                
                <FlowCard className="p-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Upcoming Events
                    </h3>
                    
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Your next scheduled events will appear here. Create your first event to get started.
                    </div>
                  </div>
                </FlowCard>
                
                <FlowCard className="p-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Smart Suggestions
                    </h3>
                    
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      AI-powered scheduling suggestions will appear here based on your email patterns and availability.
                    </div>
                  </div>
                </FlowCard>
              </div>
            </div>
          </div>
        </div>
      </AppShell>

      <CreateEventModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        defaultDate={selectedDate}
        defaultHour={selectedHour}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <ToastProvider>
      <CalendarPageContent />
    </ToastProvider>
  );
}


