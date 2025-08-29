"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FlowCard from '@/components/river/FlowCard';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  isAllDay?: boolean;
}

interface CalendarMonthViewProps {
  className?: string;
  onEventCreate?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export default function CalendarMonthView({ 
  className, 
  onEventCreate, 
  onEventClick 
}: CalendarMonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const response = await fetch(
        `/api/calendar/events?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const calendarDays = getCalendarDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <FlowCard className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button onClick={() => navigateMonth('prev')} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button onClick={() => navigateMonth('next')} variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Button onClick={goToToday} variant="outline" size="sm">
              Today
            </Button>
            
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          
          <Button 
            onClick={() => onEventCreate?.(new Date())}
            className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center py-2">
              <span className="text-xs font-medium text-slate-500 uppercase">
                {day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-7 gap-1 h-full">
          {calendarDays.map((date, index) => {
            const dayEvents = getEventsForDay(date);
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDate = isToday(date);

            return (
              <motion.div
                key={index}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? {} : { delay: index * 0.01 }}
                className={cn(
                  'min-h-[120px] p-2 border border-slate-200 dark:border-slate-700 rounded-lg',
                  'hover:bg-gray-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors',
                  !isCurrentMonthDay && 'bg-slate-50/50 dark:bg-slate-800/20',
                  isTodayDate && 'ring-2 ring-teal-400 bg-teal-50 dark:bg-teal-950/30'
                )}
                onClick={() => onEventCreate?.(date)}
              >
                {/* Date */}
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    'text-sm font-medium',
                    !isCurrentMonthDay && 'text-slate-400',
                    isTodayDate && 'text-teal-600 dark:text-teal-400'
                  )}>
                    {date.getDate()}
                  </span>
                  
                  {dayEvents.length > 3 && (
                    <MoreHorizontal className="h-3 w-3 text-slate-400" />
                  )}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <motion.div
                      key={event.id}
                      initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                      transition={prefersReducedMotion ? {} : { delay: eventIndex * 0.05 }}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium truncate cursor-pointer',
                        'bg-gradient-to-r from-teal-500 to-azure-500 text-white',
                        'hover:shadow-sm transition-shadow'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      {event.isAllDay ? (
                        event.title
                      ) : (
                        <>
                          {new Date(event.start).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })} {event.title}
                        </>
                      )}
                    </motion.div>
                  ))}
                  
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-slate-500 px-2">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </FlowCard>
  );
}
