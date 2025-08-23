import { prisma } from './db';
import { leadDetectionService, NotificationPayload } from './lead-detection';
import { logger } from '@/lib/logger';

export interface NotificationConfig {
  emailNotifications: boolean;
  pushNotifications: boolean;
  slackIntegration?: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
  };
  leadThresholds: {
    highPriorityConfidence: number; // 0.8+
    mediumPriorityConfidence: number; // 0.6+
    autoCreateLeads: boolean;
  };
}

export interface NotificationTemplate {
  type: 'lead_detected' | 'follow_up_needed' | 'hot_lead' | 'deal_closed';
  title: string;
  emailTemplate?: string;
  pushTemplate?: string;
  slackTemplate?: string;
}

export class NotificationService {
  private defaultConfig: NotificationConfig = {
    emailNotifications: true,
    pushNotifications: true,
    leadThresholds: {
      highPriorityConfidence: 0.8,
      mediumPriorityConfidence: 0.6,
      autoCreateLeads: true
    }
  };

  private notificationTemplates: Record<string, NotificationTemplate> = {
    lead_detected: {
      type: 'lead_detected',
      title: 'New Lead Detected',
      emailTemplate: `
        <h2>🎯 New Lead Detected</h2>
        <p>Our AI has identified a potential lead from your recent email communications.</p>
        <p><strong>Confidence:</strong> {{confidence}}%</p>
        <p><strong>Reason:</strong> {{reason}}</p>
        <p><strong>Contact:</strong> {{contactInfo}}</p>
        <a href="{{actionUrl}}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Lead</a>
      `,
      pushTemplate: 'New lead detected with {{confidence}}% confidence: {{reason}}',
      slackTemplate: `🎯 *New Lead Detected*\n*Confidence:* {{confidence}}%\n*Reason:* {{reason}}\n*Contact:* {{contactInfo}}\n<{{actionUrl}}|View Lead>`
    },
    hot_lead: {
      type: 'hot_lead',
      title: 'Hot Lead Alert',
      emailTemplate: `
        <h2>🔥 Hot Lead Alert</h2>
        <p>High-priority lead detected! This looks very promising.</p>
        <p><strong>Confidence:</strong> {{confidence}}%</p>
        <p><strong>Reason:</strong> {{reason}}</p>
        <p><strong>Urgency:</strong> Immediate action recommended</p>
        <a href="{{actionUrl}}" style="background: #ff4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Take Action Now</a>
      `,
      pushTemplate: '🔥 Hot lead alert! {{confidence}}% confidence - immediate action needed',
      slackTemplate: `🔥 *HOT LEAD ALERT* 🔥\n*Confidence:* {{confidence}}%\n*Reason:* {{reason}}\n⚡ *Action needed ASAP*\n<{{actionUrl}}|Take Action Now>`
    },
    follow_up_needed: {
      type: 'follow_up_needed',
      title: 'Follow-up Required',
      emailTemplate: `
        <h2>⏰ Follow-up Required</h2>
        <p>A lead requires your attention for follow-up.</p>
        <p><strong>Lead:</strong> {{leadTitle}}</p>
        <p><strong>Last Contact:</strong> {{lastContact}}</p>
        <p><strong>Next Action:</strong> {{nextAction}}</p>
        <a href="{{actionUrl}}" style="background: #00aa44; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Follow Up</a>
      `,
      pushTemplate: 'Follow-up needed for lead: {{leadTitle}}',
      slackTemplate: `⏰ *Follow-up Required*\n*Lead:* {{leadTitle}}\n*Last Contact:* {{lastContact}}\n*Next Action:* {{nextAction}}\n<{{actionUrl}}|Follow Up>`
    },
    deal_closed: {
      type: 'deal_closed',
      title: 'Deal Closed',
      emailTemplate: `
        <h2>🎉 Deal Closed!</h2>
        <p>Congratulations! A deal has been successfully closed.</p>
        <p><strong>Deal:</strong> {{dealTitle}}</p>
        <p><strong>Value:</strong> {{dealValue}}</p>
        <p><strong>Contact:</strong> {{contactInfo}}</p>
        <a href="{{actionUrl}}" style="background: #00aa44; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Deal</a>
      `,
      pushTemplate: '🎉 Deal closed: {{dealTitle}} - {{dealValue}}',
      slackTemplate: `🎉 *Deal Closed!* 🎉\n*Deal:* {{dealTitle}}\n*Value:* {{dealValue}}\n*Contact:* {{contactInfo}}\n<{{actionUrl}}|View Deal>`
    }
  };

