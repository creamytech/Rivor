"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FlowCard from '@/components/river/FlowCard';
import StatusBadge from '@/components/river/StatusBadge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Star,
  Mail,
  Phone,
  Building2,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  ExternalLink,
  MessageCircle,
  UserPlus,
  Activity,
  Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contact } from './ContactsList';

interface ContactActivity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'lead_created';
  title: string;
  description: string;
  date: string;
  linkedEmailId?: string;
  linkedLeadId?: string;
}

interface ContactDetailProps {
  contactId: string;
  onBack: () => void;
  className?: string;
}

export default function ContactDetail({ contactId, onBack, className }: ContactDetailProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [activities, setActivities] = useState<ContactActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactDetail();
  }, [contactId]);

  const fetchContactDetail = async () => {
    setLoading(true);
    try {
      const [contactRes, activitiesRes] = await Promise.all([
        fetch(`/api/contacts/${contactId}`),
        fetch(`/api/contacts/${contactId}/activities`)
      ]);

      if (contactRes.ok) {
        const contactData = await contactRes.json();
        setContact(contactData);
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch contact details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStarContact = async () => {
    if (!contact) return;
    
    try {
      const response = await fetch(`/api/contacts/${contactId}/star`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setContact(prev => prev ? { ...prev, starred: !prev.starred } : null);
      }
    } catch (error) {
      console.error('Failed to star contact:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-gradient-to-br from-teal-400 to-azure-400',
      'bg-gradient-to-br from-blue-400 to-indigo-400', 
      'bg-gradient-to-br from-purple-400 to-pink-400',
      'bg-gradient-to-br from-green-400 to-emerald-400',
      'bg-gradient-to-br from-orange-400 to-red-400'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: ContactActivity['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'call':
        return <Phone className="h-4 w-4 text-green-500" />;
      case 'meeting':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'lead_created':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <FlowCard className={className}>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </FlowCard>
    );
  }

  if (!contact) {
    return (
      <FlowCard className={className}>
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Contact not found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            The contact you're looking for might have been moved or deleted.
          </p>
          <Button onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
        </div>
      </FlowCard>
    );
  }

  return (
    <FlowCard className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleStarContact}
              variant="outline"
              size="sm"
            >
              <Star className={cn(
                'h-4 w-4 mr-2',
                contact.starred ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'
              )} />
              {contact.starred ? 'Starred' : 'Star'}
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {contact.avatarUrl ? (
              <img 
                src={contact.avatarUrl} 
                alt={contact.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl',
                getAvatarColor(contact.name)
              )}>
                {getInitials(contact.name)}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {contact.name}
              </h1>
              {contact.starred && (
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              )}
            </div>

            {contact.title && (
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-1">
                {contact.title}
              </p>
            )}

            {contact.company && (
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700 dark:text-slate-300">{contact.company}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{contact.email}</span>
                </div>
                
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{contact.phone}</span>
                  </div>
                )}

                {contact.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{contact.location}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <StatusBadge
                    status="connected"
                    label={`${contact.emailCount} emails`}
                    showIcon={false}
                  />
                  {contact.leadCount > 0 && (
                    <StatusBadge
                      status="live"
                      label={`${contact.leadCount} leads`}
                      showIcon={false}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Clock className="h-4 w-4" />
                  <span>Added {new Date(contact.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-3">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          <Button variant="outline">
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Create Lead
          </Button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Activity Timeline
          </h3>

          {activities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity yet</p>
              <p className="text-sm mt-1">Activity will appear as you interact with this contact</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {activity.title}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {formatDateTime(activity.date)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {activity.description}
                    </p>

                    {(activity.linkedEmailId || activity.linkedLeadId) && (
                      <div className="flex items-center gap-2 mt-2">
                        {activity.linkedEmailId && (
                          <Button variant="ghost" size="sm" className="h-6 text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Email
                          </Button>
                        )}
                        {activity.linkedLeadId && (
                          <Button variant="ghost" size="sm" className="h-6 text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Lead
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FlowCard>
  );
}
