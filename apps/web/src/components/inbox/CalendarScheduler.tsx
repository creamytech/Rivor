"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Home,
  Car,
  Coffee,
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  Zap,
  CheckCircle,
  AlertTriangle,
  Users,
  Video
} from 'lucide-react';

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'showing' | 'meeting' | 'call' | 'inspection' | 'closing' | 'consultation';
  start: Date;
  end: Date;
  location?: {
    address: string;
    type: 'property' | 'office' | 'virtual' | 'other';
  };
  attendees: {
    name: string;
    email: string;
    phone?: string;
    role: 'client' | 'agent' | 'inspector' | 'lender' | 'attorney' | 'other';
  }[];
  property?: {
    address: string;
    type: string;
    price: number;
    mls?: string;
  };
  notes: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  reminders: {
    time: number; // minutes before event
    sent: boolean;
  }[];
  followUpRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CalendarSchedulerProps {
  contactEmail?: string;
  propertyAddress?: string;
  onEventCreate?: (event: CalendarEvent) => void;
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => void;
}

const EVENT_TYPES = [
  { value: 'showing', label: 'Property Showing', icon: Eye, color: 'bg-blue-100 text-blue-800' },
  { value: 'meeting', label: 'Client Meeting', icon: Users, color: 'bg-green-100 text-green-800' },
  { value: 'call', label: 'Phone Call', icon: Phone, color: 'bg-purple-100 text-purple-800' },
  { value: 'inspection', label: 'Inspection', icon: CheckCircle, color: 'bg-orange-100 text-orange-800' },
  { value: 'closing', label: 'Closing', icon: FileText, color: 'bg-red-100 text-red-800' },
  { value: 'consultation', label: 'Consultation', icon: Coffee, color: 'bg-yellow-100 text-yellow-800' }
] as const;

