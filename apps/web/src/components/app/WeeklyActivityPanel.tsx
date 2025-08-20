"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Eye, 
  CheckSquare, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

interface ActivityData {
  day: string;
  leadsAdded: number;
  showings: number;
  tasksCompleted: number;
  total: number;
}

interface WeeklyActivityPanelProps {
  className?: string;
}

export default function WeeklyActivityPanel({ className = '' }: WeeklyActivityPanelProps) {
  const [weeklyData, setWeeklyData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching weekly activity data
    const mockData: ActivityData[] = [
      { day: 'Mon', leadsAdded: 8, showings: 3, tasksCompleted: 12, total: 23 },
      { day: 'Tue', leadsAdded: 12, showings: 5, tasksCompleted: 8, total: 25 },
      { day: 'Wed', leadsAdded: 6, showings: 7, tasksCompleted: 15, total: 28 },
      { day: 'Thu', leadsAdded: 15, showings: 4, tasksCompleted: 10, total: 29 },
      { day: 'Fri', leadsAdded: 9, showings: 8, tasksCompleted: 14, total: 31 },
      { day: 'Sat', leadsAdded: 4, showings: 6, tasksCompleted: 5, total: 15 },
      { day: 'Sun', leadsAdded: 2, showings: 2, tasksCompleted: 3, total: 7 }
    ];

    setTimeout(() => {
      setWeeklyData(mockData);
      setIsLoading(false);
    }, 800);
  }, []);

  if (isLoading) {
    return (
      <Card className="border-0 bg-gradient-to-r from-white via-green-50/30 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-xl">
        <CardContent className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6 w-1/3" />
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxTotal = Math.max(...weeklyData.map(d => d.total));
  const currentWeekTotal = weeklyData.reduce((sum, day) => sum + day.total, 0);
  const avgDailyActivity = Math.round(currentWeekTotal / 7);
  const weeklyTrend = weeklyData[6].total > weeklyData[0].total ? 'up' : 'down';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-0 bg-gradient-to-r from-white via-green-50/30 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-xl backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Weekly Activity Overview
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Track your productivity patterns and identify peak performance days
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {currentWeekTotal}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Activities</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {avgDailyActivity}
                  </div>
                  <div className="text-xs text-muted-foreground">Daily Average</div>
                </div>
                <Badge className={`flex items-center gap-1 ${weeklyTrend === 'up' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                  {weeklyTrend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {weeklyTrend === 'up' ? 'Trending Up' : 'Trending Down'}
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Activity Chart */}
          <div className="space-y-6">
            {/* Chart Area */}
            <div className="relative h-64 flex items-end justify-between gap-4 px-4">
              {weeklyData.map((day, index) => {
                const heightPercentage = (day.total / maxTotal) * 100;
                
                return (
                  <motion.div
                    key={day.day}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: `${heightPercentage}%`, opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col items-center gap-2 flex-1"
                  >
                    {/* Bar */}
                    <div className="relative w-full max-w-16 group cursor-pointer">
                      {/* Stacked Bar */}
                      <div className="w-full bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-t-lg overflow-hidden hover:shadow-lg transition-all duration-300">
                        {/* Leads Added - Bottom */}
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-300"
                          style={{ height: `${(day.leadsAdded / day.total) * 100}%` }}
                        />
                        {/* Showings - Middle */}
                        <div 
                          className="w-full bg-gradient-to-t from-green-500 to-green-400 transition-all duration-300"
                          style={{ height: `${(day.showings / day.total) * 100}%` }}
                        />
                        {/* Tasks - Top */}
                        <div 
                          className="w-full bg-gradient-to-t from-purple-500 to-purple-400 transition-all duration-300"
                          style={{ height: `${(day.tasksCompleted / day.total) * 100}%` }}
                        />
                      </div>
                      
                      {/* Hover Card */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 min-w-40">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            {day.day} - {day.total} activities
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full" />
                              <span>{day.leadsAdded} leads added</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full" />
                              <span>{day.showings} showings</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-purple-500 rounded-full" />
                              <span>{day.tasksCompleted} tasks completed</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Day Label */}
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {day.day}
                    </div>
                    
                    {/* Total Count */}
                    <div className="text-xs text-muted-foreground">
                      {day.total}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Legend */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex items-center justify-center gap-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Leads Added</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-500" />
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Showings</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-purple-500" />
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Tasks Completed</span>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}