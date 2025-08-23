import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

interface UserSettings {
  profile: {
    name: string;
    email: string;
    company: string;
    phone: string;
    timezone: string;
    language: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    leadAlerts: boolean;
    taskReminders: boolean;
    weeklyReports: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    compactMode: boolean;
    animations: boolean;
  };
  integrations: {
    googleCalendar: boolean;
    docusign: boolean;
    zoom: boolean;
    slack: boolean;
  };
  privacy: {
    dataSharing: boolean;
    analytics: boolean;
    marketingEmails: boolean;
    twoFactorAuth: boolean;
  };
}

export async function GET() {
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
        }
      }
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    const org = user.orgMembers[0]?.org;

    // Build settings object from user data and defaults
    const settings: UserSettings = {
      profile: {
        name: user.name || '',
        email: user.email,
        company: org?.name || '',
        phone: '', // Would need to add phone field to user model
        timezone: user.timezone,
        language: 'en-US' // Would need to add language field to user model
      },
      notifications: {
        emailNotifications: true, // Default values - could store in user preferences
        pushNotifications: true,
        leadAlerts: true,
        taskReminders: true,
        weeklyReports: false
      },
      appearance: {
        theme: 'system', // Default theme
        accentColor: 'blue',
        compactMode: false,
        animations: true
      },
      integrations: {
        googleCalendar: false, // Check actual integrations status
        docusign: false,
        zoom: false,
        slack: false
      },
      privacy: {
        dataSharing: false,
        analytics: true,
        marketingEmails: false,
        twoFactorAuth: false // Check if user has 2FA enabled
      }
    };

    // Check actual integration statuses
    if (org) {
      const emailAccounts = await prisma.emailAccount.findMany({
        where: { orgId: org.id, provider: 'google' }
      });
      settings.integrations.googleCalendar = emailAccounts.length > 0;

      const calendarAccounts = await prisma.calendarAccount.findMany({
        where: { orgId: org.id, provider: 'google' }
      });
      settings.integrations.googleCalendar = calendarAccounts.length > 0;
    }

    return Response.json(settings);
  } catch (error) {
    console.error('Failed to fetch user settings:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const settings = await request.json() as Partial<UserSettings>;

    // Update user profile fields if provided
    if (settings.profile) {
      const updateData: any = {};
      
      if (settings.profile.name !== undefined) {
        updateData.name = settings.profile.name;
      }
      
      if (settings.profile.timezone !== undefined) {
        updateData.timezone = settings.profile.timezone;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { email: session.user.email },
          data: updateData
        });
      }
    }

    // In a real implementation, you would store other settings in a separate
    // user preferences table or extend the user model with additional fields

    // For now, return the updated settings (you might want to fetch them again)
    const updatedUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        orgMembers: {
          include: { org: true }
        }
      }
    });

    if (!updatedUser) {
      return new Response('User not found', { status: 404 });
    }

    const org = updatedUser.orgMembers[0]?.org;

    // Return updated settings structure
    const updatedSettings: UserSettings = {
      profile: {
        name: updatedUser.name || '',
        email: updatedUser.email,
        company: org?.name || '',
        phone: settings.profile?.phone || '',
        timezone: updatedUser.timezone,
        language: settings.profile?.language || 'en-US'
      },
      notifications: settings.notifications || {
        emailNotifications: true,
        pushNotifications: true,
        leadAlerts: true,
        taskReminders: true,
        weeklyReports: false
      },
      appearance: settings.appearance || {
        theme: 'system',
        accentColor: 'blue',
        compactMode: false,
        animations: true
      },
      integrations: settings.integrations || {
        googleCalendar: false,
        docusign: false,
        zoom: false,
        slack: false
      },
      privacy: settings.privacy || {
        dataSharing: false,
        analytics: true,
        marketingEmails: false,
        twoFactorAuth: false
      }
    };

    return Response.json({
      success: true,
      settings: updatedSettings,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Failed to update user settings:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}