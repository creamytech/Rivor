"use client";
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Video,
  Save,
  X,
  Plus,
  Phone,
  Monitor,
  ExternalLink
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Switch 
} from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  defaultHour?: number;
  onEventCreated?: (event: unknown) => void;
}

export default function CreateEventModal({
  open,
  onOpenChange,
  defaultDate,
  defaultHour = 9,
  onEventCreated
}: CreateEventModalProps) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: defaultDate || new Date(),
    startTime: `${defaultHour.toString().padStart(2, '0')}:00`,
    endTime: `${(defaultHour + 1).toString().padStart(2, '0')}:00`,
    location: '',
    attendees: [] as string[],
    isVideoCall: false,
    videoUrl: '',
    videoType: 'google-meet' as 'google-meet' | 'zoom' | 'teams' | 'other',
    isAllDay: false,
    priority: 'medium' as 'low' | 'medium' | 'high',
    type: 'meeting' as 'meeting' | 'call' | 'demo' | 'follow-up' | 'other'
  });
  
  const [attendeeInput, setAttendeeInput] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // Combine date and time
      const startDateTime = new Date(formData.date);
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(formData.date);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      // Auto-generate Google Meet link if selected
      let finalVideoUrl = formData.videoUrl;
      if (formData.isVideoCall && formData.videoType === 'google-meet' && !formData.videoUrl) {
        // Google Calendar will auto-generate Meet link if we include conferenceData
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        start: formData.isAllDay ? formData.date.toISOString().split('T')[0] : startDateTime.toISOString(),
        end: formData.isAllDay ? formData.date.toISOString().split('T')[0] : endDateTime.toISOString(),
        location: formData.location,
        attendees: formData.attendees,
        isVideoCall: formData.isVideoCall,
        videoUrl: finalVideoUrl,
        videoType: formData.videoType,
        isAllDay: formData.isAllDay,
        priority: formData.priority,
        type: formData.type,
        addGoogleMeet: formData.isVideoCall && formData.videoType === 'google-meet'
      };

      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const createdEvent = await response.json();
        onEventCreated?.(createdEvent);
        onOpenChange(false);
        resetForm();
      } else {
        throw new Error('Failed to create event');
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: defaultDate || new Date(),
      startTime: `${defaultHour.toString().padStart(2, '0')}:00`,
      endTime: `${(defaultHour + 1).toString().padStart(2, '0')}:00`,
      location: '',
      attendees: [],
      isVideoCall: false,
      videoUrl: '',
      videoType: 'google-meet',
      isAllDay: false,
      priority: 'medium',
      type: 'meeting'
    });
    setAttendeeInput('');
  };

  const addAttendee = () => {
    if (attendeeInput.trim() && !formData.attendees.includes(attendeeInput.trim())) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, attendeeInput.trim()]
      }));
      setAttendeeInput('');
    }
  };

  const removeAttendee = (email: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a !== email)
    }));
  };

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto glass-modal glass-border-active glass-hover-glow">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-teal-500" />
            Create New Event
          </DialogTitle>
          <DialogDescription>
            Schedule a new event and optionally sync it with Google Calendar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--glass-text)' }}>
              Event Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter event title..."
              required
              className="w-full"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--glass-text)' }}>
                Date
              </label>
              <Input
                type="date"
                value={formData.date.toISOString().split('T')[0]}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  date: new Date(e.target.value) 
                }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--glass-text)' }}>
                All Day
              </label>
              <div className="flex items-center h-9">
                <input
                  type="checkbox"
                  checked={formData.isAllDay}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    isAllDay: e.target.checked 
                  }))}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="ml-2 text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  All day event
                </span>
              </div>
            </div>
          </div>

          {/* Time Range */}
          {!formData.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--glass-text)' }}>
                  Start Time
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    startTime: e.target.value 
                  }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--glass-text)' }}>
                  End Time
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    endTime: e.target.value 
                  }))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--glass-text)' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Event description..."
              rows={3}
              className={cn(
                "w-full rounded-md border border-slate-300 dark:border-slate-600",
                "bg-white dark:bg-slate-800 px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              )}
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--glass-text)' }}>
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--glass-text-subtle)' }} />
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Add location..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Event Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--glass-text)' }}>
                Event Type
              </label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--glass-text)' }}>
                Priority
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Video Call Option */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isVideoCall}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  isVideoCall: e.target.checked 
                }))}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <Video className="h-4 w-4" style={{ color: 'var(--glass-text-subtle)' }} />
              <span className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                Add video call
              </span>
            </div>

            {formData.isVideoCall && (
              <div className="space-y-3 pl-6">
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--glass-text)' }}>
                    Video Platform
                  </label>
                  <Select
                    value={formData.videoType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, videoType: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google-meet">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          Google Meet (Auto-generated)
                        </div>
                      </SelectItem>
                      <SelectItem value="zoom">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Zoom
                        </div>
                      </SelectItem>
                      <SelectItem value="teams">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Microsoft Teams
                        </div>
                      </SelectItem>
                      <SelectItem value="other">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Other
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.videoType !== 'google-meet' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--glass-text)' }}>
                      Video Call URL
                    </label>
                    <Input
                      value={formData.videoUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="Enter video call URL..."
                      type="url"
                    />
                  </div>
                )}

                {formData.videoType === 'google-meet' && (
                  <div className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    Google Meet link will be automatically generated when the event is created.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attendees */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--glass-text)' }}>
              Attendees
            </label>
            
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--glass-text-subtle)' }} />
                <Input
                  value={attendeeInput}
                  onChange={(e) => setAttendeeInput(e.target.value)}
                  placeholder="Enter email address..."
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAttendee();
                    }
                  }}
                />
              </div>
              <Button type="button" onClick={addAttendee} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Attendee List */}
            <AnimatePresence>
              {formData.attendees.length > 0 && (
                <motion.div
                  initial={prefersReducedMotion ? {} : { opacity: 0, height: 0 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, height: 'auto' }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  {formData.attendees.map((email, index) => (
                    <motion.div
                      key={email}
                      initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                      exit={prefersReducedMotion ? {} : { opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: 'var(--glass-surface-subtle)' }}
                    >
                      <span className="text-sm" style={{ color: 'var(--glass-text)' }}>
                        {email}
                      </span>
                      <Button
                        type="button"
                        onClick={() => removeAttendee(email)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !formData.title.trim()}
              className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
            >
              {creating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 mr-2"
                  >
                    <Clock className="h-4 w-4" />
                  </motion.div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Event
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
