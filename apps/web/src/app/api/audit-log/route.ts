import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

/**
 * Get audit log entries
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const range = url.searchParams.get('range') || '7d';
    const category = url.searchParams.get('category') || '';
    const search = url.searchParams.get('search') || '';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Calculate date range
    const now = new Date();
    const rangeMap = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    const days = rangeMap[range as keyof typeof rangeMap] || 7;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // For now, return demo data since we don't have an audit log table yet
    const generateDemoLogs = () => {
      const actions = [
        { action: 'sign_in', resource: 'auth', details: 'User signed in successfully', category: 'auth', severity: 'low' },
        { action: 'connect_google', resource: 'integration', details: 'Connected Google account for email sync', category: 'integration', severity: 'medium' },
        { action: 'create_lead', resource: 'lead', details: 'Created new lead: "Enterprise Client"', category: 'data', severity: 'low' },
        { action: 'invite_user', resource: 'user', details: 'Invited new user: colleague@company.com', category: 'user_management', severity: 'medium' },
        { action: 'update_settings', resource: 'settings', details: 'Updated notification preferences', category: 'settings', severity: 'low' },
        { action: 'delete_contact', resource: 'contact', details: 'Deleted contact: John Doe', category: 'data', severity: 'high' },
        { action: 'export_data', resource: 'data', details: 'Exported contact data (CSV)', category: 'data', severity: 'medium' },
        { action: 'email_sync', resource: 'email', details: 'Synced 15 new emails from Gmail', category: 'integration', severity: 'low' }
      ];

      return Array.from({ length: Math.min(limit, 20) }, (_, i) => {
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        const timestamp = new Date(now.getTime() - Math.random() * days * 24 * 60 * 60 * 1000);
        
        // Apply filters
        if (category && randomAction.category !== category) return null;
        if (search && !randomAction.details.toLowerCase().includes(search.toLowerCase())) return null;
        
        return {
          id: `audit-${i + 1}`,
          timestamp: timestamp.toISOString(),
          userId: 'user-1',
          userName: 'John Smith',
          userEmail: session.user.email,
          action: randomAction.action,
          resource: randomAction.resource,
          resourceId: `resource-${i + 1}`,
          details: randomAction.details,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: randomAction.severity,
          category: randomAction.category
        };
      }).filter(Boolean).sort((a, b) => new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime());
    };

    const logs = generateDemoLogs();

    return NextResponse.json({ 
      logs,
      total: logs.length,
      range: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    });

  } catch (error: any) {
    console.error('Audit log API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
