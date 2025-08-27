import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not available in production', { status: 403 });
  }

  // In development, use default values if no session
  const session = await auth();
  let userEmail = 'dev@test.com';
  let userName = 'Dev User';

  if (session?.user?.email) {
    userEmail = session.user.email;
    userName = session.user.name || 'Dev User';
  }

  try {
    // Check if user exists and create org if needed
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { orgMembers: true }
    });

    if (!user) {
      // Create user
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userName,
          timezone: 'America/New_York'
        },
        include: { orgMembers: true }
      });
    }

    // Find or create org for this user
    let org = await prisma.org.findFirst({ 
      where: { 
        name: userEmail,
        ownerUserId: user.id 
      } 
    });
    
    if (!org) {
      // Create org with encryption blob (dummy for development)
      const encryptedDekBlob = new Uint8Array(32); // Dummy encryption for dev
      const slug = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      org = await prisma.org.create({
        data: {
          name: userEmail,
          slug,
          ownerUserId: user.id,
          brandName: 'Dev Company',
          encryptedDekBlob: Buffer.from(encryptedDekBlob),
          retentionDays: 365
        }
      });

      // Create org membership
      await prisma.orgMember.create({
        data: {
          userId: user.id,
          orgId: org.id,
          role: 'owner'
        }
      });
    }

    // Clear existing accounts to avoid duplicates
    await prisma.emailAccount.deleteMany({ where: { orgId: org.id } });
    await prisma.calendarAccount.deleteMany({ where: { orgId: org.id } });

    // Create mock email account
    const emailAccount = await prisma.emailAccount.create({
      data: {
        orgId: org.id,
        provider: 'google',
        email: userEmail,
        displayName: userName,
        externalAccountId: 'dev-google-account-1',
        status: 'connected',
        syncStatus: 'idle',
        encryptionStatus: 'ok',
        lastSyncedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      }
    });

    // Create mock calendar account
    const calendarAccount = await prisma.calendarAccount.create({
      data: {
        orgId: org.id,
        provider: 'google',
        email: userEmail,
        displayName: userName,
        externalAccountId: 'dev-google-calendar-1',
        status: 'connected',
        syncStatus: 'idle',
        lastSyncedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      }
    });

    // Create some mock email data
    const emailThread = await prisma.emailThread.create({
      data: {
        orgId: org.id,
        accountId: emailAccount.id,
        googleThreadId: 'mock-thread-1',
        subjectEnc: Buffer.from('Property Inquiry - 123 Main St'),
        participantsEnc: Buffer.from('john@example.com'),
        status: 'active'
      }
    });

    await prisma.emailMessage.create({
      data: {
        orgId: org.id,
        threadId: emailThread.id,
        googleMessageId: 'mock-message-1',
        subjectEnc: Buffer.from('Property Inquiry - 123 Main St'),
        fromEnc: Buffer.from('john@example.com'),
        toEnc: Buffer.from(userEmail),
        bodyRefEnc: Buffer.from('Hi, I\'m interested in the property at 123 Main St. Could you provide more details?'),
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: false
      }
    });

    // Create some mock calendar events
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    await prisma.calendarEvent.create({
      data: {
        orgId: org.id,
        accountId: calendarAccount.id,
        googleEventId: 'mock-event-1',
        titleEnc: Buffer.from('Property Showing - 456 Oak Ave'),
        locationEnc: Buffer.from('456 Oak Ave'),
        start: tomorrow,
        end: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hour later
        allDay: false
      }
    });

    await prisma.calendarEvent.create({
      data: {
        orgId: org.id,
        accountId: calendarAccount.id,
        googleEventId: 'mock-event-2',
        titleEnc: Buffer.from('Client Meeting - Real Estate Planning'),
        locationEnc: Buffer.from('Office'),
        start: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
        end: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
        allDay: false
      }
    });

    return Response.json({
      success: true,
      message: 'Development accounts and data created successfully',
      accounts: {
        email: {
          id: emailAccount.id,
          provider: emailAccount.provider,
          email: emailAccount.email
        },
        calendar: {
          id: calendarAccount.id,
          provider: calendarAccount.provider,
          email: calendarAccount.email
        }
      },
      mockData: {
        emailThreads: 1,
        emailMessages: 1,
        calendarEvents: 2
      }
    });

  } catch (error) {
    console.error('Failed to setup development accounts:', error);
    return Response.json({
      success: false,
      message: 'Failed to setup development accounts',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}