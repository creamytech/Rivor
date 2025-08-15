"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FlowCard from '@/components/river/FlowCard';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock,
  MapPin,
  Users,
  Video
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  isVideoCall?: boolean;
  color?: string;
}

interface CalendarWeekViewProps {
  className?: string;
  onEventCreate?: (date: Date, hour: number) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export default function CalendarWeekView({ 
  className, 
  onEventCreate, 
  onEventClick 
}: CalendarWeekViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [currentWeek]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const startOfWeek = getStartOfWeek(currentWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const response = await fetch(
        `/api/calendar/events?start=${startOfWeek.toISOString()}&end=${endOfWeek.toISOString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekDays = () => {
    const startOfWeek = getStartOfWeek(currentWeek);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const formatTime = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const formatEventTime = (start: Date, end: Date) => {
    const startTime = start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const endTime = end.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `${startTime} - ${endTime}`;
  };

  const getEventsForHour = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventHour = eventStart.getHours();
      const isSameDay = eventStart.toDateString() === day.toDateString();
      
      return isSameDay && eventHour === hour;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const weekDays = getWeekDays();
  const hours = getHours();

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <FlowCard className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button onClick={() => navigateWeek('prev')} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button onClick={() => navigateWeek('next')} variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Button onClick={goToToday} variant="outline" size="sm">
              Today
            </Button>
            
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {weekDays[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          
          <Button 
            onClick={() => onEventCreate?.(new Date(), 9)}
            className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>

        {/* Week Day Headers */}
        <div className="grid grid-cols-8 gap-1">
          <div className="w-16"></div> {/* Time column */}
          {weekDays.map((day, index) => (
            <div key={index} className="text-center py-2">
              <div className="text-xs text-slate-500 uppercase">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={cn(
                'text-sm font-semibold mt-1',
                isToday(day) 
                  ? 'text-teal-600 dark:text-teal-400' 
                  : 'text-slate-900 dark:text-slate-100'
              )}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8 gap-1 min-h-full">
          {/* Time Column */}
          <div className="border-r border-slate-200 dark:border-slate-700">
            {hours.map((hour) => (
              <div key={hour} className="h-16 border-b border-slate-100 dark:border-slate-800 p-2">
                <span className="text-xs text-slate-500">{formatTime(hour)}</span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="border-r border-slate-200 dark:border-slate-700">
              {hours.map((hour) => {
                const hourEvents = getEventsForHour(day, hour);
                
                return (
                  <div
                    key={hour}
                    className={cn(
                      'h-16 border-b border-slate-100 dark:border-slate-800 p-1 relative',
                      'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors'
                    )}
                    onClick={() => onEventCreate?.(day, hour)}
                  >
                    {/* Events */}
                    {hourEvents.map((event, eventIndex) => (
                      <motion.div
                        key={event.id}
                        initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                        animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                        className={cn(
                          'absolute inset-1 rounded-lg p-2 text-xs overflow-hidden cursor-pointer',
                          'bg-gradient-to-r from-teal-500 to-azure-500 text-white shadow-sm',
                          'hover:shadow-md transition-shadow'
                        )}
                        style={{ 
                          zIndex: 10,
                          top: `${eventIndex * 4}px`
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        <div className="font-medium truncate mb-1">
                          {event.title}
                        </div>
                        <div className="flex items-center gap-1 text-white/80">
                          <Clock className="h-3 w-3" />
                          <span>{formatEventTime(new Date(event.start), new Date(event.end))}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1 text-white/80 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        {event.isVideoCall && (
                          <div className="flex items-center gap-1 text-white/80 mt-1">
                            <Video className="h-3 w-3" />
                            <span>Video call</span>
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* Time slot indicator */}
                    {isToday(day) && new Date().getHours() === hour && (
                      <div className="absolute inset-x-0 bg-red-500 h-0.5 z-20" 
                           style={{ top: `${(new Date().getMinutes() / 60) * 64}px` }} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </FlowCard>
  );
}
