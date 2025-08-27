import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { decryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';

/**
 * Get email threads associated with a pipeline lead
 * Finds threads where the participant email matches the lead's contact email
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { leadId } = params;

    // Get the lead with contact information
    const lead = await prisma.lead.findFirst({
      where: { 
        id: leadId, 
        orgId 
      },
      include: {
        contact: {
          select: {
            id: true,
            emailEnc: true,
            nameEnc: true
          }
        }
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    let contactEmail: string | null = null;
    let contactName: string | null = null;

    // Decrypt contact information
    if (lead.contact?.emailEnc) {
      try {
        const emailBytes = await decryptForOrg(orgId, lead.contact.emailEnc, 'contact:email');
        contactEmail = new TextDecoder().decode(emailBytes).toLowerCase();
      } catch (error) {
        console.error('Failed to decrypt contact email:', error);
      }
    }

    if (lead.contact?.nameEnc) {
      try {
        const nameBytes = await decryptForOrg(orgId, lead.contact.nameEnc, 'contact:name');
        contactName = new TextDecoder().decode(nameBytes);
      } catch (error) {
        console.error('Failed to decrypt contact name:', error);
      }
    }

    if (!contactEmail) {
      return NextResponse.json({ 
        threads: [], 
        contactInfo: { email: null, name: contactName },
        message: 'No contact email found for this lead'
      });
    }

    // Find all email threads where this contact is a participant
    const threads = await prisma.emailThread.findMany({
      where: {
        orgId,
        messages: {
          some: {
            OR: [
              {
                fromEnc: {
                  not: null
                }
              },
              {
                toEnc: {
                  not: null
                }
              }
            ]
          }
        }
      },
      include: {
        messages: {
          select: {
            id: true,
            fromEnc: true,
            toEnc: true,
            sentAt: true
          },
          orderBy: {
            sentAt: 'desc'
          },
          take: 1 // Get latest message for thread info
        },
        aiAnalysis: {
          select: {
            category: true,
            urgency: true,
            keyEntities: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Filter threads by decrypting and checking email addresses
    const matchingThreads = [];
    
    for (const thread of threads) {
      let isMatch = false;
      
      for (const message of thread.messages) {
        try {
          // Check FROM email
          if (message.fromEnc) {
            const fromBytes = await decryptForOrg(orgId, message.fromEnc, 'email:from');
            const fromStr = new TextDecoder().decode(fromBytes);
            // Extract email from "Name <email@domain.com>" format
            const emailMatch = fromStr.match(/<([^>]+)>/) || [null, fromStr];
            const fromEmail = emailMatch[1] || fromStr;
            
            if (fromEmail.toLowerCase().trim() === contactEmail) {
              isMatch = true;
              break;
            }
          }
          
          // Check TO emails
          if (message.toEnc) {
            const toBytes = await decryptForOrg(orgId, message.toEnc, 'email:to');
            const toStr = new TextDecoder().decode(toBytes);
            const toEmails = toStr.split(',').map(email => {
              const emailMatch = email.match(/<([^>]+)>/) || [null, email];
              return (emailMatch[1] || email).toLowerCase().trim();
            });
            
            if (toEmails.includes(contactEmail)) {
              isMatch = true;
              break;
            }
          }
        } catch (error) {
          console.error('Error decrypting email addresses:', error);
        }
      }
      
      if (isMatch) {
        // Decrypt thread subject for display
        let subject = 'No Subject';
        if (thread.subjectEnc) {
          try {
            const subjectBytes = await decryptForOrg(orgId, thread.subjectEnc, 'email:subject');
            subject = new TextDecoder().decode(subjectBytes);
          } catch (error) {
            console.error('Error decrypting subject:', error);
          }
        }

        // Build participants list
        const participants = [];
        for (const message of thread.messages) {
          try {
            if (message.fromEnc) {
              const fromBytes = await decryptForOrg(orgId, message.fromEnc, 'email:from');
              const fromStr = new TextDecoder().decode(fromBytes);
              
              const nameMatch = fromStr.match(/([^<]+)</) || [null, fromStr.split('@')[0]];
              const emailMatch = fromStr.match(/<([^>]+)>/) || [null, fromStr];
              
              participants.push({
                name: nameMatch[1]?.trim() || emailMatch[1]?.split('@')[0] || 'Unknown',
                email: emailMatch[1] || fromStr
              });
            }
          } catch (error) {
            console.error('Error building participants:', error);
          }
        }

        matchingThreads.push({
          id: thread.id,
          subject,
          participants: participants.slice(0, 3), // Limit to avoid clutter
          lastMessageAt: thread.messages[0]?.sentAt || thread.updatedAt,
          messageCount: thread.messageCount,
          unread: thread.unread,
          starred: thread.starred,
          aiAnalysis: thread.aiAnalysis ? {
            category: thread.aiAnalysis.category,
            urgency: thread.aiAnalysis.urgency,
            keyEntities: thread.aiAnalysis.keyEntities
          } : null
        });
      }
    }

    return NextResponse.json({
      threads: matchingThreads,
      contactInfo: {
        email: contactEmail,
        name: contactName
      },
      totalThreads: matchingThreads.length
    });

  } catch (error) {
    console.error('Lead threads API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead threads' },
      { status: 500 }
    );
  }
}