"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  CalendarDays, 
  Clock, 
  Plus, 
  Search, 
  Filter,
  Users,
  MapPin,
  Video,
  Phone,
  CheckCircle,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Star,
  MoreHorizontal,
  User,
  Building,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  description?: string;
  location?: string;
  attendees: Array<{
    name: string;
    email: string;
    avatar?: string;
    status: 'accepted' | 'declined' | 'pending' | 'tentative';
  }>;
  type: 'meeting' | 'call' | 'showing' | 'follow-up' | 'personal';
  source: 'google' | 'outlook' | 'manual' | 'ai-suggested';
  leadId?: string;
  leadData?: {
    contact: string;
    company: string;
    intent: 'buyer' | 'seller' | 'renter';
    value: number;
  };
  travelTime?: number;
  timeToLeave?: Date;
  conflicts?: string[];
}

interface SmartSuggestion {
  id: string;
  title: string;
  suggestedTime: Date;
  duration: number;
  reason: string;
  leadId?: string;
  confidence: number;
  type: 'follow-up' | 'showing' | 'consultation' | 'meeting';
}

export default function EnhancedCalendar() {
  const [view, setView] = useState<'week' | 'day' | 'agenda'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [showConflictHelper, setShowConflictHelper] = useState(false);
  const [calendarVisibility, setCalendarVisibility] = useState({
    google: true,
    outlook: true,
    personal: true
  });
  const [dragCreating, setDragCreating] = useState(false);
  const [dragStart, setDragStart] = useState<{ date: Date; hour: number } | null>(null);

  // Mock data
  useEffect(() => {
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Property showing - 123 Main St',
        start: new Date(2024, 0, 20, 14, 0),
        end: new Date(2024, 0, 20, 15, 0),
        allDay: false,
        location: '123 Main St, City, State',
        attendees: [
          { name: 'John Smith', email: 'john@email.com', status: 'accepted' },
          { name: 'Sarah Johnson', email: 'sarah@company.com', status: 'pending' }
        ],
        type: 'showing',
        source: 'manual',
        leadId: 'lead-1',
        leadData: {
          contact: 'John Smith',
          company: 'Individual',
          intent: 'buyer',
          value: 350000
        },
        travelTime: 15,
        timeToLeave: new Date(2024, 0, 20, 13, 45)
      },
      {
        id: '2',
        title: 'Follow-up call - Tech Corp lease',
        start: new Date(2024, 0, 20, 10, 0),
        end: new Date(2024, 0, 20, 10, 30),
        allDay: false,
        attendees: [
          { name: 'Mike Wilson', email: 'mike@techcorp.com', status: 'accepted' }
        ],
        type: 'call',
        source: 'ai-suggested',
        leadId: 'lead-2',
        leadData: {
          contact: 'Mike Wilson',
          company: 'Tech Corp',
          intent: 'renter',
          value: 120000
        }
      },
      {
        id: '3',
        title: 'Market analysis review',
        start: new Date(2024, 0, 21, 16, 0),
        end: new Date(2024, 0, 21, 17, 0),
        allDay: false,
        attendees: [
          { name: 'Lisa Brown', email: 'lisa@email.com', status: 'tentative' }
        ],
        type: 'consultation',
        source: 'manual',
        leadId: 'lead-3',
        leadData: {
          contact: 'Lisa Brown',
          company: 'Individual',
          intent: 'seller',
          value: 450000
        }
      }
    ];

    const mockSuggestions: SmartSuggestion[] = [
      {
        id: 's1',
        title: 'Follow-up with John Smith',
        suggestedTime: new Date(2024, 0, 22, 15, 0),
        duration: 30,
        reason: 'Based on property inquiry email from 2 days ago',
        leadId: 'lead-1',
        confidence: 85,
        type: 'follow-up'
      },
      {
        id: 's2',
        title: 'Property viewing for Tech Corp',
        suggestedTime: new Date(2024, 0, 23, 14, 0),
        duration: 60,
        reason: 'Commercial lease request with specific requirements',
        leadId: 'lead-2',
        confidence: 92,
        type: 'showing'
      }
    ];

    setEvents(mockEvents);
    setSuggestions(mockSuggestions);
  }, []);

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'showing': return <MapPin className="h-4 w-4" />;
      case 'follow-up': return <MessageSquare className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'call': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'showing': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'follow-up': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'declined': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'tentative': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'buyer': return <Home className="h-3 w-3" />;
      case 'seller': return <Building className="h-3 w-3" />;
      case 'renter': return <User className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDragStart = (e: React.MouseEvent, date: Date, hour: number) => {
    setDragCreating(true);
    setDragStart({ date, hour });
  };

  const handleDragEnd = () => {
    setDragCreating(false);
    setDragStart(null);
  };

  const handleSuggestionAccept = (suggestion: SmartSuggestion) => {
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: suggestion.title,
      start: suggestion.suggestedTime,
      end: new Date(suggestion.suggestedTime.getTime() + suggestion.duration * 60000),
      allDay: false,
      attendees: [],
      type: suggestion.type as any,
      source: 'ai-suggested',
      leadId: suggestion.leadId
    };

    setEvents(prev => [...prev, newEvent]);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const renderWeekView = () => (
    <div className="grid grid-cols-8 gap-1">
      {/* Time column */}
      <div className="space-y-1">
        <div className="h-12"></div>
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="h-12 text-xs text-slate-500 flex items-center justify-end pr-2">
            {i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`}
          </div>
        ))}
      </div>

      {/* Days */}
      {Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - date.getDay() + i);
        const dayEvents = events.filter(event => 
          event.start.toDateString() === date.toDateString()
        );

        return (
          <div key={i} className="space-y-1">
            {/* Day header */}
            <div className="h-12 flex flex-col items-center justify-center border-b border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={cn(
                "text-xs rounded-full w-6 h-6 flex items-center justify-center",
                date.toDateString() === new Date().toDateString() 
                  ? "bg-blue-500 text-white" 
                  : "text-slate-500"
              )}>
                {date.getDate()}
              </div>
            </div>

            {/* Time slots */}
            {Array.from({ length: 24 }, (_, hour) => {
              const slotEvents = dayEvents.filter(event => 
                event.start.getHours() === hour
              );

              return (
                <div
                  key={hour}
                  className="h-12 border-b border-slate-100 dark:border-slate-800 relative group"
                  onMouseDown={(e) => handleDragStart(e, date, hour)}
                  onMouseUp={handleDragEnd}
                >
                  {slotEvents.map((event) => (
                    <div
                      key={event.id}
                      className="absolute left-0 right-0 mx-1 p-1 bg-blue-500 text-white text-xs rounded cursor-pointer hover:bg-blue-600 transition-colors"
                      style={{
                        top: `${(event.start.getMinutes() / 60) * 100}%`,
                        height: `${((event.end.getTime() - event.start.getTime()) / (60 * 60 * 1000)) * 100}%`
                      }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs opacity-90">
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  const renderDayView = () => (
    <div className="space-y-4">
      <div className="text-2xl font-bold text-center">
        {currentDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {Array.from({ length: 24 }, (_, hour) => {
          const hourEvents = events.filter(event => 
            event.start.toDateString() === currentDate.toDateString() &&
            event.start.getHours() === hour
          );

          return (
            <div key={hour} className="flex">
              <div className="w-16 text-sm text-slate-500 flex items-center justify-end pr-4">
                {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
              <div className="flex-1 border-l border-slate-200 dark:border-slate-700 pl-4 min-h-[60px]">
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    className="mb-2 p-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition-colors"
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm opacity-90">
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAgendaView = () => (
    <div className="space-y-4">
      {events
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .map((event) => (
          <div
            key={event.id}
            className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {formatDate(event.start)}
                </div>
                <div className="text-xs text-slate-500">
                  {formatTime(event.start)} - {formatTime(event.end)}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getEventTypeColor(event.type)}`}
                  >
                    {getEventTypeIcon(event.type)}
                    <span className="ml-1 capitalize">{event.type}</span>
                  </Badge>
                  
                  {event.leadData && (
                    <Badge variant="outline" className="text-xs">
                      {getIntentIcon(event.leadData.intent)}
                      <span className="ml-1 capitalize">{event.leadData.intent}</span>
                    </Badge>
                  )}
                </div>
                
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                  {event.title}
                </h3>
                
                {event.location && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    📍 {event.location}
                  </p>
                )}
                
                {event.attendees.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {event.attendees.slice(0, 3).map((attendee, index) => (
                        <Avatar key={index} className="h-6 w-6">
                          <AvatarImage src={attendee.avatar} />
                          <AvatarFallback className="text-xs">
                            {attendee.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">
                      {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
    </div>
  );

  const renderUpcomingList = () => (
    <div className="space-y-3">
      {events
        .filter(event => event.start > new Date())
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 10)
        .map((event) => (
          <div
            key={event.id}
            className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {formatTime(event.start)}
                </div>
                <div className="text-xs text-slate-500">
                  {formatDate(event.start)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate mb-1">
                  {event.title}
                </h4>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getEventTypeColor(event.type)}`}
                  >
                    {getEventTypeIcon(event.type)}
                  </Badge>
                  
                  {event.attendees.map((attendee) => (
                    <Badge
                      key={attendee.email}
                      variant="outline"
                      className={`text-xs ${getStatusColor(attendee.status)}`}
                    >
                      {attendee.status}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );

  const renderSmartSuggestions = () => (
    <div className="space-y-3">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-purple-500 mt-0.5" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                  {suggestion.title}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {suggestion.confidence}% confidence
                </Badge>
              </div>
              
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                {suggestion.reason}
              </p>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {formatDate(suggestion.suggestedTime)} at {formatTime(suggestion.suggestedTime)}
                </span>
                <span className="text-xs text-slate-500">
                  ({suggestion.duration}m)
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => handleSuggestionAccept(suggestion)}
                >
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                >
                  Modify
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Calendar Toolbar */}
      <GlassCard variant="gradient" intensity="medium">
        <GlassCardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setDate(newDate.getDate() - 7);
                    setCurrentDate(newDate);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setDate(newDate.getDate() + 7);
                    setCurrentDate(newDate);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <Tabs value={view} onValueChange={(value) => setView(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="week" className="text-sm">Week</TabsTrigger>
                  <TabsTrigger value="day" className="text-sm">Day</TabsTrigger>
                  <TabsTrigger value="agenda" className="text-sm">Agenda</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import ICS
              </Button>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Calendar Settings
              </Button>
              
              <Button 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Calendar Visibility Toggles */}
      <GlassCard variant="gradient" intensity="light">
        <GlassCardContent className="p-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Calendars:
            </span>
            {Object.entries(calendarVisibility).map(([key, visible]) => (
              <Button
                key={key}
                variant={visible ? "default" : "outline"}
                size="sm"
                onClick={() => setCalendarVisibility(prev => ({ ...prev, [key]: !visible }))}
                className="text-xs"
              >
                {visible ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Button>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Main Calendar Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Calendar View */}
        <GlassCard variant="gradient" intensity="medium" className="min-h-[600px]">
          <GlassCardContent className="p-6">
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
            {view === 'agenda' && renderAgendaView()}
          </GlassCardContent>
        </GlassCard>

        {/* Right Rail */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <GlassCard variant="gradient" intensity="medium">
            <GlassCardHeader className="pb-3">
              <GlassCardTitle className="text-lg">Upcoming</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="p-0">
              <div className="p-4">
                {renderUpcomingList()}
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Smart Suggestions */}
          <GlassCard variant="gradient" intensity="medium">
            <GlassCardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <GlassCardTitle className="text-lg">Smart Suggestions</GlassCardTitle>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="p-0">
              <div className="p-4">
                {renderSmartSuggestions()}
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Conflict Helper */}
          {showConflictHelper && (
            <GlassCard variant="gradient" intensity="medium">
              <GlassCardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <GlassCardTitle className="text-lg">Conflict Detected</GlassCardTitle>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  You have overlapping events. Would you like to reschedule?
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Reschedule
                  </Button>
                  <Button size="sm" variant="outline">
                    Keep Both
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
