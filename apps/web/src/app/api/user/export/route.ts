import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        orgMembers: {
          include: {
            org: true
          }
        },
        emailAccounts: {
          include: {
            org: true
          }
        },
        oauthAccounts: true
      }
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Create export data object
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      organizations: user.orgMembers.map(member => ({
        id: member.org.id,
        name: member.org.name,
        role: member.role,
        joinedAt: member.createdAt
      })),
      emailAccounts: user.emailAccounts.map(account => ({
        id: account.id,
        email: account.email,
        provider: account.provider,
        status: account.status,
        createdAt: account.createdAt
      })),
      oauthAccounts: user.oauthAccounts.map(account => ({
        id: account.id,
        provider: account.provider,
        status: account.status,
        createdAt: account.createdAt
      }))
    };

    // Convert to JSON string
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Create response with proper headers for file download
    return new Response(jsonData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="rivor-data-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    console.error('Failed to export user data:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
