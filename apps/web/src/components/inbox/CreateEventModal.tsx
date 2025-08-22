"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Save,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadData?: {
    threadId: string;
    subject: string;
    participants: Array<{ name?: string; email: string }>;
    lastMessageAt: string;
  };
  onEventCreated?: (event: any) => void;
}

export default function CreateEventModal({
  open,
  onOpenChange,
  threadData,
  onEventCreated
}: CreateEventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    attendees: [] as string[],
    isAllDay: false
  });
  
  const [attendeeInput, setAttendeeInput] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (threadData) {
      const now = new Date();
      const startDate = now.toISOString().split('T')[0];
      const startTime = now.toTimeString().slice(0, 5);
      
      // Set end time to 1 hour later
      const endTime = new Date(now.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5);
      
      setFormData({
        title: threadData.subject || 'Meeting from Email',
        description: `Meeting created from email thread: ${threadData.subject}`,
        startDate,
        startTime,
        endDate: startDate,
        endTime,
        location: '',
        attendees: threadData.participants.map(p => p.email),
        isAllDay: false
      });
    }
  }, [threadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const eventData = {
        title: formData.title,
        description: formData.description,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        location: formData.location,
        attendees: formData.attendees,
        isAllDay: formData.isAllDay,
        threadId: threadData?.threadId
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
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      location: '',
      attendees: [],
      isAllDay: false
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

  const removeAttendee = (attendeeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(attendee => attendee !== attendeeToRemove)
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
            <Calendar className="h-5 w-5 text-teal-500" />
            {threadData ? 'Create Event from Email' : 'Create Calendar Event'}
          </DialogTitle>
          <DialogDescription>
            {threadData 
              ? 'Schedule a meeting based on this email conversation.'
              : 'Create a new calendar event.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
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

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
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

          {/* All Day Toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAllDay}
                onChange={(e) => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">All day event</span>
            </label>
          </div>

          {/* Date and Time */}
          {!formData.isAllDay ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                  Start Time *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                  End Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                  End Time *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                  End Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Meeting location..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Attendees */}
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Attendees
            </label>
            
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={attendeeInput}
                  onChange={(e) => setAttendeeInput(e.target.value)}
                  placeholder="Add attendee email..."
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
                Add
              </Button>
            </div>

            {/* Attendee List */}
            {formData.attendees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.attendees.map((attendee) => (
                  <motion.div
                    key={attendee}
                    initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-sm"
                  >
                    <span>{attendee}</span>
                    <button
                      type="button"
                      onClick={() => removeAttendee(attendee)}
                      className="hover:bg-teal-200 dark:hover:bg-teal-800 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Thread Link Info */}
          {threadData && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <FileText className="h-4 w-4" />
                <span>This event will be linked to the email thread: "{threadData.subject}"</span>
              </div>
            </div>
          )}

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
              disabled={creating || !formData.title.trim() || !formData.startDate || !formData.endDate}
              className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
            >
              {creating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 mr-2"
                  >
                    <Calendar className="h-4 w-4" />
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
