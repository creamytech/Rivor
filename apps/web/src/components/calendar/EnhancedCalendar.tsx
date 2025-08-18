"use client";
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  MoreHorizontal,
  Search,
  Filter,
  Settings,
  Eye,
  EyeOff,
  Download,
  Upload,
  Smartphone,
  Monitor,
  CheckCircle,
  X,
  Edit,
  Trash2,
  Copy,
  Share2,
  Star,
  AlertCircle,
  Info
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  titleEnc: any;
  start: string;
  end: string;
  locationEnc: any;
  notesEnc: any;
  attendeesEnc: any;
  createdAt: string;
  updatedAt: string;
  account?: {
    id: string;
    provider: string;
    status: string;
  } | null;
}

interface EnhancedCalendarProps {
  className?: string;
}

export default function EnhancedCalendar({ className = '' }: EnhancedCalendarProps) {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarVisibility, setCalendarVisibility] = useState({
    google: true,
    outlook: true,
    ics: true
  });
  const [createEventData, setCreateEventData] = useState({
    title: '',
    start: '',
    end: '',
    location: '',
    notes: ''
  });

  // Fetch real data from tRPC
  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = trpc.calendarEvents.list.useQuery({
    start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    end: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
    limit: 100
  });

  // Mutations
  const createEventMutation = trpc.calendarEvents.create.useMutation({
    onSuccess: () => refetchEvents()
  });

  const events = eventsData || [];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const handleCreateEvent = async (eventData: {
    title: string;
    start: Date;
    end: Date;
    location?: string;
    notes?: string;
    attendees?: string[];
  }) => {
    try {
      await createEventMutation.mutateAsync({
        title: eventData.title,
        start: eventData.start,
        end: eventData.end,
        location: eventData.location,
        notes: eventData.notes,
        attendees: eventData.attendees
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-white/20 bg-white/10"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          className={`p-2 border border-white/20 min-h-[120px] relative ${
            isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'bg-white/10'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${
              isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'
            }`}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {dayEvents.length}
              </Badge>
            )}
          </div>
          
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="font-medium truncate">
                  {event.titleEnc ? 'Calendar Event' : 'Untitled Event'}
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  {formatTime(event.start)}
                </div>
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-slate-500">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-slate-600 dark:text-slate-400">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      weekDays.push(
        <div
          key={i}
          className={`flex-1 p-2 border border-white/20 min-h-[400px] ${
            isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'bg-white/10'
          }`}
        >
          <div className="text-center mb-2">
            <div className={`font-medium ${
              isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'
            }`}>
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={`text-sm ${
              isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
            }`}>
              {date.getDate()}
            </div>
          </div>
          
          <div className="space-y-1">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-xs cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="font-medium truncate">
                  {event.titleEnc ? 'Event Title' : 'Untitled Event'}
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  {formatTime(event.start)} - {formatTime(event.end)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <div className="flex gap-1">{weekDays}</div>;
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const isToday = currentDate.toDateString() === new Date().toDateString();

    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${
          isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'bg-white/10'
        }`}>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            {formatDate(currentDate)}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {dayEvents.length} events scheduled
          </p>
        </div>
        
        <div className="space-y-2">
          {dayEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                No events scheduled for this day
              </p>
            </div>
          ) : (
            dayEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-white/20 hover:bg-white/70 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      {event.titleEnc ? 'Event Title' : 'Untitled Event'}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </div>
                      {event.locationEnc && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Location
                        </div>
                      )}
                                             {event.attendeesEnc && (
                         <div className="flex items-center gap-1">
                           <Users className="h-4 w-4" />
                           Attendees
                         </div>
                       )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const upcomingEvents = events
      .filter(event => new Date(event.start) >= new Date())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 10);

    return (
      <div className="space-y-4">
        <div className="p-4 bg-white/10 rounded-lg">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Upcoming Events
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Next {upcomingEvents.length} events
          </p>
        </div>
        
        <div className="space-y-2">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                No upcoming events
              </p>
            </div>
          ) : (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-white/20 hover:bg-white/70 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      {event.titleEnc ? 'Event Title' : 'Untitled Event'}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(new Date(event.start))}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {event.account?.provider || 'Unknown'}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Calendar
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your meetings and events
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {currentDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'agenda' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('agenda')}
              >
                Agenda
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Main Calendar Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-3">
            <GlassCard variant="gradient" intensity="medium" className="h-full">
              <GlassCardHeader className="pb-3">
                <GlassCardTitle>Calendar</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
                {viewMode === 'agenda' && renderAgendaView()}
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Right Rail */}
          <div className="space-y-6">
            {/* Smart Suggestions */}
            <GlassCard variant="gradient" intensity="medium">
              <GlassCardHeader>
                <GlassCardTitle>Smart Suggestions</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Available Slots
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      You have 3 free slots tomorrow between 2-5 PM
                    </p>
                    <Button variant="outline" size="sm" className="mt-2 w-full text-xs">
                      Suggest Meeting Times
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        No Conflicts
                      </span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Your schedule is clear for the next meeting
                    </p>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Calendar Visibility */}
            <GlassCard variant="gradient" intensity="medium">
              <GlassCardHeader>
                <GlassCardTitle>Calendar Visibility</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span className="text-sm">Google Calendar</span>
                    </div>
                    <Button
                      variant={calendarVisibility.google ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCalendarVisibility(prev => ({ ...prev, google: !prev.google }))}
                    >
                      {calendarVisibility.google ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="text-sm">Outlook Calendar</span>
                    </div>
                    <Button
                      variant={calendarVisibility.outlook ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCalendarVisibility(prev => ({ ...prev, outlook: !prev.outlook }))}
                    >
                      {calendarVisibility.outlook ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span className="text-sm">ICS Import</span>
                    </div>
                    <Button
                      variant={calendarVisibility.ics ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCalendarVisibility(prev => ({ ...prev, ics: !prev.ics }))}
                    >
                      {calendarVisibility.ics ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard variant="gradient" intensity="medium">
              <GlassCardHeader>
                <GlassCardTitle>Quick Actions</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Create Event
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    Import Calendar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Export Events
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                  >
                    <Share2 className="h-3 w-3 mr-2" />
                    Share Calendar
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>

                 {/* Create Event Modal */}
         {showCreateModal && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
             <GlassCard className="w-full max-w-md">
               <GlassCardHeader>
                 <GlassCardTitle>Create New Event</GlassCardTitle>
               </GlassCardHeader>
               <GlassCardContent>
                 <div className="space-y-4">
                   <div>
                     <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                       Event Title
                     </label>
                     <Input
                       placeholder="Enter event title"
                       value={createEventData.title}
                       onChange={(e) => setCreateEventData(prev => ({ ...prev, title: e.target.value }))}
                       className="mt-1"
                     />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                         Start Date
                       </label>
                       <Input
                         type="datetime-local"
                         value={createEventData.start}
                         onChange={(e) => setCreateEventData(prev => ({ ...prev, start: e.target.value }))}
                         className="mt-1"
                       />
                     </div>
                     <div>
                       <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                         End Date
                       </label>
                       <Input
                         type="datetime-local"
                         value={createEventData.end}
                         onChange={(e) => setCreateEventData(prev => ({ ...prev, end: e.target.value }))}
                         className="mt-1"
                       />
                     </div>
                   </div>
                   
                   <div>
                     <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                       Location
                     </label>
                     <Input
                       placeholder="Enter location"
                       value={createEventData.location}
                       onChange={(e) => setCreateEventData(prev => ({ ...prev, location: e.target.value }))}
                       className="mt-1"
                     />
                   </div>
                   
                   <div>
                     <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                       Notes
                     </label>
                     <Input
                       placeholder="Enter notes"
                       value={createEventData.notes}
                       onChange={(e) => setCreateEventData(prev => ({ ...prev, notes: e.target.value }))}
                       className="mt-1"
                     />
                   </div>
                   
                   <div className="flex items-center gap-2 pt-4">
                     <Button
                       onClick={async () => {
                         if (createEventData.title && createEventData.start && createEventData.end) {
                           await handleCreateEvent({
                             title: createEventData.title,
                             start: new Date(createEventData.start),
                             end: new Date(createEventData.end),
                             location: createEventData.location || undefined,
                             notes: createEventData.notes || undefined
                           });
                           setCreateEventData({ title: '', start: '', end: '', location: '', notes: '' });
                         }
                       }}
                       className="flex-1"
                       disabled={!createEventData.title || !createEventData.start || !createEventData.end}
                     >
                       Create Event
                     </Button>
                     <Button
                       variant="outline"
                       onClick={() => {
                         setShowCreateModal(false);
                         setCreateEventData({ title: '', start: '', end: '', location: '', notes: '' });
                       }}
                     >
                       Cancel
                     </Button>
                   </div>
                 </div>
               </GlassCardContent>
             </GlassCard>
           </div>
         )}

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <GlassCard className="w-full max-w-md">
              <GlassCardHeader>
                <GlassCardTitle>Event Details</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      {selectedEvent.titleEnc ? 'Event Title' : 'Untitled Event'}
                    </h4>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {formatDate(new Date(selectedEvent.start))} at {formatTime(selectedEvent.start)}
                    </div>
                    {selectedEvent.locationEnc && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </div>
                    )}
                                         {selectedEvent.attendeesEnc && (
                       <div className="flex items-center gap-2">
                         <Users className="h-4 w-4" />
                         Attendees
                       </div>
                     )}
                  </div>
                  
                  <div className="flex items-center gap-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setSelectedEvent(null)}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
