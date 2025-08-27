import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { decryptForOrg, encryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';

/**
 * AI-Powered Appointment Scheduling System
 * Replaces human assistant for scheduling, confirmations, and reminders
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const {
      contactId,
      leadId,
      emailThreadId,
      appointmentType,
      scheduledAt,
      duration = 60,
      location,
      propertyAddress,
      lockboxCode,
      showingInstructions,
      attendeeEmails = [],
      requirements,
      autoConfirm = false
    } = await req.json();

    if (!appointmentType || !scheduledAt) {
      return NextResponse.json({ 
        error: 'Appointment type and scheduled time required' 
      }, { status: 400 });
    }

    // Validate the scheduled time is in the future
    if (new Date(scheduledAt) <= new Date()) {
      return NextResponse.json({ 
        error: 'Appointment must be scheduled in the future' 
      }, { status: 400 });
    }

    // Check for conflicts with existing appointments
    const conflictCheck = await checkAppointmentConflicts(
      orgId, 
      new Date(scheduledAt), 
      duration,
      propertyAddress
    );

    if (conflictCheck.hasConflict) {
      return NextResponse.json({ 
        error: 'Time slot conflict detected',
        conflicts: conflictCheck.conflicts,
        suggestions: await getSuggestedAlternatives(orgId, new Date(scheduledAt), duration)
      }, { status: 409 });
    }

    // Generate confirmation and reschedule tokens
    const confirmationToken = generateSecureToken();
    const rescheduleToken = generateSecureToken();

    // Create the appointment
    const appointment = await prisma.automatedAppointment.create({
      data: {
        orgId,
        contactId,
        leadId,
        emailThreadId,
        appointmentType,
        scheduledAt: new Date(scheduledAt),
        duration,
        location,
        propertyAddress,
        lockboxCode,
        showingInstructions,
        attendeeEmails,
        requirements,
        confirmationToken,
        rescheduleToken,
        status: autoConfirm ? 'confirmed' : 'pending',
        createdBy: session.user.id || session.user.email,
        remindersSent: []
      }
    });

    // Auto-generate AI appointment notes
    const aiNotes = await generateAppointmentNotes(appointment, contactId, leadId);
    
    if (aiNotes) {
      await prisma.automatedAppointment.update({
        where: { id: appointment.id },
        data: { aiNotes }
      });
    }

    // Send confirmation email automatically
    await sendAppointmentConfirmation(appointment);

    // Schedule automated reminders
    await scheduleAutomatedReminders(appointment);

    // Trigger follow-up sequence setup
    if (appointment.status === 'confirmed') {
      await setupPostAppointmentFollowUp(appointment);
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        appointmentType: appointment.appointmentType,
        scheduledAt: appointment.scheduledAt.toISOString(),
        duration: appointment.duration,
        status: appointment.status,
        confirmationToken: appointment.confirmationToken,
        confirmationUrl: `${process.env.NEXTAUTH_URL}/appointment/confirm/${appointment.confirmationToken}`,
        rescheduleUrl: `${process.env.NEXTAUTH_URL}/appointment/reschedule/${appointment.rescheduleToken}`,
        aiNotes
      }
    });

  } catch (error) {
    console.error('Failed to create automated appointment:', error);
    return NextResponse.json(
      { error: 'Failed to schedule appointment' },
      { status: 500 }
    );
  }
}

/**
 * Get appointments with filtering and intelligent insights
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const appointmentType = url.searchParams.get('type');
    const contactId = url.searchParams.get('contactId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const where: any = { orgId };
    
    if (status) where.status = status;
    if (appointmentType) where.appointmentType = appointmentType;
    if (contactId) where.contactId = contactId;
    
    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt.gte = new Date(startDate);
      if (endDate) where.scheduledAt.lte = new Date(endDate);
    }

    const appointments = await prisma.automatedAppointment.findMany({
      where,
      include: {
        contact: true,
        lead: true
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit
    });

    // Generate AI insights for the appointment schedule
    const insights = await generateScheduleInsights(orgId, appointments);

    return NextResponse.json({
      appointments: appointments.map(apt => ({
        ...apt,
        scheduledAt: apt.scheduledAt.toISOString(),
        createdAt: apt.createdAt.toISOString(),
        updatedAt: apt.updatedAt.toISOString(),
        completedAt: apt.completedAt?.toISOString(),
        cancelledAt: apt.cancelledAt?.toISOString()
      })),
      insights,
      summary: {
        total: appointments.length,
        byStatus: {
          pending: appointments.filter(a => a.status === 'pending').length,
          confirmed: appointments.filter(a => a.status === 'confirmed').length,
          completed: appointments.filter(a => a.status === 'completed').length,
          cancelled: appointments.filter(a => a.status === 'cancelled').length
        },
        byType: appointments.reduce((acc, apt) => {
          acc[apt.appointmentType] = (acc[apt.appointmentType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Failed to get appointments:', error);
    return NextResponse.json(
      { error: 'Failed to get appointments' },
      { status: 500 }
    );
  }
}

async function checkAppointmentConflicts(
  orgId: string, 
  scheduledAt: Date, 
  duration: number,
  propertyAddress?: string
) {
  const startTime = scheduledAt;
  const endTime = new Date(scheduledAt.getTime() + duration * 60 * 1000);
  
  // Check for overlapping appointments
  const conflicts = await prisma.automatedAppointment.findMany({
    where: {
      orgId,
      status: { in: ['pending', 'confirmed'] },
      OR: [
        {
          scheduledAt: {
            gte: startTime,
            lt: endTime
          }
        },
        {
          AND: [
            { scheduledAt: { lte: startTime } },
            // Calculate end time dynamically
          ]
        }
      ],
      ...(propertyAddress && { propertyAddress })
    },
    include: {
      contact: true
    }
  });

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}

async function getSuggestedAlternatives(
  orgId: string, 
  requestedTime: Date, 
  duration: number
) {
  const suggestions = [];
  const baseDate = new Date(requestedTime);
  
  // Suggest times before and after the requested time
  const timeSlots = [
    new Date(baseDate.getTime() - 60 * 60 * 1000), // 1 hour before
    new Date(baseDate.getTime() - 30 * 60 * 1000), // 30 min before
    new Date(baseDate.getTime() + 30 * 60 * 1000), // 30 min after
    new Date(baseDate.getTime() + 60 * 60 * 1000), // 1 hour after
    new Date(baseDate.getTime() + 24 * 60 * 60 * 1000), // Next day same time
  ];

  for (const timeSlot of timeSlots) {
    const conflict = await checkAppointmentConflicts(orgId, timeSlot, duration);
    if (!conflict.hasConflict && timeSlot > new Date()) {
      suggestions.push({
        scheduledAt: timeSlot.toISOString(),
        available: true
      });
    }
  }

  return suggestions.slice(0, 3); // Return top 3 suggestions
}

function generateSecureToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function generateAppointmentNotes(
  appointment: any,
  contactId?: string,
  leadId?: string
): Promise<string> {
  try {
    const context = [];
    
    if (contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: contactId }
      });
      if (contact) {
        context.push(`Contact: ${contact.nameEnc ? '[Encrypted Name]' : 'Unknown'}`);
      }
    }

    if (leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: leadId }
      });
      if (lead) {
        context.push(`Lead: ${lead.title || 'Unknown Lead'}`);
        context.push(`Stage: ${lead.stage || 'Unknown'}`);
        if (lead.propertyValue) {
          context.push(`Property Value: $${lead.propertyValue.toLocaleString()}`);
        }
      }
    }

    const notes = [
      `📅 ${appointment.appointmentType.charAt(0).toUpperCase() + appointment.appointmentType.slice(1)} scheduled`,
      `⏰ Duration: ${appointment.duration} minutes`,
      appointment.propertyAddress ? `📍 Property: ${appointment.propertyAddress}` : null,
      appointment.location ? `🏢 Location: ${appointment.location}` : null,
      ...context,
      `🤖 Auto-scheduled by AI Assistant`
    ].filter(Boolean);

    return notes.join('\n');
  } catch (error) {
    console.error('Error generating appointment notes:', error);
    return `🤖 ${appointment.appointmentType} appointment auto-scheduled`;
  }
}

async function sendAppointmentConfirmation(appointment: any) {
  // This would integrate with email service to send confirmation
  // For now, we'll log the action
  console.log(`📧 Sending appointment confirmation for ${appointment.id}`);
  
  // Update reminders sent tracking
  await prisma.automatedAppointment.update({
    where: { id: appointment.id },
    data: {
      remindersSent: [
        {
          type: 'confirmation',
          sentAt: new Date().toISOString(),
          method: 'email'
        }
      ]
    }
  });
}

async function scheduleAutomatedReminders(appointment: any) {
  // Schedule reminders at 24 hours, 2 hours, and 30 minutes before
  const reminderTimes = [
    { hours: 24, type: '24_hour_reminder' },
    { hours: 2, type: '2_hour_reminder' },
    { minutes: 30, type: '30_minute_reminder' }
  ];

  console.log(`⏰ Scheduling ${reminderTimes.length} automated reminders for appointment ${appointment.id}`);
  
  // In a real implementation, this would schedule background jobs
  // For now, we'll create automation rules that can be processed
  for (const reminder of reminderTimes) {
    const triggerTime = new Date(appointment.scheduledAt);
    if (reminder.hours) {
      triggerTime.setHours(triggerTime.getHours() - reminder.hours);
    } else if (reminder.minutes) {
      triggerTime.setMinutes(triggerTime.getMinutes() - reminder.minutes);
    }

    if (triggerTime > new Date()) {
      await prisma.automationRule.create({
        data: {
          orgId: appointment.orgId,
          name: `${reminder.type}_${appointment.id}`,
          description: `Send ${reminder.type.replace('_', ' ')} for appointment`,
          ruleType: 'schedule_based',
          triggers: {
            appointmentId: appointment.id,
            reminderType: reminder.type
          },
          actions: {
            sendEmail: true,
            emailTemplate: 'appointment_reminder',
            updateAppointment: true
          },
          nextRunAt: triggerTime,
          createdBy: 'system'
        }
      });
    }
  }
}

async function setupPostAppointmentFollowUp(appointment: any) {
  // Create follow-up sequence based on appointment type
  const sequenceType = `${appointment.appointmentType}_followup`;
  
  console.log(`🔄 Setting up post-appointment follow-up sequence: ${sequenceType}`);
  
  // This would trigger a follow-up sequence after the appointment
  // Implementation would depend on the follow-up system
}

async function generateScheduleInsights(orgId: string, appointments: any[]) {
  const now = new Date();
  const thisWeek = appointments.filter(apt => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return apt.scheduledAt >= weekStart && apt.scheduledAt <= weekEnd;
  });

  const insights = [];

  // High-level insights
  if (thisWeek.length > 10) {
    insights.push({
      type: 'high_activity',
      priority: 'medium',
      message: `Busy week ahead: ${thisWeek.length} appointments scheduled`,
      action: 'Consider blocking buffer time between meetings'
    });
  }

  // Cancellation rate insights
  const cancelledRate = appointments.filter(a => a.status === 'cancelled').length / appointments.length;
  if (cancelledRate > 0.2) {
    insights.push({
      type: 'high_cancellation',
      priority: 'high',
      message: `${Math.round(cancelledRate * 100)}% cancellation rate detected`,
      action: 'Review confirmation and reminder processes'
    });
  }

  // Property showing insights
  const showings = appointments.filter(a => a.appointmentType === 'showing');
  if (showings.length > 0) {
    const uniqueProperties = new Set(showings.map(s => s.propertyAddress).filter(Boolean));
    insights.push({
      type: 'property_activity',
      priority: 'low',
      message: `${showings.length} property showings across ${uniqueProperties.size} locations`,
      action: 'Optimize travel routes for maximum efficiency'
    });
  }

  return insights;
}

/**
 * Update appointment status or details
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { appointmentId, status, notes, completedAt, cancelReason } = await req.json();

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 });
    }

    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = completedAt ? new Date(completedAt) : new Date();
      } else if (status === 'cancelled') {
        updateData.cancelledAt = new Date();
        updateData.cancelReason = cancelReason;
      }
    }

    if (notes) {
      updateData.aiNotes = notes;
    }

    const appointment = await prisma.automatedAppointment.update({
      where: { id: appointmentId, orgId },
      data: updateData
    });

    // Trigger appropriate follow-up actions
    if (status === 'completed') {
      await setupPostAppointmentFollowUp(appointment);
    }

    return NextResponse.json({
      success: true,
      appointment
    });

  } catch (error) {
    console.error('Failed to update appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}