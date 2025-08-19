export interface Notification {
  id: string;
  type: 'email' | 'meeting' | 'lead' | 'system' | 'integration' | 'task';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  entityId?: string;
}

export const notifications: Notification[] = [
  {
    id: '1',
    type: 'lead',
    title: 'New Lead Detected',
    message: 'Sarah Johnson from TechCorp inquired about enterprise pricing. Lead automatically created.',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    isRead: false,
    priority: 'high',
    entityId: 'lead-1'
  },
  {
    id: '2',
    type: 'email',
    title: 'Email Integration Connected',
    message: 'Gmail integration successfully connected. Syncing emails and detecting leads.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isRead: false,
    priority: 'medium'
  },
  {
    id: '3',
    type: 'meeting',
    title: 'Meeting Scheduled',
    message: 'Product demo with Acme Corp scheduled for tomorrow at 2:00 PM.',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    isRead: true,
    priority: 'medium'
  },
  {
    id: '4',
    type: 'system',
    title: 'System Update',
    message: 'New features available: AI-powered email drafting and advanced analytics.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isRead: true,
    priority: 'low'
  },
  {
    id: '5',
    type: 'task',
    title: 'Task Completed',
    message: 'Follow-up call with John Smith completed successfully.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isRead: true,
    priority: 'low'
  },
  {
    id: '6',
    type: 'integration',
    title: 'Calendar Sync Issue',
    message: 'Calendar sync temporarily paused. Will resume automatically.',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    isRead: false,
    priority: 'medium'
  }
];
