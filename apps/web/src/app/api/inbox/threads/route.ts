import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { decryptForOrg } from '@/server/crypto';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50'); // Increased default limit
    const filter = url.searchParams.get('filter') || 'all';
    const search = url.searchParams.get('search') || ''; // Search query parameter
    const since = url.searchParams.get('since'); // Get threads newer than this timestamp
    const offset = (page - 1) * limit;

    // Calculate 90 days ago date for inbox display filtering
    // Note: This only filters the inbox view, it doesn't delete any emails
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // If 'since' parameter provided, use it to get only newer threads
    const timeFilter = since ? new Date(since) : ninetyDaysAgo;
    
    console.log(`📅 Time filter active: ${timeFilter.toISOString()} ${since ? '(since parameter)' : '(90-day default)'}`);

    // Build where clause based on filter
    const whereClause: any = {
      orgId
      // Removed messages requirement to show all threads
    };

    // Apply filters based on thread properties
    switch (filter) {
      case 'unread':
        whereClause.unread = true;
        break;
      case 'starred':
        whereClause.starred = true;
        break;
      case 'attachments':
        // whereClause.messages = { some: { attachments: { some: {} } } }; // Not implemented yet
        break;
    }

    // Build filter conditions
    let filterCondition = '';
    if (filter === 'unread') {
      filterCondition = 'AND et.unread = true';
    } else if (filter === 'starred') {
      filterCondition = 'AND et.starred = true';
    }
    
    console.log(`🔍 Search query: "${search}"`);
    
    // Note: Since email data is encrypted, we'll fetch threads normally 
    // and filter by search term after decryption

    // Get threads with proper sorting by latest message date (last 90 days only)
    const threadsQuery = `
      SELECT 
        et.id,
        et."orgId",
        et."accountId",
        et."subjectEnc",
        et."participantsEnc",
        et."createdAt",
        et."updatedAt",
        et.labels,
        et.starred,
        et.unread,
        MAX(em."sentAt") as latest_message_date,
        COUNT(em.id) as message_count
      FROM "EmailThread" et
      INNER JOIN "EmailMessage" em ON et.id = em."threadId"
      WHERE et."orgId" = $1
        AND em."sentAt" >= $4
        ${filterCondition}
      GROUP BY et.id, et."orgId", et."accountId", et."subjectEnc", et."participantsEnc", 
               et."createdAt", et."updatedAt", 
               et.labels, et.starred, et.unread
      HAVING MAX(em."sentAt") >= $4
      ORDER BY latest_message_date DESC NULLS LAST
      LIMIT $2 OFFSET $3
    `;
    
    const threads = await prisma.$queryRawUnsafe(threadsQuery, orgId, limit, offset, timeFilter);

    // Get total count for pagination (also filtered by last 90 days)
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT DISTINCT et.id
        FROM "EmailThread" et
        INNER JOIN "EmailMessage" em ON et.id = em."threadId"
        WHERE et."orgId" = $1
          AND em."sentAt" >= $2
          ${filterCondition}
        GROUP BY et.id
        HAVING MAX(em."sentAt") >= $2
      ) subquery
    `;
    
    const totalCountResult = await prisma.$queryRawUnsafe(countQuery, orgId, timeFilter);
    const totalCount = Number((totalCountResult as any)[0]?.total || 0);
    
    console.log(`📊 Threads found (last 90 days): ${totalCount}`);

    // Transform to UI format - process each thread
    const threadsFormatted = await Promise.all((threads as any[]).map(async (thread: any) => {
      // Get the latest message for this thread to extract real data
      const latestMessage = await prisma.emailMessage.findFirst({
        where: { threadId: thread.id },
        select: {
          id: true,
          subjectEnc: true,
          fromEnc: true,
          toEnc: true,
          ccEnc: true,
          bccEnc: true,
          sentAt: true
        },
        orderBy: { sentAt: 'desc' }
      });

      // Get AI analysis for the latest message if it exists
      let aiAnalysis = null;
      if (latestMessage?.id) {
        aiAnalysis = await prisma.emailAIAnalysis.findUnique({
          where: { emailId: latestMessage.id },
          select: {
            category: true,
            priorityScore: true,
            leadScore: true,
            confidenceScore: true,
            sentimentScore: true,
            keyEntities: true,
            processingStatus: true,
            createdAt: true
          }
        });
      }

      // Decrypt sensitive data for display
      let participants: Array<{ name: string; email: string }> = [];
      let subject = 'No Subject';
      
      try {
        // Decrypt subject from message
        if (latestMessage?.subjectEnc) {
          const subjectBytes = await decryptForOrg(orgId, latestMessage.subjectEnc, 'email:subject');
          subject = new TextDecoder().decode(subjectBytes);
        }
        
        // Decrypt and parse participants
        if (latestMessage?.fromEnc) {
          const fromBytes = await decryptForOrg(orgId, latestMessage.fromEnc, 'email:from');
          const from = new TextDecoder().decode(fromBytes);
          
          // Parse from field
          const fromMatch = from.match(/([^<]+)<([^>]+)>/) || [null, from, from];
          const fromName = fromMatch[1]?.trim() || from.split('@')[0];
          const fromEmail = fromMatch[2] || from;
          
          participants.push({
            name: fromName,
            email: fromEmail.toLowerCase()
          });
        }
        
        // Decrypt and add to/cc recipients
        if (latestMessage?.toEnc) {
          const toBytes = await decryptForOrg(orgId, latestMessage.toEnc, 'email:to');
          const to = new TextDecoder().decode(toBytes);
          
          // Parse multiple recipients
          const toEmails = to.split(',').map(e => e.trim());
          for (const email of toEmails) {
            if (email && email !== participants[0]?.email) {
              const emailMatch = email.match(/([^<]+)<([^>]+)>/) || [null, email, email];
              const name = emailMatch[1]?.trim() || email.split('@')[0];
              const emailAddr = emailMatch[2] || email;
              
              participants.push({
                name: name,
                email: emailAddr.toLowerCase()
              });
            }
          }
        }
        
      } catch (error) {
        console.error('Failed to decrypt email data:', error);
        // Fallback to default values
        participants = [{ 
          name: 'Email Contact', 
          email: 'contact@example.com' 
        }];
      }
      
      // If no participants found, create a default one
      if (participants.length === 0) {
        participants = [{ 
          name: 'Email Contact', 
          email: 'contact@example.com' 
        }];
      }
      
      // Create a better snippet showing the conversation
      let snippet = 'Email content available';
      if (participants.length > 1) {
        const from = participants[0]?.name || participants[0]?.email || 'Unknown';
        const to = participants.slice(1).map((p: any) => p.name || p.email).join(', ') || 'Unknown';
        snippet = `From: ${from} | To: ${to}`;
      } else if (participants.length === 1) {
        snippet = `From: ${participants[0]?.name || participants[0]?.email || 'Unknown'}`;
      }
      
      return {
        id: thread.id,
        subject: subject,
        snippet: snippet,
        participants: participants,
        messageCount: Number(thread.message_count) || 0,
        unread: thread.unread || false,
        starred: thread.starred || false,
        hasAttachments: false, // Not implemented yet
        labels: thread.labels || [],
        lastMessageAt: thread.latest_message_date?.toISOString() || thread.updatedAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
        // AI Analysis data
        aiAnalysis: aiAnalysis ? {
          category: aiAnalysis.category,
          priorityScore: aiAnalysis.priorityScore,
          leadScore: aiAnalysis.leadScore,
          confidenceScore: aiAnalysis.confidenceScore,
          sentimentScore: aiAnalysis.sentimentScore,
          keyEntities: aiAnalysis.keyEntities,
          processingStatus: aiAnalysis.processingStatus,
          analyzedAt: aiAnalysis.createdAt.toISOString()
        } : null,
        // Real estate specific fields derived from AI analysis
        emailType: aiAnalysis?.category || 'general',
        priority: aiAnalysis?.priorityScore >= 80 ? 'high' : aiAnalysis?.priorityScore >= 60 ? 'medium' : 'low',
        leadScore: aiAnalysis?.leadScore || 0,
        requiresFollowUp: aiAnalysis?.priorityScore >= 70 || ['hot_lead', 'showing_request', 'seller_lead', 'buyer_lead'].includes(aiAnalysis?.category || ''),
        sentiment: aiAnalysis?.sentimentScore >= 0.7 ? 'positive' : aiAnalysis?.sentimentScore <= 0.3 ? 'negative' : 'neutral',
        urgency: aiAnalysis?.priorityScore ? Math.ceil(aiAnalysis.priorityScore / 10) : 1,
        propertyInfo: aiAnalysis?.keyEntities ? {
          address: aiAnalysis.keyEntities.addresses?.[0],
          price: aiAnalysis.keyEntities.priceRange,
          propertyType: aiAnalysis.keyEntities.propertyType,
        } : undefined,
        extractedData: aiAnalysis?.keyEntities ? {
          budget: aiAnalysis.keyEntities.priceRange ? { min: 0, max: 0 } : undefined,
          preferredLocations: aiAnalysis.keyEntities.addresses || [],
          propertyTypes: aiAnalysis.keyEntities.propertyType ? [aiAnalysis.keyEntities.propertyType] : [],
          timeline: aiAnalysis.keyEntities.timeframes?.[0],
        } : undefined
      };
    }));

    // Apply search filtering after decryption
    let filteredThreads = threadsFormatted;
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      console.log(`🔍 Applying search filter for: "${searchTerm}"`);
      
      filteredThreads = threadsFormatted.filter(thread => {
        // Search in subject
        const subjectMatch = thread.subject?.toLowerCase().includes(searchTerm);
        
        // Search in participant names and emails
        const participantMatch = thread.participants.some(participant => 
          participant.name?.toLowerCase().includes(searchTerm) ||
          participant.email?.toLowerCase().includes(searchTerm)
        );
        
        // Enhanced AI analysis search
        let aiMatch = false;
        if (thread.aiAnalysis) {
          const analysis = thread.aiAnalysis;
          
          // Search in summary
          const summaryMatch = analysis.keyEntities?.summary?.toLowerCase().includes(searchTerm);
          
          // Search in category (convert underscore to space and check both formats)
          const categoryText = analysis.category?.replace('_', ' ') || '';
          const categoryMatch = categoryText.toLowerCase().includes(searchTerm) ||
                               analysis.category?.toLowerCase().includes(searchTerm);
          
          // Search in urgency level
          const urgencyMatch = analysis.urgency?.toLowerCase().includes(searchTerm);
          
          // Search in key entities
          const entitiesMatch = analysis.keyEntities ? (
            analysis.keyEntities.people?.some((person: string) => person.toLowerCase().includes(searchTerm)) ||
            analysis.keyEntities.properties?.some((property: string) => property.toLowerCase().includes(searchTerm)) ||
            analysis.keyEntities.amounts?.some((amount: string) => amount.toLowerCase().includes(searchTerm)) ||
            analysis.keyEntities.dates?.some((date: string) => date.toLowerCase().includes(searchTerm))
          ) : false;
          
          // Smart search for common real estate terms
          const isRealEstateSearch = /showing|property|house|home|listing|tour|viewing|appointment|visit/i.test(searchTerm);
          const isLeadSearch = /lead|hot|buyer|seller|client|prospect/i.test(searchTerm);
          const isPriceSearch = /price|cost|value|budget|offer|deal/i.test(searchTerm);
          
          let smartMatch = false;
          if (isRealEstateSearch && analysis.category === 'showing_request') smartMatch = true;
          if (isLeadSearch && ['hot_lead', 'buyer_lead', 'seller_lead'].includes(analysis.category || '')) smartMatch = true;
          if (isPriceSearch && analysis.category === 'price_inquiry') smartMatch = true;
          
          aiMatch = summaryMatch || categoryMatch || urgencyMatch || entitiesMatch || smartMatch;
        }
        
        const matches = subjectMatch || participantMatch || aiMatch;
        return matches;
      });
      
      console.log(`🔍 Search results: ${filteredThreads.length}/${threadsFormatted.length} threads match "${searchTerm}"`);
    }

    // Recalculate pagination for filtered results
    const filteredTotal = search && search.trim() ? filteredThreads.length : totalCount;
    const startIndex = (page - 1) * limit;
    const paginatedThreads = search && search.trim() ? 
      filteredThreads.slice(startIndex, startIndex + limit) : 
      filteredThreads;

    return NextResponse.json({
      threads: paginatedThreads,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit)
      }
    });

  } catch (error) {
    logger.error('Failed to fetch threads', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return NextResponse.json(
      { error: 'Failed to fetch threads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}