// Mock calendar data generator
const generateMockEvents = (): CalendarEvent[] => {
  const today = new Date();
  const events: CalendarEvent[] = [];
  
  const eventTitles = [
    'Property Showing - 123 Oak Street',
    'Buyer Consultation - Johnson Family',
    'Market Analysis Meeting',
    'Home Inspection - Pine Avenue',
    'Closing - Wilson Property',
    'Listing Appointment - Chen Residence',
    'Follow-up Call - Martinez',
    'Virtual Tour - Downtown Condo'
  ];

  const attendeeNames = [
    'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Wilson',
    'Lisa Thompson', 'Robert Lee', 'Amanda Davis', 'Christopher Brown'
  ];

  const addresses = [
    '123 Oak Street, Downtown',
    '456 Pine Avenue, Westside',
    '789 Maple Drive, North Hills',
    '321 Cedar Lane, Marina District',
    '654 Elm Street, Suburbs',
    '987 Birch Road, Hillcrest'
  ];

  for (let i = 0; i < 8; i++) {
    const type = EVENT_TYPES[i % EVENT_TYPES.length];
    const startDate = new Date(today.getTime() + (i - 2) * 24 * 60 * 60 * 1000 + (i * 3) * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + (type.value === 'showing' ? 60 : 90) * 60 * 1000);
    
    events.push({
      id: `event-${i + 1}`,
      title: eventTitles[i],
      type: type.value as CalendarEvent['type'],
      start: startDate,
      end: endDate,
      location: {
        address: addresses[i % addresses.length],
        type: type.value === 'showing' ? 'property' : i % 3 === 0 ? 'office' : 'other'
      },
      attendees: [
        {
          name: attendeeNames[i],
          email: `${attendeeNames[i].toLowerCase().replace(' ', '.')}@email.com`,
          phone: `(555) ${String(i + 300).padStart(3, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          role: i % 3 === 0 ? 'client' : 'agent'
        }
      ],
      property: type.value === 'showing' || type.value === 'inspection' ? {
        address: addresses[i % addresses.length],
        type: ['Condo', 'Single Family', 'Townhouse'][i % 3],
        price: 400000 + (i * 50000),
        mls: `MLS${String(i + 100000).padStart(6, '0')}`
      } : undefined,
      notes: i % 2 === 0 ? 'Client is pre-approved and ready to move quickly' : 'First-time buyer, needs extra guidance',
      status: ['scheduled', 'confirmed', 'completed'][i % 3] as CalendarEvent['status'],
      reminders: [
        { time: 60, sent: false },
        { time: 15, sent: false }
      ],
      followUpRequired: i % 3 === 0,
      createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
      updatedAt: new Date(Date.now() - (i * 12 * 60 * 60 * 1000))
    });
  }
  
  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
};

export default function CalendarScheduler({ contactEmail, propertyAddress, onEventCreate, onEventUpdate }: CalendarSchedulerProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    type: 'showing',
    attendees: [],
    reminders: [{ time: 60, sent: false }, { time: 15, sent: false }],
    status: 'scheduled'
  });

  useEffect(() => {
    setEvents(generateMockEvents());
  }, []);

  const getEventTypeConfig = (type: CalendarEvent['type']) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];
  };

  const getStatusColor = (status: CalendarEvent['status']) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      rescheduled: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status];
  };

  const createEventFromEmail = () => {
    if (!contactEmail) return;

    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 24); // Default to tomorrow
    startTime.setMinutes(0, 0, 0);

    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const event: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: `Property Showing${propertyAddress ? ` - ${propertyAddress}` : ''}`,
      type: 'showing',
      start: startTime,
      end: endTime,
      location: propertyAddress ? {
        address: propertyAddress,
        type: 'property'
      } : undefined,
      attendees: [
        {
          name: contactEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          email: contactEmail,
          role: 'client'
        }
      ],
      notes: 'Auto-scheduled from email inquiry',
      status: 'scheduled',
      reminders: [
        { time: 60, sent: false },
        { time: 15, sent: false }
      ],
      followUpRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setEvents(prev => [...prev, event].sort((a, b) => a.start.getTime() - b.start.getTime()));
    onEventCreate?.(event);
    return event;
  };

  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.start) return;

    const event: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: newEvent.title,
      type: newEvent.type || 'showing',
      start: newEvent.start,
      end: newEvent.end || new Date(newEvent.start.getTime() + 60 * 60 * 1000),
      location: newEvent.location,
      attendees: newEvent.attendees || [],
      property: newEvent.property,
      notes: newEvent.notes || '',
      status: 'scheduled',
      reminders: [
        { time: 60, sent: false },
        { time: 15, sent: false }
      ],
      followUpRequired: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setEvents(prev => [...prev, event].sort((a, b) => a.start.getTime() - b.start.getTime()));
    onEventCreate?.(event);
    setShowCreateDialog(false);
    setNewEvent({
      type: 'showing',
      attendees: [],
      reminders: [{ time: 60, sent: false }, { time: 15, sent: false }],
      status: 'scheduled'
    });
  };

  const weekDays = getWeekDays(currentDate);
  const todayEvents = getEventsForDate(new Date());
  const upcomingEvents = events.filter(e => e.start > new Date()).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Calendar & Scheduling</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {contactEmail && (
            <Button onClick={createEventFromEmail} size="sm" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Schedule
            </Button>
          )}
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Today's Events</p>
                <p className="text-2xl font-bold text-blue-800">{todayEvents.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">This Week</p>
                <p className="text-2xl font-bold text-green-800">
                  {events.filter(e => {
                    const eventWeek = getWeekDays(e.start);
                    return weekDays.some(day => eventWeek.some(ewDay => ewDay.toDateString() === day.toDateString()));
                  }).length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Showings</p>
                <p className="text-2xl font-bold text-purple-800">
                  {events.filter(e => e.type === 'showing').length}
                </p>
              </div>
              <Home className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Follow-ups</p>
                <p className="text-2xl font-bold text-orange-800">
                  {events.filter(e => e.followUpRequired).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Week View */}
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Week View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  const dayEvents = getEventsForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border rounded-lg ${
                        isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-800' : 'text-gray-800'}`}>
                        {day.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.map(event => {
                          const typeConfig = getEventTypeConfig(event.type);
                          const TypeIcon = typeConfig.icon;
                          
                          return (
                            <motion.div
                              key={event.id}
                              whileHover={{ scale: 1.02 }}
                              className={`p-2 rounded text-xs cursor-pointer ${typeConfig.color}`}
                              onClick={() => setSelectedEvent(event)}
                            >
                              <div className="flex items-center gap-1">
                                <TypeIcon className="h-3 w-3" />
                                <span className="truncate">{formatTime(event.start)}</span>
                              </div>
                              <div className="truncate font-medium">{event.title}</div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Today's Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {todayEvents.length === 0 ? (
                <p className="text-sm text-gray-600">No events today</p>
              ) : (
                <div className="space-y-2">
                  {todayEvents.map(event => {
                    const typeConfig = getEventTypeConfig(event.type);
                    const TypeIcon = typeConfig.icon;
                    
                    return (
                      <div
                        key={event.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <TypeIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">{formatTime(event.start)}</span>
                          <Badge className={getStatusColor(event.status)} variant="outline">
                            {event.status}
                          </Badge>
                        </div>
                        <div className="text-sm">{event.title}</div>
                        {event.location && (
                          <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {event.location.address}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingEvents.map(event => {
                  const typeConfig = getEventTypeConfig(event.type);
                  const TypeIcon = typeConfig.icon;
                  
                  return (
                    <div
                      key={event.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <TypeIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {event.start.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm">{event.title}</div>
                      <div className="text-xs text-gray-600">
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>Schedule a new appointment or meeting</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Event Type</label>
                <Select value={newEvent.type} onValueChange={(value) => setNewEvent({...newEvent, type: value as CalendarEvent['type']})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newEvent.title || ''}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="Event title"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date & Time</label>
                <Input
                  type="datetime-local"
                  value={newEvent.start ? newEvent.start.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setNewEvent({...newEvent, start: new Date(e.target.value)})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">End Date & Time</label>
                <Input
                  type="datetime-local"
                  value={newEvent.end ? newEvent.end.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setNewEvent({...newEvent, end: new Date(e.target.value)})}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                value={newEvent.location?.address || ''}
                onChange={(e) => setNewEvent({
                  ...newEvent, 
                  location: { address: e.target.value, type: 'other' }
                })}
                placeholder="Event location"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={newEvent.notes || ''}
                onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent}>
                Create Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          {selectedEvent && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${getEventTypeConfig(selectedEvent.type).color}`}>
                    {React.createElement(getEventTypeConfig(selectedEvent.type).icon, { className: "h-5 w-5" })}
                  </div>
                  <div>
                    <DialogTitle>{selectedEvent.title}</DialogTitle>
                    <DialogDescription>
                      {selectedEvent.start.toLocaleDateString()} • {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                    </DialogDescription>
                  </div>
                  <Badge className={getStatusColor(selectedEvent.status)}>
                    {selectedEvent.status}
                  </Badge>
                </div>
              </DialogHeader>
              
              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{selectedEvent.location.address}</span>
                </div>
              )}
              
              {selectedEvent.attendees.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Attendees</h4>
                  <div className="space-y-2">
                    {selectedEvent.attendees.map((attendee, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{attendee.name}</div>
                          <div className="text-sm text-gray-600">{attendee.email}</div>
                        </div>
                        <Badge variant="outline">{attendee.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedEvent.property && (
                <div>
                  <h4 className="font-medium mb-2">Property Details</h4>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Address:</strong> {selectedEvent.property.address}</div>
                      <div><strong>Type:</strong> {selectedEvent.property.type}</div>
                      <div><strong>Price:</strong> ${selectedEvent.property.price.toLocaleString()}</div>
                      {selectedEvent.property.mls && (
                        <div><strong>MLS:</strong> {selectedEvent.property.mls}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedEvent.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded">{selectedEvent.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}