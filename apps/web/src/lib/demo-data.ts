import { getEnv } from '@/server/env';

/**
 * Controls whether demo data should be shown in the UI
 */
export function shouldShowDemoData(): boolean {
  const env = getEnv();
  return env.SHOW_DEMO_DATA;
}

/**
 * Demo data for UI components when SHOW_DEMO_DATA=true
 */
export const demoEmails = [
  {
    id: 'demo-1',
    threadId: 'demo-thread-1',
    subject: 'Q1 Budget Review Meeting',
    from: 'sarah.chen@acmecorp.com',
    snippet: 'Hi team, let\'s schedule our Q1 budget review for next week...',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread: true,
    labels: ['important']
  },
  {
    id: 'demo-2', 
    threadId: 'demo-thread-2',
    subject: 'Product Launch Timeline',
    from: 'mike.johnson@techstart.io',
    snippet: 'Attached is the updated timeline for our product launch...',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    unread: false,
    labels: ['project']
  },
  {
    id: 'demo-3',
    threadId: 'demo-thread-3', 
    subject: 'Re: Partnership Proposal',
    from: 'lisa.park@innovate.com',
    snippet: 'Thanks for the proposal. We\'d like to discuss terms...',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    unread: true,
    labels: ['opportunity']
  }
];

export const demoCalendarEvents = [
  {
    id: 'demo-cal-1',
    title: 'Team Standup',
    start: new Date(Date.now() + 2 * 60 * 60 * 1000),
    end: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
    attendees: ['team@company.com']
  },
  {
    id: 'demo-cal-2',
    title: 'Client Call - Acme Corp',
    start: new Date(Date.now() + 24 * 60 * 60 * 1000),
    end: new Date(Date.now() + 25 * 60 * 60 * 1000),
    attendees: ['sarah.chen@acmecorp.com']
  },
  {
    id: 'demo-cal-3',
    title: 'Product Demo',
    start: new Date(Date.now() + 48 * 60 * 60 * 1000),
    end: new Date(Date.now() + 49 * 60 * 60 * 1000),
    attendees: ['prospects@company.com']
  }
];

export const demoLeads = [
  {
    id: 'demo-lead-1',
    title: 'Enterprise Software License',
    company: 'Acme Corp',
    contact: 'Sarah Chen',
    email: 'sarah.chen@acmecorp.com',
    value: 250000,
    probability: 75,
    stage: 'prospect',
    priority: 'high' as const,
    source: 'email',
    description: 'Large enterprise looking for CRM solution for 500+ users',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: ['enterprise', 'hot-lead', 'urgent']
  },
  {
    id: 'demo-lead-2', 
    title: 'Cloud Migration Project',
    company: 'TechStart.io',
    contact: 'Mike Johnson',
    email: 'mike.johnson@techstart.io',
    value: 75000,
    probability: 50,
    stage: 'qualified',
    priority: 'medium' as const,
    source: 'website',
    description: 'Fast-growing startup needs to migrate from on-premise to cloud',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    tags: ['cloud', 'startup', 'growth']
  },
  {
    id: 'demo-lead-3',
    title: 'Training & Consulting Services',
    company: 'Innovate Inc',
    contact: 'Lisa Park',
    email: 'lisa.park@innovate.com', 
    value: 120000,
    probability: 60,
    stage: 'proposal',
    priority: 'medium' as const,
    source: 'referral',
    description: 'Need comprehensive training program for new software rollout',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['training', 'consulting', 'referral']
  },
  {
    id: 'demo-lead-4',
    title: 'Custom Integration Development',
    company: 'Financial Services Co',
    contact: 'Alex Thompson',
    email: 'alex@finservices.com',
    value: 180000,
    probability: 40,
    stage: 'negotiation',
    priority: 'low' as const,
    source: 'cold-outreach',
    description: 'Need custom API integrations with existing financial systems',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['custom', 'integration', 'financial']
  }
];

export const demoContacts = [
  {
    id: 'demo-contact-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@acmecorp.com',
    company: 'Acme Corp',
    title: 'VP of Operations',
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-contact-2',
    name: 'Mike Johnson',
    email: 'mike.johnson@techstart.io', 
    company: 'TechStart.io',
    title: 'Founder & CEO',
    lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-contact-3',
    name: 'Lisa Park',
    email: 'lisa.park@innovate.com',
    company: 'Innovate Inc',
    title: 'Business Development',
    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

export const demoTasks = [
  {
    id: 'demo-task-1',
    title: 'Follow up on Acme Corp proposal',
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    completed: false,
    priority: 'high'
  },
  {
    id: 'demo-task-2',
    title: 'Prepare demo for TechStart meeting',
    dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    completed: false,
    priority: 'medium'
  },
  {
    id: 'demo-task-3',
    title: 'Research Innovate Inc requirements',
    dueAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    completed: true,
    priority: 'low'
  }
];

/**
 * Wrapper to conditionally return demo data or empty arrays
 */
export function getDemoData<T>(demoArray: T[]): T[] {
  return shouldShowDemoData() ? demoArray : [];
}

/**
 * Mix demo data with real data when demo mode is enabled
 */
export function mixWithDemoData<T>(realData: T[], demoData: T[]): T[] {
  if (!shouldShowDemoData()) {
    return realData;
  }
  
  // If we have real data, show both
  if (realData.length > 0) {
    return [...realData, ...demoData];
  }
  
  // If no real data, show just demo data
  return demoData;
}
