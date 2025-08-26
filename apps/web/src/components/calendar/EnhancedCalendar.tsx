"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  Phone,
  Mail,
  MessageSquare,
  CheckSquare,
  Star,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Zap,
  Sparkles,
  Target,
  Briefcase,
  User,
  Building,
  Phone as PhoneIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  Calendar,
  Clock as ClockIcon,
  Video as VideoIcon,
  Phone as PhoneCallIcon,
  MessageSquare as MessageIcon,
  CheckSquare as TaskIcon,
  Star as StarIcon,
  AlertTriangle as AlertIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  MoreHorizontal as MoreIcon,
  Edit as EditIcon,
  Trash2 as TrashIcon,
  Copy as CopyIcon,
  ExternalLink as ExternalLinkIcon,
  Zap as ZapIcon,
  Sparkles as SparklesIcon,
  Target as TargetIcon,
  Briefcase as BriefcaseIcon,
  User as UserIcon,
  Building as BuildingIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  type: 'meeting' | 'call' | 'demo' | 'follow-up' | 'task' | 'other';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  attendees: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    company?: string;
    title?: string;
    response: 'accepted' | 'declined' | 'pending' | 'tentative';
  }[];
  organizer: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  relatedTo?: {
    type: 'lead' | 'deal' | 'contact';
    id: string;
    title: string;
  };
  notes?: string;
  videoUrl?: string;
  phoneNumber?: string;
  tags: string[];
  priority: 'high' | 'medium' | 'low';
  isRecurring: boolean;
  recurrenceRule?: string;
  reminders: {
    type: 'email' | 'popup';
    minutes: number;
  }[];
}

interface EnhancedCalendarProps {
  className?: string;
  viewMode?: 'day' | 'week' | 'month';
  onRefreshNeeded?: () => void;
}

// Add a ref to expose refresh function
export interface EnhancedCalendarRef {
  refreshEvents: () => Promise<void>;
}

