import { EventEmitter } from 'events';
import { prisma } from './db';

export const notificationEmitter = new EventEmitter();

export async function createNotification(data: {
  orgId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  priority?: string;
}) {
  const notification = await prisma.notification.create({
    data: {
      orgId: data.orgId,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || 'low',
    },
  });

  notificationEmitter.emit('notification', notification);
  return notification;
}

export function getNotificationStream() {
  return notificationEmitter;
}

export async function markNotificationRead(id: string, orgId: string, userId: string) {
  await prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markNotificationUnread(id: string, orgId: string, userId: string) {
  await prisma.notification.update({
    where: { id },
    data: { isRead: false, readAt: null },
  });
}

export async function markAllNotificationsRead(orgId: string, userId: string) {
  await prisma.notification.updateMany({
    where: { orgId, userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

/**
 * Create a notification for an auto-drafted reply
 */
export async function createDraftNotification(
  orgId: string,
  userId: string,
  draftId: string,
  emailSubject: string,
  emailFrom: string,
  category: string
): Promise<string | null> {
  try {
    const categoryNames: Record<string, string> = {
      'showing_request': 'Showing Request',
      'hot_lead': 'Hot Lead',
      'seller_lead': 'Seller Lead',
      'buyer_lead': 'Buyer Lead',
      'price_inquiry': 'Price Inquiry'
    };

    const categoryName = categoryNames[category] || 'Email';
    const priority = category === 'hot_lead' ? 'high' : 'medium';

    const notification = await createNotification({
      orgId,
      userId,
      type: 'draft',
      title: `AI Draft Ready - ${categoryName}`,
      message: `Auto-drafted reply for "${emailSubject.substring(0, 50)}" from ${emailFrom}`,
      priority
    });

    return notification.id;
  } catch (error) {
    console.error('Failed to create draft notification:', error);
    return null;
  }
}

/**
 * Get the user ID for an organization (first user in org)
 */
export async function getOrgUserId(orgId: string): Promise<string | null> {
  try {
    const orgMember = await prisma.orgMember.findFirst({
      where: { orgId },
      include: { user: true }
    });

    return orgMember?.userId || null;
  } catch (error) {
    console.error('Failed to get org user ID:', error);
    return null;
  }
}

