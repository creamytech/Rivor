import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/auth';
import { prisma } from '@rivor/db';

interface SendBlueResponse {
  success: boolean;
  message_id?: string;
  error?: string;
  status?: string;
}

interface SMSRequest {
  phoneNumber: string;
  message: string;
  contactId?: string;
  scheduled?: Date;
}

// SendBlue API configuration
const SENDBLUE_API_URL = 'https://api.sendblue.co/api/send-message';
const SENDBLUE_USER_ID = process.env.SENDBLUE_USER_ID;
const SENDBLUE_API_KEY = process.env.SENDBLUE_API_KEY;

async function sendToSendBlue(phoneNumber: string, message: string): Promise<SendBlueResponse> {
  try {
    const response = await fetch(SENDBLUE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'sb-api-key-id': SENDBLUE_USER_ID || '',
        'sb-api-secret-key': SENDBLUE_API_KEY || ''
      },
      body: JSON.stringify({
        number: phoneNumber,
        content: message
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send message');
    }

    return {
      success: true,
      message_id: data.message_id,
      status: data.status
    };
  } catch (error) {
    console.error('SendBlue API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Validate SendBlue credentials
    if (!SENDBLUE_USER_ID || !SENDBLUE_API_KEY) {
      return NextResponse.json(
        { error: 'SendBlue API credentials not configured' },
        { status: 500 }
      );
    }

    const body: SMSRequest = await request.json();
    const { phoneNumber, message, contactId, scheduled } = body;

    // Validate request
    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Validate phone number format
    if (!cleanPhoneNumber.match(/^\+?1?\d{10}$/)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Check for rate limiting (basic implementation)
    const userId = session.user.id;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentMessages = await prisma.sMSMessage.count({
      where: {
        userId: userId,
        createdAt: { gte: oneHourAgo },
        direction: 'OUTBOUND'
      }
    });

    // Rate limit: 100 messages per hour per user
    if (recentMessages >= 100) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    let sendBlueResponse: SendBlueResponse;
    
    if (scheduled && new Date(scheduled) > new Date()) {
      // For scheduled messages, we'll store them and process later
      // This would require a background job system
      sendBlueResponse = {
        success: true,
        message_id: `scheduled_${Date.now()}`,
        status: 'scheduled'
      };
    } else {
      // Send immediately
      sendBlueResponse = await sendToSendBlue(cleanPhoneNumber, message);
    }

    if (!sendBlueResponse.success) {
      return NextResponse.json(
        { error: sendBlueResponse.error || 'Failed to send message' },
        { status: 400 }
      );
    }

    // Store message in database
    const smsMessage = await prisma.sMSMessage.create({
      data: {
        id: sendBlueResponse.message_id || `msg_${Date.now()}`,
        userId: userId,
        contactId: contactId,
        phoneNumber: cleanPhoneNumber,
        content: message,
        direction: 'OUTBOUND',
        status: sendBlueResponse.status === 'scheduled' ? 'SCHEDULED' : 'SENT',
        sendBlueMessageId: sendBlueResponse.message_id,
        scheduledAt: scheduled ? new Date(scheduled) : null,
        metadata: {
          sendBlueResponse: sendBlueResponse
        }
      }
    });

    // Update contact's last contact date if contactId provided
    if (contactId) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { lastContactedAt: new Date() }
      }).catch(err => {
        console.error('Failed to update contact last contacted:', err);
        // Don't fail the SMS send if contact update fails
      });
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        userId: userId,
        type: 'SMS_SENT',
        description: `SMS sent to ${cleanPhoneNumber}`,
        metadata: {
          phoneNumber: cleanPhoneNumber,
          messageId: smsMessage.id,
          contactId: contactId,
          messagePreview: message.length > 50 ? message.substring(0, 50) + '...' : message
        }
      }
    }).catch(err => {
      console.error('Failed to create activity log:', err);
      // Don't fail the SMS send if activity log fails
    });

    return NextResponse.json({
      success: true,
      messageId: smsMessage.id,
      status: smsMessage.status,
      sentAt: smsMessage.createdAt
    });

  } catch (error) {
    console.error('SMS Send Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve SMS conversation history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');
    const phoneNumber = searchParams.get('phoneNumber');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!contactId && !phoneNumber) {
      return NextResponse.json(
        { error: 'Either contactId or phoneNumber is required' },
        { status: 400 }
      );
    }

    const whereCondition: any = {
      userId: session.user.id
    };

    if (contactId) {
      whereCondition.contactId = contactId;
    } else if (phoneNumber) {
      whereCondition.phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
    }

    const messages = await prisma.sMSMessage.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            avatar: true
          }
        }
      }
    });

    const totalCount = await prisma.sMSMessage.count({
      where: whereCondition
    });

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to show oldest first
      totalCount,
      hasMore: offset + limit < totalCount
    });

  } catch (error) {
    console.error('SMS Get Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}