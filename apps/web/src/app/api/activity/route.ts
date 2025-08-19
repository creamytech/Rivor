import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const activities = [
    {
      id: '1',
      type: 'email',
      title: 'New lead detected from email',
      description: 'Sarah Johnson from TechCorp inquired about enterprise pricing',
      timestamp: '2 min ago',
      status: 'urgent',
    },
    {
      id: '2',
      type: 'meeting',
      title: 'Meeting scheduled for tomorrow',
      description: 'Product demo with Acme Corp at 2:00 PM',
      timestamp: '5 min ago',
      status: 'pending',
    },
    {
      id: '3',
      type: 'lead',
      title: 'Pipeline stage updated',
      description: 'Lead "John Smith" moved to Proposal stage',
      timestamp: '8 min ago',
      status: 'completed',
    },
    {
      id: '4',
      type: 'chat',
      title: 'AI assistant responded',
      description: 'Generated follow-up email for recent inquiry',
      timestamp: '12 min ago',
      status: 'completed',
    },
    {
      id: '5',
      type: 'task',
      title: 'Task completed: Follow up call',
      description: 'Successfully contacted 3 prospects',
      timestamp: '15 min ago',
      status: 'completed',
    },
  ];

  return NextResponse.json({ activities });
}