const EnhancedCalendar = forwardRef<EnhancedCalendarRef, EnhancedCalendarProps>(
  ({ className, viewMode: propViewMode = 'week', onRefreshNeeded }, ref) => {
  // All hooks must be called at the top level
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>(propViewMode);

  // Update viewMode when prop changes
  useEffect(() => {
    setViewMode(propViewMode);
  }, [propViewMode]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  const fetchEvents = async () => {
      try {
        // Calculate date range for the current view
        const startDate = new Date(currentDate);
        const endDate = new Date(currentDate);
        
        if (viewMode === 'week') {
          startDate.setDate(currentDate.getDate() - currentDate.getDay());
          endDate.setDate(startDate.getDate() + 6);
        } else if (viewMode === 'month') {
          startDate.setDate(1);
          endDate.setMonth(endDate.getMonth() + 1);
          endDate.setDate(0);
        } else {
          // day view
          endDate.setDate(startDate.getDate() + 1);
        }

        const response = await fetch(`/api/calendar/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
        if (response.ok) {
          const data = await response.json();
          
          // Transform API data to match our interface
          const transformedEvents: CalendarEvent[] = (data.events || []).map((event: any) => ({
            id: event.id,
            title: event.title || 'Untitled Event',
            description: event.description || '',
            start: new Date(event.start),
            end: new Date(event.end),
            location: event.location || '',
            type: 'meeting' as const, // Default type
            status: 'confirmed' as const, // Default status
            attendees: [], // API doesn't provide attendees yet
            organizer: {
              id: 'organizer1',
              name: 'You',
              email: 'you@company.com',
              avatar: '/api/avatar/you'
            },
            tags: [],
            priority: 'medium' as const,
            isRecurring: false,
            reminders: []
          }));
          
          setEvents(transformedEvents);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error('Failed to fetch calendar events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Expose refresh function via ref
    useImperativeHandle(ref, () => ({
      refreshEvents: fetchEvents
    }), [currentDate, viewMode]);

    useEffect(() => {
      fetchEvents();
    }, [currentDate, viewMode]);

  // Helper functions - moved outside of render to avoid recreation
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'demo':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'call':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'meeting':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'follow-up':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'task':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'demo':
        return <VideoIcon className="h-4 w-4" />;
      case 'call':
        return <PhoneCallIcon className="h-4 w-4" />;
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'follow-up':
        return <MessageIcon className="h-4 w-4" />;
      case 'task':
        return <TaskIcon className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventsForTimeSlot = (date: Date, hour: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      
      // Check if event starts in this time slot (not spans through it)
      return eventStart.toDateString() === date.toDateString() && 
             eventStart.getHours() === hour;
    });
  };

  // Error boundary - if anything fails, show a simple loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatHeaderDate = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ${startOfWeek.getDate()}-${endOfWeek.getDate()}`;
      } else {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    } else {
      return currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    }
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Calendar Navigation Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="text-sm font-medium"
          >
            Today
          </Button>
          
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {formatHeaderDate()}
          </div>
        </div>

        <div className="text-sm text-slate-600 dark:text-slate-400">
          {events.length} event{events.length !== 1 ? 's' : ''} 
          {viewMode === 'day' ? ' today' : viewMode === 'week' ? ' this week' : ' this month'}
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex-1 overflow-auto">
      {viewMode === 'week' && (
        <div className="grid grid-cols-8 gap-1 h-[calc(100vh-200px)]">
          {/* Time column */}
          <div className="space-y-1">
            <div className="h-12"></div> {/* Header spacer */}
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="h-16 text-xs text-slate-500 border-r border-slate-200 dark:border-slate-700 pr-2 text-right">
                {formatTime(new Date(2024, 0, 1, hour))}
              </div>
            ))}
          </div>

          {/* Days */}
          {getWeekDays().map((day, dayIndex) => (
            <div key={dayIndex} className="space-y-1">
              {/* Day header */}
              <div className="h-12 flex flex-col items-center justify-center border-b border-slate-200 dark:border-slate-700">
                <div className="text-sm font-medium">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={cn(
                  "text-xs rounded-full w-6 h-6 flex items-center justify-center",
                  day.toDateString() === new Date().toDateString() 
                    ? "bg-blue-500 text-white" 
                    : "text-slate-500"
                )}>
                  {day.getDate()}
                </div>
              </div>

              {/* Time slots */}
              {Array.from({ length: 24 }, (_, hour) => {
                const eventsInSlot = getEventsForTimeSlot(day, hour);
                return (
                  <div key={hour} className="h-16 border-r border-b border-slate-200 dark:border-slate-700 relative">
                    {eventsInSlot.map((event, eventIndex) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-1 bg-blue-100 dark:bg-blue-900/20 rounded p-1 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="text-xs font-medium truncate">
                          {event.title}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="h-12 flex items-center justify-center text-sm font-medium border-b border-slate-200 dark:border-slate-700">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {(() => {
            const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
            const days = [];
            
            // Add empty cells for days before the first day of the month
            for (let i = 0; i < startingDay; i++) {
              days.push(<div key={`empty-${i}`} className="h-32 border-r border-b border-slate-200 dark:border-slate-700"></div>);
            }
            
            // Add days of the month
            for (let day = 1; day <= daysInMonth; day++) {
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const eventsForDay = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              
              days.push(
                <div key={day} className="h-32 border-r border-b border-slate-200 dark:border-slate-700 p-1">
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday && "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  )}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {eventsForDay.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="truncate">{event.title}</div>
                      </div>
                    ))}
                    {eventsForDay.length > 3 && (
                      <div className="text-xs text-slate-500">
                        +{eventsForDay.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            
            return days;
          })()}
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="grid grid-cols-1 gap-1 h-[calc(100vh-200px)]">
          {Array.from({ length: 24 }, (_, hour) => {
            const eventsInSlot = getEventsForTimeSlot(currentDate, hour);
            return (
              <div key={hour} className="h-16 border-b border-slate-200 dark:border-slate-700 flex">
                <div className="w-20 text-xs text-slate-500 pr-2 text-right pt-1">
                  {formatTime(new Date(2024, 0, 1, hour))}
                </div>
                <div className="flex-1 relative">
                  {eventsInSlot.map((event, eventIndex) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute inset-1 bg-blue-100 dark:bg-blue-900/20 rounded p-2 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="text-sm font-medium truncate">
                        {event.title}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${
              theme === 'black' ? 'bg-black/50' : 'bg-white/50'
            }`}
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto glass-card glass-border"
              style={{
                backgroundColor: 'var(--glass-surface)',
                color: 'var(--glass-text)',
                backdropFilter: 'var(--glass-blur)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      getEventTypeColor(selectedEvent.type)
                    )}>
                      {getEventTypeIcon(selectedEvent.type)}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
                      <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                        {formatDate(selectedEvent.start)} • {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {selectedEvent.description && (
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {/* Location and Video */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4" style={{ color: 'var(--glass-text-subtle)' }} />
                      <span className="text-sm">{selectedEvent.location}</span>
                    </div>
                  )}
                  {selectedEvent.videoUrl && (
                    <div className="flex items-center gap-2">
                      <VideoIcon className="h-4 w-4" style={{ color: 'var(--glass-text-subtle)' }} />
                      <a href={selectedEvent.videoUrl} className="text-sm text-blue-600 hover:underline">
                        Join Meeting
                      </a>
                    </div>
                  )}
                </div>

                {/* Attendees */}
                {selectedEvent.attendees.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Attendees</h3>
                    <div className="space-y-2">
                      {selectedEvent.attendees.map(attendee => (
                        <div key={attendee.id} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={attendee.avatar} />
                            <AvatarFallback>
                              {attendee.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{attendee.name}</div>
                            <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                              {attendee.email}
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              attendee.response === 'accepted' && "bg-green-100 text-green-700",
                              attendee.response === 'declined' && "bg-red-100 text-red-700",
                              attendee.response === 'pending' && "bg-yellow-100 text-yellow-700"
                            )}
                          >
                            {attendee.response}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Item */}
                {selectedEvent.relatedTo && (
                  <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--glass-surface-subtle)' }}>
                    <h3 className="font-medium mb-2">Related to</h3>
                    <div className="flex items-center gap-2">
                      <BriefcaseIcon className="h-4 w-4" style={{ color: 'var(--glass-text-subtle)' }} />
                      <span className="text-sm font-medium">{selectedEvent.relatedTo.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedEvent.relatedTo.type}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--glass-border-subtle)' }}>
                  <Button size="sm" className="flex items-center gap-2">
                    <VideoIcon className="h-4 w-4" />
                    Join
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <EditIcon className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <CopyIcon className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
});

EnhancedCalendar.displayName = 'EnhancedCalendar';

export default EnhancedCalendar;
