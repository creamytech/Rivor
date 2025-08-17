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
import SyncButton from "@/components/common/SyncButton";
import { Calendar, CalendarDays, Plus } from "lucide-react";
import { motion } from 'framer-motion';

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
  };

  const handleEventClick = (event: unknown) => {
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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <FlowRibbon />
      <AppShell>
        {/* Animated Header */}
        <motion.div 
          className="relative overflow-hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-blue-600/20 animate-pulse"></div>
          <div className="relative z-10 px-6 py-8">
            <motion.h1 
              className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              Calendar Flow
            </motion.h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
              Manage your schedule and sync with Google Calendar.
            </p>
          </div>
        </motion.div>

        <div className="px-6 pb-8 space-y-6">
          {/* Token Health Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TokenErrorBanner />
          </motion.div>
          
          {/* Action Bar */}
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Schedule Management
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  View, create, and sync calendar events
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <SyncButton 
                type="calendar" 
                variant="outline"
                size="sm"
                onSyncComplete={(result) => {
                  console.log('Calendar sync completed:', result);
                  addToast({
                    type: 'success',
                    title: 'Calendar Synced',
                    description: `Synced ${result.results?.[0]?.syncedCount || 0} new events and updated ${result.results?.[0]?.updatedCount || 0} existing events.`
                  });
                  window.location.reload();
                }}
              />
              
              <RiverTabs
                tabs={tabs}
                value={view}
                onChange={(value) => setView(value as View)}
                variant="pills"
              />
            </div>
          </motion.div>
          
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            {/* Main Calendar View */}
            <motion.div 
              className="min-h-[600px]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
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
            </motion.div>
            
            {/* Sidebar */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <FlowCard className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Quick Actions
                    </h3>
                  </div>
                  
                  <button
                    onClick={() => handleEventCreate(new Date())}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
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
            </motion.div>
          </div>
        </div>

        <CreateEventModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          defaultDate={selectedDate}
          defaultHour={selectedHour}
          onEventCreated={handleEventCreated}
        />
      </AppShell>
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