  /**
   * Get notification configuration for an organization
   */
  async getNotificationConfig(orgId: string): Promise<NotificationConfig> {
    try {
      // Check if org has custom notification settings stored
      const orgSettings = await prisma.org.findUnique({
        where: { id: orgId },
        select: { id: true } // We'll extend this to include notification settings later
      });

      if (!orgSettings) {
        throw new Error(`Organization ${orgId} not found`);
      }

      // For now, return default config - can be extended to store custom settings
      return this.defaultConfig;

    } catch (error) {
      logger.error('Failed to get notification config', {
        orgId,
        error: error instanceof Error ? error.message : String(error)
      });
      return this.defaultConfig;
    }
  }

  /**
   * Send notification based on payload and org configuration
   */
  async sendNotification(
    orgId: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      const config = await this.getNotificationConfig(orgId);
      
      // Create database notification record
      await this.createDatabaseNotification(orgId, payload);

      // Send via configured channels
      const promises: Promise<void>[] = [];

      if (config.emailNotifications) {
        promises.push(this.sendEmailNotification(orgId, payload));
      }

      if (config.pushNotifications) {
        promises.push(this.sendPushNotification(orgId, payload));
      }

      if (config.slackIntegration?.enabled) {
        promises.push(this.sendSlackNotification(orgId, payload, config.slackIntegration));
      }

      // Execute all notification methods in parallel
      await Promise.allSettled(promises);

      logger.info('Notification sent successfully', {
        orgId,
        type: payload.type,
        priority: payload.priority,
        channels: {
          email: config.emailNotifications,
          push: config.pushNotifications,
          slack: config.slackIntegration?.enabled || false
        },
        action: 'notification_sent'
      });

    } catch (error) {
      logger.error('Failed to send notification', {
        orgId,
        payload: payload.type,
        error: error instanceof Error ? error.message : String(error),
        action: 'notification_failed'
      });
      throw error;
    }
  }

  /**
   * Create database notification record
   */
  private async createDatabaseNotification(
    orgId: string,
    payload: NotificationPayload
  ): Promise<void> {
    // Get all org members to notify
    const orgMembers = await prisma.orgMember.findMany({
      where: { orgId },
      include: { user: true }
    });

    // Create notification record for each member
    for (const member of orgMembers) {
      await prisma.notification.create({
        data: {
          orgId,
          userId: member.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          priority: payload.priority,
          actionUrl: payload.actionUrl,
          metadata: {
            leadId: payload.leadId,
            threadId: payload.threadId
          }
        }
      });
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    orgId: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      // Get organization members with email addresses
      const orgMembers = await prisma.orgMember.findMany({
        where: { orgId },
        include: { user: true }
      });

      const template = this.notificationTemplates[payload.type];
      if (!template?.emailTemplate) {
        logger.warn('No email template found for notification type', {
          orgId,
          type: payload.type
        });
        return;
      }

      for (const member of orgMembers) {
        if (!member.user.email) continue;

        const emailContent = this.renderTemplate(template.emailTemplate, {
          ...payload,
          recipient: member.user.name || member.user.email
        });

        // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
        // For now, we'll just log the action
        logger.info('Email notification queued', {
          orgId,
          type: payload.type,
          recipient: member.user.email,
          action: 'email_notification_queued'
        });

        // TODO: Implement actual email sending
        // await emailService.send({
        //   to: member.user.email,
        //   subject: template.title,
        //   html: emailContent
        // });
      }

    } catch (error) {
      logger.error('Email notification failed', {
        orgId,
        type: payload.type,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Send push notification (placeholder for web push API integration)
   */
  private async sendPushNotification(
    orgId: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      const template = this.notificationTemplates[payload.type];
      if (!template?.pushTemplate) return;

      const pushContent = this.renderTemplate(template.pushTemplate, payload);

      // Here you would integrate with web push API or service like Firebase
      logger.info('Push notification queued', {
        orgId,
        type: payload.type,
        message: pushContent,
        action: 'push_notification_queued'
      });

      // TODO: Implement actual push notification
      // await pushService.send({
      //   title: template.title,
      //   body: pushContent,
      //   data: { actionUrl: payload.actionUrl }
      // });

    } catch (error) {
      logger.error('Push notification failed', {
        orgId,
        type: payload.type,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(
    orgId: string,
    payload: NotificationPayload,
    slackConfig: NonNullable<NotificationConfig['slackIntegration']>
  ): Promise<void> {
    try {
      const template = this.notificationTemplates[payload.type];
      if (!template?.slackTemplate) return;

      const slackContent = this.renderTemplate(template.slackTemplate, payload);

      // Send to Slack webhook
      const response = await fetch(slackConfig.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: slackConfig.channel,
          text: slackContent,
          username: 'Rivor Bot',
          icon_emoji: payload.type === 'hot_lead' ? ':fire:' : ':bell:'
        })
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
      }

      logger.info('Slack notification sent', {
        orgId,
        type: payload.type,
        channel: slackConfig.channel,
        action: 'slack_notification_sent'
      });

    } catch (error) {
      logger.error('Slack notification failed', {
        orgId,
        type: payload.type,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Render notification template with variables
   */
  private renderTemplate(template: string, variables: any): string {
    let rendered = template;
    
    Object.keys(variables).forEach(key => {
      const value = variables[key];
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(placeholder, String(value || ''));
    });

    return rendered;
  }

  /**
   * Process email thread and determine if notification should be sent
   */
  async processEmailForNotifications(
    orgId: string,
    threadId: string
  ): Promise<void> {
    try {
      const config = await this.getNotificationConfig(orgId);
      
      // Get the latest message in thread
      const latestMessage = await prisma.emailMessage.findFirst({
        where: { 
          orgId,
          threadId 
        },
        orderBy: { sentAt: 'desc' },
        include: { thread: true }
      });

      if (!latestMessage) return;

      // Skip if we've already processed this thread recently
      const recentNotification = await prisma.notification.findFirst({
        where: {
          orgId,
          type: 'lead_detected',
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Within last hour
          },
          metadata: {
            path: ['threadId'],
            equals: threadId
          }
        }
      });

      if (recentNotification) {
        logger.info('Thread already processed recently', {
          orgId,
          threadId,
          action: 'notification_skipped'
        });
        return;
      }

      // Use lead detection service to analyze
      const leadResult = await leadDetectionService.analyzeMessageForLead(
        orgId,
        latestMessage.id,
        threadId
      );

      // Determine notification priority based on confidence
      let shouldNotify = false;
      let priority: 'low' | 'medium' | 'high' = 'low';
      let notificationType: 'lead_detected' | 'hot_lead' = 'lead_detected';

      if (leadResult.confidence >= config.leadThresholds.highPriorityConfidence) {
        shouldNotify = true;
        priority = 'high';
        notificationType = 'hot_lead';
      } else if (leadResult.confidence >= config.leadThresholds.mediumPriorityConfidence) {
        shouldNotify = true;
        priority = 'medium';
        notificationType = 'lead_detected';
      }

      if (shouldNotify && leadResult.isLead) {
        // Auto-create lead if configured
        let leadId: string | undefined;
        if (config.leadThresholds.autoCreateLeads) {
          leadId = await leadDetectionService.createLeadFromEmail(
            orgId,
            threadId,
            latestMessage.id,
            leadResult
          );
        }

        // Send notification
        await this.sendNotification(orgId, {
          type: notificationType,
          leadId,
          threadId,
          title: notificationType === 'hot_lead' ? 'Hot Lead Alert!' : 'New Lead Detected',
          message: leadResult.reason,
          priority,
          actionUrl: leadId ? `/leads/${leadId}` : `/inbox/thread/${threadId}`
        });

        logger.info('Lead notification triggered', {
          orgId,
          threadId,
          leadId,
          confidence: leadResult.confidence,
          type: notificationType,
          action: 'lead_notification_triggered'
        });
      }

    } catch (error) {
      logger.error('Email notification processing failed', {
        orgId,
        threadId,
        error: error instanceof Error ? error.message : String(error),
        action: 'notification_processing_failed'
      });
    }
  }

  /**
   * Get notification history for organization
   */
  async getNotificationHistory(
    orgId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    priority: string;
    createdAt: Date;
    read: boolean;
    actionUrl?: string;
  }>> {
    const notifications = await prisma.notification.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        priority: true,
        createdAt: true,
        read: true,
        actionUrl: true
      }
    });

    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });
  }
}

export const notificationService = new NotificationService();