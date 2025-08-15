import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import { UiCalendarEvent } from "@/server/calendar";
import { EmptyState } from "@/components/ui/empty-state";

interface CalendarSnapshotProps {
  upcomingEvents: UiCalendarEvent[];
  todayCount: number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export default function CalendarSnapshotWidget({ 
  upcomingEvents, 
  todayCount,
  loading, 
  error,
  onRetry 
}: CalendarSnapshotProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Calendar Snapshot</CardTitle>
          </div>
          <CardDescription>Upcoming events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Calendar Snapshot</CardTitle>
          </div>
          <CardDescription>Upcoming events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-sm text-gray-500 mb-4">
              Unable to load calendar data
            </div>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Calendar Snapshot</CardTitle>
          </div>
          <CardDescription>Upcoming events</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Calendar className="h-12 w-12" />}
            title="No upcoming events"
            description="Connect your calendar to see events here"
          />
        </CardContent>
      </Card>
    );
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(date);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Calendar Snapshot</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/calendar" className="flex items-center gap-1">
              View All
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        <CardDescription>
          {todayCount > 0 ? `${todayCount} events today` : 'Next 5 events'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingEvents.slice(0, 5).map((event) => (
            <div 
              key={event.id}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2"
              tabIndex={0}
              role="button"
              aria-label={`Calendar event: ${event.title} on ${formatDate(event.start)} at ${formatTime(event.start)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {event.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatDate(event.start)} • {formatTime(event.start)} - {formatTime(event.end)}
                    </div>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 ml-2 capitalize">
                  {event.provider}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-4 mt-4 border-t">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/app/calendar">
              View Full Calendar
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
