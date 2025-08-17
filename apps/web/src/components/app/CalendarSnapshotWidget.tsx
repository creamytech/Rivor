"use client";
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Clock, Users, MapPin } from "lucide-react";
import Link from "next/link";

interface CalendarSnapshotWidgetProps {
  upcomingEvents: any[];
  calendarStats: { todayCount: number; upcomingCount: number };
}

export default function CalendarSnapshotWidget({ upcomingEvents, calendarStats }: CalendarSnapshotWidgetProps) {
  const hasEvents = upcomingEvents && upcomingEvents.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Upcoming Flow</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">Upcoming events</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/calendar" className="flex items-center gap-2">
                <span>View Calendar</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Calendar Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{calendarStats.todayCount}</div>
              <div className="text-xs text-blue-600">Today</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{calendarStats.upcomingCount}</div>
              <div className="text-xs text-purple-600">Upcoming</div>
            </div>
          </div>

          {/* Upcoming Events */}
          {hasEvents ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Next Events</h4>
              <div className="space-y-2">
                {upcomingEvents?.slice(0, 5).map((event, index) => (
                  <motion.div
                    key={event.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {event.title || 'Untitled Event'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {event.start ? new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time'}
                        </span>
                        {event.location && (
                          <>
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {event.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  No upcoming events
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Connect your calendar to see events here
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  Connect Calendar
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
