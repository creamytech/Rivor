import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { getThreadWithMessages } from '@/server/email';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Check if OpenAI API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is not configured in environment variables');
}

// AI reply generation prompt
const REPLY_GENERATION_PROMPT = `You are an AI assistant helping real estate agents craft professional email responses.

Based on the email analysis and context provided, generate a personalized, professional reply that:

1. Addresses the client's specific needs and questions
2. Uses real estate best practices and terminology  
3. Maintains a friendly but professional tone
4. Includes relevant next steps or calls to action
5. Follows up appropriately based on the email category

Email Category: {category}
Priority Score: {priorityScore}
Lead Score: {leadScore}
Key Information Extracted: {keyEntities}

Original Email:
FROM: {fromName} <{fromEmail}>
SUBJECT: {subject}
BODY: {body}

Agent Context:
- Agent Name: {agentName}
- Brokerage: {brokerage}
- Phone: {agentPhone}
- Email: {agentEmail}

Generate a professional email response that would be appropriate for this real estate scenario. The response should be ready to send with minimal editing needed.

Response should include:
- Appropriate greeting using the client's name if available
- Direct response to their inquiry
- Relevant next steps
- Professional closing with contact information
- Call to action where appropriate

Keep the tone professional but warm, and ensure all real estate compliance considerations are met.`;

