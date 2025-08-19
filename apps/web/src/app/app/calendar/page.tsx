"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/app/AppShell';
import EnhancedCalendar from '@/components/calendar/EnhancedCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  Settings, 
  Download, 
  Upload,
  Video,
  Phone,
  Users,
  Clock,
  MapPin,
  Zap,
  Sparkles,
  Target,
  Briefcase,
  User,
  Building,
  Phone as PhoneIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  Calendar as CalendarIcon,
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

export default function CalendarPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'my-events' | 'team' | 'all'>('my-events');
  const [meetingType, setMeetingType] = useState<'all' | 'intro' | 'demo' | 'follow-up' | 'internal'>('all');

  const availableFilters = [
    { id: 'has-video', label: 'Video Calls', icon: VideoIcon },
    { id: 'has-phone', label: 'Phone Calls', icon: PhoneIcon },
    { id: 'in-person', label: 'In Person', icon: MapPinIcon },
    { id: 'team-meeting', label: 'Team Meetings', icon: Users },
    { id: 'client-meeting', label: 'Client Meetings', icon: BriefcaseIcon },
    { id: 'high-priority', label: 'High Priority', icon: AlertIcon },
    { id: 'recurring', label: 'Recurring', icon: ClockIcon },
  ];

  const meetingTypes = [
    { id: 'all', label: 'All Types', icon: CalendarIcon },
    { id: 'intro', label: 'Intro Calls', icon: PhoneCallIcon },
    { id: 'demo', label: 'Demos', icon: VideoIcon },
    { id: 'follow-up', label: 'Follow-ups', icon: MessageIcon },
    { id: 'internal', label: 'Internal', icon: Users },
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <AppShell>
      {/* Search and Filter Bar */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search events, attendees, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <Button
                variant={viewMode === 'my-events' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('my-events')}
                className="text-xs"
              >
                My Events
              </Button>
              <Button
                variant={viewMode === 'team' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('team')}
                className="text-xs"
              >
                Team
              </Button>
              <Button
                variant={viewMode === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('all')}
                className="text-xs"
              >
                All
              </Button>
            </div>

            {/* Meeting Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Type:</span>
              <div className="flex items-center gap-1">
                {meetingTypes.map(type => (
                  <Button
                    key={type.id}
                    variant={meetingType === type.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMeetingType(type.id as any)}
                    className="text-xs h-8"
                  >
                    <type.icon className="h-3 w-3 mr-1" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">Filters:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {availableFilters.map(filter => (
                <Button
                  key={filter.id}
                  variant={selectedFilters.includes(filter.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilter(filter.id)}
                  className="text-xs h-7"
                >
                  <filter.icon className="h-3 w-3 mr-1" />
                  {filter.label}
                </Button>
              ))}
            </div>
            {selectedFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFilters([])}
                className="text-xs h-7 text-slate-500 hover:text-slate-700"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Smart Suggestions */}
      <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Smart Suggestions
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-green-700 dark:text-green-300">
                  3 free slots tomorrow
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-orange-600" />
                <span className="text-orange-700 dark:text-orange-300">
                  TechCorp demo prep needed
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-purple-700 dark:text-purple-300">
                  Auto-schedule follow-ups
                </span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="ml-auto">
              <Sparkles className="h-4 w-4 mr-2" />
              Find Time
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Component */}
      <div className="flex-1 overflow-hidden">
        <EnhancedCalendar className="h-full" />
      </div>
    </AppShell>
  );
}


