"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import AppShell from "@/components/app/AppShell";
import { useTheme } from "@/contexts/ThemeContext";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import EnhancedCalendar from "@/components/calendar/EnhancedCalendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Building as BuildingIcon,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateEventModal from "@/components/calendar/CreateEventModal";

export default function CalendarPage() {
  const { theme } = useTheme();
  const { isMobile } = useMobileDetection();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'my-events' | 'team' | 'all'>('my-events');
  const [meetingType, setMeetingType] = useState<'all' | 'intro' | 'demo' | 'follow-up' | 'internal'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleEventCreated = (newEvent: any) => {
    console.log('Event created:', newEvent);
    setShowCreateModal(false);
    // Optionally refresh calendar data here
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // First check sync status
      const statusResponse = await fetch('/api/sync/calendar/status');
      const statusResult = await statusResponse.json();
      
      console.log('Calendar sync status:', statusResult);
      
      // If no calendar account exists, try to set it up first
      if (!statusResult.connected && statusResult.message?.includes('No Google Calendar account connected')) {
        console.log('Setting up calendar account...');
        const setupResponse = await fetch('/api/sync/calendar/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const setupResult = await setupResponse.json();
        console.log('Calendar setup result:', setupResult);
        
        if (!setupResponse.ok) {
          alert(`Calendar setup failed: ${setupResult.message || setupResult.error}`);
          if (setupResult.action === 'connect_google_first') {
            if (confirm('Connect Google account now?')) {
              window.location.href = '/api/auth/signin/google';
            }
          }
          return;
        }
      }
      
      // Now perform the actual sync
      const response = await fetch('/api/sync/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Calendar sync successful:', result);
        alert(`Calendar sync successful! ${result.stats?.eventsCreated || 0} events created, ${result.stats?.eventsUpdated || 0} events updated.`);
        // Refresh to show new events
        window.location.reload();
      } else {
        console.error('Calendar sync failed:', result);
        alert(`Calendar sync failed: ${result.message || result.error}`);
        
        if (result.action === 'connect_google_first' || result.action === 'reauthenticate_google') {
          if (confirm('Reconnect Google account now?')) {
            window.location.href = '/api/auth/signin/google';
          }
        }
      }
    } catch (error) {
      console.error('Calendar sync request failed:', error);
      alert('Calendar sync failed due to network error. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        <div className="px-4 mt-4 mb-2 main-content-area">
          {/* Liquid Glass Header */}
          <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card glass-border-active mb-6"
          style={{ 
            backgroundColor: 'var(--glass-surface)', 
            color: 'var(--glass-text)',
            backdropFilter: 'var(--glass-blur)'
          }}
        >
          <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex items-center justify-between'} mb-6`}>
              <div className="flex items-center gap-4">
                <div className="glass-icon-container">
                  <Calendar className="h-6 w-6" style={{ color: 'var(--glass-primary)' }} />
                </div>
                <div>
                  <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold glass-text-gradient`}>Calendar</h1>
                  <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                    Manage your schedule with intelligent insights
                  </p>
                </div>
              </div>
              
              <Button 
                variant="liquid"
                size={isMobile ? "default" : "lg"}
                className={`glass-hover-glow ${isMobile ? 'w-full' : ''}`}
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                New Event
              </Button>
            </div>

            {/* Search and Controls */}
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex items-center gap-4'} mb-4`}>
              {/* Enhanced Search */}
              <div className={`relative ${isMobile ? 'w-full' : 'flex-1 max-w-md'}`}>
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                       style={{ color: 'var(--glass-text-muted)' }} />
                <Input
                  placeholder={isMobile ? "Search events..." : "Search events, attendees, or locations..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-16 glass-input"
                />
              </div>

              {/* Mobile Controls Row */}
              <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex items-center gap-4'}`}>
                {/* View Mode Toggle */}
                <div className={`glass-pill-container ${isMobile ? 'justify-center' : ''}`}>
                  {['my-events', 'team', 'all'].map((mode) => (
                    <Button
                      key={mode}
                      variant={viewMode === mode ? 'liquid' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode(mode as any)}
                      className="glass-pill-button"
                    >
                      {mode === 'my-events' ? 'My Events' : mode === 'team' ? 'Team' : 'All'}
                    </Button>
                  ))}
                </div>

                {/* Sync Button */}
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`glass-button-secondary ${isMobile ? 'w-full' : ''}`}
                >
                  <Download className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync'}
                </Button>
              </div>
            </div>

            {/* Meeting Type Filter - Dropdown */}
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex items-center gap-3'}`}>
              <Select value={meetingType} onValueChange={(value) => setMeetingType(value as any)}>
                <SelectTrigger className={`${isMobile ? 'w-full' : 'w-48'} glass-input`}>
                  <SelectValue placeholder="Select meeting type" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  {meetingTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Advanced Filters Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={`glass-button-secondary ${isMobile ? 'w-full' : ''}`}>
                    <Filter className="h-4 w-4 mr-2" />
                    {isMobile ? 'Event Filters' : 'Filters'}
                    {selectedFilters.length > 0 && (
                      <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-500 text-white">
                        {selectedFilters.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass-dropdown w-56">
                  <DropdownMenuLabel>Event Filters</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableFilters.map(filter => (
                    <DropdownMenuItem
                      key={filter.id}
                      onClick={() => toggleFilter(filter.id)}
                      className="flex items-center gap-2"
                    >
                      <div className={cn(
                        "w-4 h-4 border rounded flex items-center justify-center",
                        selectedFilters.includes(filter.id) && "bg-blue-500 border-blue-500"
                      )}>
                        {selectedFilters.includes(filter.id) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <filter.icon className="h-4 w-4" />
                      {filter.label}
                    </DropdownMenuItem>
                  ))}
                  {selectedFilters.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSelectedFilters([])}>
                        <X className="h-4 w-4 mr-2" />
                        Clear all filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        {/* Smart Suggestions Glass Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card glass-border mb-6"
          style={{ 
            backgroundColor: 'var(--glass-surface-subtle)', 
            color: 'var(--glass-text)'
          }}
        >
          <div className="p-4">
            {isMobile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="glass-icon-container-small">
                    <Sparkles className="h-4 w-4" style={{ color: 'var(--glass-accent)' }} />
                  </div>
                  <span className="text-sm font-semibold glass-text-gradient">
                    Smart Suggestions
                  </span>
                </div>
                
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="glass-suggestion-pill">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span>3 free slots tomorrow</span>
                  </div>
                  <div className="glass-suggestion-pill">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span>TechCorp demo prep needed</span>
                  </div>
                  <div className="glass-suggestion-pill">
                    <Zap className="h-4 w-4 text-purple-500" />
                    <span>Auto-schedule follow-ups</span>
                  </div>
                </div>
                
                <Button 
                  variant="liquid" 
                  size="sm"
                  className="glass-hover-pulse w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Find Time
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="glass-icon-container-small">
                    <Sparkles className="h-4 w-4" style={{ color: 'var(--glass-accent)' }} />
                  </div>
                  <span className="text-sm font-semibold glass-text-gradient">
                    Smart Suggestions
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="glass-suggestion-pill">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span>3 free slots tomorrow</span>
                  </div>
                  <div className="glass-suggestion-pill">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span>TechCorp demo prep needed</span>
                  </div>
                  <div className="glass-suggestion-pill">
                    <Zap className="h-4 w-4 text-purple-500" />
                    <span>Auto-schedule follow-ups</span>
                  </div>
                </div>
                
                <Button 
                  variant="liquid" 
                  size="sm"
                  className="glass-hover-pulse"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Find Time
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Calendar Component */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card glass-border-active flex-1"
          style={{ 
            backgroundColor: 'var(--glass-surface)', 
            minHeight: isMobile ? '500px' : '600px'
          }}
        >
          <div className={`${isMobile ? 'overflow-x-auto' : ''}`}>
            <EnhancedCalendar className={`h-full glass-calendar ${isMobile ? 'min-w-[600px]' : ''}`} />
          </div>
        </motion.div>
        </div>
      </AppShell>

      {/* Create Event Modal */}
      <CreateEventModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}


