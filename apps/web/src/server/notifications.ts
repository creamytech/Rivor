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

