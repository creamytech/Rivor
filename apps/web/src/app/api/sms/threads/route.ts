import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/auth';
import { prisma } from '@rivor/db';

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
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get all SMS threads (conversations) with latest message
    const threads = await prisma.$queryRaw`
      SELECT DISTINCT ON (
        CASE 
          WHEN contact_id IS NOT NULL THEN contact_id
          ELSE phone_number 
        END
      )
      sm.contact_id,
      sm.phone_number,
      c.name as contact_name,
      c.avatar as contact_avatar,
      sm.content as last_message_content,
      sm.direction as last_message_direction,
      sm.created_at as last_message_at,
      sm.status as last_message_status,
      (
        SELECT COUNT(*)
        FROM sms_messages sm2 
        WHERE sm2.user_id = ${session.user.id}
        AND (
          (sm2.contact_id = sm.contact_id AND sm.contact_id IS NOT NULL)
          OR (sm2.phone_number = sm.phone_number AND sm.contact_id IS NULL)
        )
        AND sm2.direction = 'INBOUND'
        AND sm2.read_at IS NULL
      ) as unread_count,
      (
        SELECT COUNT(*)
        FROM sms_messages sm3
        WHERE sm3.user_id = ${session.user.id}
        AND (
          (sm3.contact_id = sm.contact_id AND sm.contact_id IS NOT NULL)
          OR (sm3.phone_number = sm.phone_number AND sm.contact_id IS NULL)
        )
      ) as total_messages
      FROM sms_messages sm
      LEFT JOIN contacts c ON c.id = sm.contact_id
      WHERE sm.user_id = ${session.user.id}
      AND (
        ${search === '' ? true : false}
        OR LOWER(c.name) LIKE LOWER(${'%' + search + '%'})
        OR sm.phone_number LIKE ${'%' + search + '%'}
      )
      ORDER BY 
        CASE 
          WHEN contact_id IS NOT NULL THEN contact_id
          ELSE phone_number 
        END,
        sm.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    ` as any[];

    // Transform the results
    const formattedThreads = threads.map((thread: any) => ({
      id: thread.contact_id || `phone_${thread.phone_number}`,
      contactId: thread.contact_id,
      contactName: thread.contact_name || formatPhoneNumber(thread.phone_number),
      phoneNumber: thread.phone_number,
      avatar: thread.contact_avatar,
      lastMessage: {
        content: thread.last_message_content,
        direction: thread.last_message_direction,
        status: thread.last_message_status,
        timestamp: thread.last_message_at
      },
      unreadCount: parseInt(thread.unread_count || '0'),
      totalMessages: parseInt(thread.total_messages || '0'),
      lastMessageAt: thread.last_message_at,
      isActive: true
    }));

    // Get total thread count for pagination
    const totalThreadsQuery = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT 
        CASE 
          WHEN contact_id IS NOT NULL THEN contact_id
          ELSE phone_number 
        END
      ) as count
      FROM sms_messages 
      WHERE user_id = ${session.user.id}
    ` as any[];

    const totalThreads = parseInt(totalThreadsQuery[0]?.count || '0');

    return NextResponse.json({
      threads: formattedThreads,
      totalCount: totalThreads,
      hasMore: offset + limit < totalThreads
    });

  } catch (error) {
    console.error('SMS Threads Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to format phone numbers
function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const number = cleaned.substring(1);
    return `+1 (${number.substring(0, 3)}) ${number.substring(3, 6)}-${number.substring(6)}`;
  } else if (cleaned.length === 10) {
    return `+1 (${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  
  return phoneNumber;
}