// Helper function to get orgId for user (same as in analysis endpoint)
async function getOrgIdForUser(session: any): Promise<string | null> {
  // First try session
  const sessionOrgId = (session as { orgId?: string }).orgId;
  if (sessionOrgId) {
    return sessionOrgId;
  }

  // Fallback: get from database
  console.log('❌ No orgId in session, fetching from database...');
  const userWithOrg = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      orgMembers: {
        include: { org: true }
      }
    }
  });
  
  if (userWithOrg?.orgMembers?.[0]) {
    console.log('✅ Found orgId from database:', userWithOrg.orgMembers[0].orgId);
    return userWithOrg.orgMembers[0].orgId;
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 AI Reply POST request started');
    
    const session = await auth();
    console.log('🔍 Session details:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasEmail: !!session?.user?.email,
      email: session?.user?.email,
      orgId: (session as any)?.orgId
    });
    
    if (!session?.user?.email) {
      console.log('❌ Unauthorized - no session or email');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log('✅ User authenticated:', session.user.email);

    const { 
      emailId, 
      threadId,
      agentName = session.user.name || 'Real Estate Agent',
      brokerage = 'Rivor Realty',
      agentPhone = '',
      agentEmail = session.user.email || ''
    } = await request.json();
    
    console.log('📦 Request data:', { emailId, threadId });

    if (!emailId) {
      console.log('❌ Missing required fields:', { emailId: !!emailId });
      return NextResponse.json({ error: "Missing required field: emailId" }, { status: 400 });
    }

    // Get the organization ID
    const orgId = await getOrgIdForUser(session);
    if (!orgId) {
      console.log('❌ No organization found for user');
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get thread with decrypted messages
    console.log('🔍 Fetching thread data for orgId:', orgId, 'threadId:', threadId || emailId);
    const threadData = await getThreadWithMessages(orgId, threadId || emailId);
    if (!threadData.thread || threadData.messages.length === 0) {
      console.log('❌ Thread or message not found:', { threadId: threadId || emailId });
      return NextResponse.json({ error: "Thread or message not found" }, { status: 404 });
    }

    // Find the specific message or use the latest one
    const message = threadData.messages.find(m => m.id === emailId) || threadData.messages[threadData.messages.length - 1];
    const { subject, body, from } = message;

    console.log('📦 Decrypted email data:', { subject: subject?.substring(0, 50), bodyLength: body?.length, from });

    // Validate email data
    if (!subject && !body) {
      console.log('❌ No email content found');
      return NextResponse.json({ error: "No email content found to analyze" }, { status: 400 });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OPENAI_API_KEY not configured');
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    // Get existing AI analysis
    const analysis = await prisma.emailAIAnalysis.findUnique({
      where: { emailId }
    });

    if (!analysis) {
      return NextResponse.json({ error: "Email analysis not found. Please analyze email first." }, { status: 400 });
    }

    // Check if reply already exists
    const existingReply = await prisma.aISuggestedReply.findFirst({
      where: { 
        emailId,
        status: { in: ['pending', 'approved'] }
      }
    });

    if (existingReply) {
      return NextResponse.json({ reply: existingReply });
    }

    // Parse from field to extract name and email
    const fromParts = from.split(' ');
    const fromEmail = fromParts[fromParts.length - 1].replace(/[<>]/g, '') || from;
    const fromName = fromParts.slice(0, -1).join(' ') || fromEmail;

    // Create reply generation prompt
    const prompt = REPLY_GENERATION_PROMPT
      .replace('{category}', analysis.category)
      .replace('{priorityScore}', analysis.priorityScore.toString())
      .replace('{leadScore}', analysis.leadScore.toString())
      .replace('{keyEntities}', JSON.stringify(analysis.keyEntities))
      .replace('{fromName}', fromName || 'Valued Client')
      .replace('{fromEmail}', fromEmail || 'Unknown')
      .replace('{subject}', subject)
      .replace('{body}', body || '')
      .replace('{agentName}', agentName)
      .replace('{brokerage}', brokerage)
      .replace('{agentPhone}', agentPhone)
      .replace('{agentEmail}', agentEmail);

    // Get appropriate template for this category
    const template = await prisma.aIEmailTemplate.findFirst({
      where: {
        category: analysis.category,
        isActive: true
      },
      orderBy: { successRate: 'desc' }
    });

    // Call OpenAI for reply generation
    console.log('🤖 Calling OpenAI API for reply generation...');
    
    let completion;
    try {
      // Try gpt-4-turbo-preview first
      completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional real estate agent assistant. Generate email responses that are:
- Professional and friendly
- Specific to real estate scenarios
- Include relevant next steps
- Compliant with real estate regulations
- Personalized to the client's needs

${template ? `Use this template as inspiration but customize for the specific situation:\n${template.templateContent}` : ''}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });
      console.log('✅ OpenAI reply response received (gpt-4-turbo-preview)');
    } catch (openaiError) {
      console.log('⚠️ GPT-4 failed for reply, trying GPT-3.5-turbo...');
      // Fallback to gpt-3.5-turbo if gpt-4 fails
      completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a professional real estate agent assistant. Generate email responses that are:
- Professional and friendly
- Specific to real estate scenarios
- Include relevant next steps
- Compliant with real estate regulations
- Personalized to the client's needs

${template ? `Use this template as inspiration but customize for the specific situation:\n${template.templateContent}` : ''}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });
      console.log('✅ OpenAI reply response received (gpt-3.5-turbo fallback)');
    }

    const suggestedContent = completion.choices[0].message.content || '';

    // Calculate confidence score based on analysis quality and template availability
    let confidenceScore = analysis.confidenceScore;
    if (template) confidenceScore += 0.1; // Boost confidence if we have a good template
    if (analysis.priorityScore >= 80) confidenceScore += 0.05; // High priority emails get slight boost
    confidenceScore = Math.min(1, confidenceScore);

    // Save the suggested reply
    const reply = await prisma.aISuggestedReply.create({
      data: {
        emailId,
        threadId: threadId || emailId,
        suggestedContent,
        confidenceScore,
        category: `${analysis.category}-response`,
        status: 'pending'
      }
    });

    // Update template usage if one was used
    if (template) {
      await prisma.aIEmailTemplate.update({
        where: { id: template.id },
        data: { usageCount: { increment: 1 } }
      });
    }

    // Update processing queue status
    await prisma.aIProcessingQueue.updateMany({
      where: {
        emailId,
        processingType: 'reply_generation',
        status: 'queued'
      },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('AI reply generation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      error: "Failed to generate reply",
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');
    const status = searchParams.get('status');

    if (emailId) {
      // Get reply for specific email
      const reply = await prisma.aISuggestedReply.findFirst({
        where: { 
          emailId,
          ...(status && { status: status as any })
        },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ reply });
    } else {
      // Get pending replies
      const replies = await prisma.aISuggestedReply.findMany({
        where: {
          status: status as any || 'pending'
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      return NextResponse.json({ replies });
    }

  } catch (error) {
    console.error('Get reply error:', error);
    return NextResponse.json({ error: "Failed to get reply" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { replyId, status, userModifications, feedbackType, comments } = await request.json();

    if (!replyId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update reply status
    const reply = await prisma.aISuggestedReply.update({
      where: { id: replyId },
      data: {
        status,
        userModifications,
        ...(status === 'sent' && { sentAt: new Date() })
      }
    });

    // Record feedback if provided
    if (feedbackType) {
      await prisma.aIFeedback.create({
        data: {
          replyId,
          feedbackType,
          userComments: comments
        }
      });

      // Update template success rate if reply was approved/sent
      if (status === 'approved' || status === 'sent') {
        const template = await prisma.aIEmailTemplate.findFirst({
          where: {
            category: reply.category.replace('-response', '')
          }
        });

        if (template) {
          const feedbackWeight = feedbackType === 'positive' ? 0.1 : feedbackType === 'negative' ? -0.05 : 0;
          const newSuccessRate = Math.min(1, Math.max(0, template.successRate + feedbackWeight));
          
          await prisma.aIEmailTemplate.update({
            where: { id: template.id },
            data: { successRate: newSuccessRate }
          });
        }
      }
    }

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('Update reply error:', error);
    return NextResponse.json({ error: "Failed to update reply" }, { status: 500 });
  }
}