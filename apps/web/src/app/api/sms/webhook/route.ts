import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@rivor/db';

interface SendBlueWebhookPayload {
  message_id: string;
  number: string;
  content: string;
  media_url?: string;
  is_outbound: boolean;
  status: 'delivered' | 'read' | 'failed' | 'sent';
  error_code?: string;
  error_message?: string;
  timestamp: string;
  account_email: string;
}

// Webhook endpoint for SendBlue to send delivery receipts and incoming messages
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (implement based on SendBlue documentation)
    const webhookSecret = process.env.SENDBLUE_WEBHOOK_SECRET;
    
    if (webhookSecret) {
      const signature = request.headers.get('x-sendblue-signature');
      // Implement signature verification here
      // const body = await request.text();
      // const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
      // if (signature !== expectedSignature) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      // }
    }

    const payload: SendBlueWebhookPayload = await request.json();
    const { message_id, number, content, media_url, is_outbound, status, timestamp } = payload;

    // Clean phone number
    const cleanPhoneNumber = number.replace(/[^\d+]/g, '');

    if (is_outbound) {
      // This is a delivery receipt for an outbound message
      await prisma.sMSMessage.updateMany({
        where: {
          sendBlueMessageId: message_id,
          direction: 'OUTBOUND'
        },
        data: {
          status: status.toUpperCase() as any,
          deliveredAt: status === 'delivered' || status === 'read' ? new Date(timestamp) : null,
          readAt: status === 'read' ? new Date(timestamp) : null,
          failedAt: status === 'failed' ? new Date(timestamp) : null,
          metadata: {
            ...{},
            webhookStatus: status,
            lastWebhookAt: new Date().toISOString()
          }
        }
      });

      return NextResponse.json({ success: true });
    } else {
      // This is an incoming message
      try {
        // Try to find existing contact by phone number
        let contact = await prisma.contact.findFirst({
          where: {
            phoneNumber: cleanPhoneNumber
          }
        });

        // Create new contact if not found
        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              name: `Contact ${cleanPhoneNumber}`,
              phoneNumber: cleanPhoneNumber,
              source: 'SMS',
              status: 'ACTIVE',
              // Note: We'd need to determine organizationId somehow
              // This is a simplified version
              organizationId: 'default-org-id'
            }
          });
        }

        // Store the incoming message
        await prisma.sMSMessage.create({
          data: {
            id: message_id,
            userId: contact.ownerId || 'system', // You'd need to determine the user
            contactId: contact.id,
            phoneNumber: cleanPhoneNumber,
            content: content,
            mediaUrl: media_url,
            direction: 'INBOUND',
            status: 'RECEIVED',
            sendBlueMessageId: message_id,
            metadata: {
              webhookPayload: payload,
              receivedAt: new Date().toISOString()
            }
          }
        });

        // Update contact's last contact date
        await prisma.contact.update({
          where: { id: contact.id },
          data: { 
            lastContactedAt: new Date(),
            // Increment unread count or mark as unread
          }
        });

        // Create activity log
        await prisma.activity.create({
          data: {
            userId: contact.ownerId || 'system',
            type: 'SMS_RECEIVED',
            description: `SMS received from ${cleanPhoneNumber}`,
            metadata: {
              phoneNumber: cleanPhoneNumber,
              messageId: message_id,
              contactId: contact.id,
              messagePreview: content.length > 50 ? content.substring(0, 50) + '...' : content
            }
          }
        });

        // Here you could also trigger real-time notifications
        // using WebSockets, Server-Sent Events, or push notifications

        return NextResponse.json({ success: true, contactId: contact.id });

      } catch (error) {
        console.error('Error processing incoming SMS:', error);
        return NextResponse.json(
          { error: 'Failed to process incoming message' },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('SMS Webhook Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification (some services require this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({ status: 'SMS webhook endpoint active' });
}