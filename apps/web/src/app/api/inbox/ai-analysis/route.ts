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

// AI analysis prompt for real estate emails
const ANALYSIS_PROMPT = `You are an AI assistant specialized in analyzing real estate emails for agents. 

Analyze the following email and provide a JSON response with:

1. category: One of ['hot_lead', 'showing_request', 'price_inquiry', 'seller_lead', 'buyer_lead', 'follow_up', 'contract', 'marketing']
2. priorityScore: Integer 1-100 (100 = most urgent)
3. leadScore: Integer 1-100 (100 = highest quality lead) 
4. confidenceScore: Float 0-1 (confidence in analysis)
5. sentimentScore: Float 0-1 (0 = negative, 0.5 = neutral, 1 = positive)
6. keyEntities: Object with extracted information:
   - addresses: Array of property addresses mentioned
   - priceRange: Any price/budget mentioned
   - contacts: Phone numbers mentioned
   - propertyType: Type of property (e.g., "3-bedroom house")
   - timeframes: Any dates/deadlines mentioned
   - urgencyIndicators: Words/phrases showing urgency

Real estate context:
- Hot leads: Immediate buying/selling intent, pre-approved, cash buyers, urgent timelines
- Showing requests: Want to see properties, schedule tours
- Price inquiries: Negotiating offers, asking about pricing
- Seller leads: Want to sell their property, asking for market analysis
- Buyer leads: Looking to purchase, asking about listings
- Follow-up: Requires agent response/action
- Contract: Legal documents, closing-related
- Marketing: Newsletters, promotional content

Consider urgency indicators like:
- "ASAP", "urgent", "today", "immediately" 
- Pre-approval mentions
- Cash purchase ability  
- Specific timeline mentions
- Multiple property inquiries

Email to analyze:

FROM: {fromName} <{fromEmail}>
SUBJECT: {subject}
BODY: {body}`;

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
    console.log('🚀 AI Analysis POST request started');
    
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

    const { emailId, threadId } = await request.json();
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

    // If we only have emailId, find the thread it belongs to
    let actualThreadId = threadId;
    if (!actualThreadId && emailId) {
      console.log('🔍 Finding thread for emailId:', emailId);
      const message = await prisma.emailMessage.findFirst({
        where: { id: emailId, orgId },
        select: { threadId: true }
      });
      
      if (message?.threadId) {
        actualThreadId = message.threadId;
        console.log('✅ Found threadId from message:', actualThreadId);
      } else {
        console.log('❌ Message not found or no threadId');
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
      }
    }

    // Get thread with decrypted messages
    console.log('🔍 Fetching thread data for orgId:', orgId, 'threadId:', actualThreadId);
    const threadData = await getThreadWithMessages(orgId, actualThreadId);
    if (!threadData.thread || threadData.messages.length === 0) {
      console.log('❌ Thread or message not found:', { threadId: actualThreadId });
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

    // Check if analysis already exists
    console.log('🔍 Checking for existing analysis...');
    const existingAnalysis = await prisma.emailAIAnalysis.findUnique({
      where: { emailId }
    });

    if (existingAnalysis) {
      console.log('✅ Found existing analysis:', existingAnalysis.id);
      return NextResponse.json({ analysis: existingAnalysis });
    }
    console.log('💫 No existing analysis found, creating new one...');

    // Create analysis prompt
    const fromParts = from.split(' ');
    const fromEmail = fromParts[fromParts.length - 1].replace(/[<>]/g, '') || from;
    const fromName = fromParts.slice(0, -1).join(' ') || fromEmail;
    
    const prompt = ANALYSIS_PROMPT
      .replace('{fromName}', fromName || 'Unknown')
      .replace('{fromEmail}', fromEmail || 'Unknown') 
      .replace('{subject}', subject)
      .replace('{body}', body || '');

    // Call OpenAI for analysis
    console.log('🤖 Calling OpenAI API...');
    console.log('📝 Prompt length:', prompt.length);
    
    let completion;
    try {
      // Try gpt-4-turbo-preview first
      completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a real estate email analysis expert. Always respond with valid JSON only."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });
      console.log('✅ OpenAI response received (gpt-4-turbo-preview)');
    } catch (openaiError) {
      console.log('⚠️ GPT-4 failed, trying GPT-3.5-turbo...');
      // Fallback to gpt-3.5-turbo if gpt-4 fails
      completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a real estate email analysis expert. Always respond with valid JSON only."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });
      console.log('✅ OpenAI response received (gpt-3.5-turbo fallback)');
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(completion.choices[0].message.content || '{}');
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return NextResponse.json({ error: "Failed to parse AI analysis" }, { status: 500 });
    }

    // Validate and save analysis to database
    // Map category to match enum values
    const categoryMap: { [key: string]: string } = {
      'hot-lead': 'hot_lead',
      'hot_lead': 'hot_lead',
      'showing-request': 'showing_request', 
      'showing_request': 'showing_request',
      'price-inquiry': 'price_inquiry',
      'price_inquiry': 'price_inquiry',
      'seller-lead': 'seller_lead',
      'seller_lead': 'seller_lead',
      'buyer-lead': 'buyer_lead',
      'buyer_lead': 'buyer_lead',
      'follow-up': 'follow_up',
      'follow_up': 'follow_up',
      'contract': 'contract',
      'marketing': 'marketing'
    };

    const analysis = await prisma.emailAIAnalysis.create({
      data: {
        emailId,
        threadId: actualThreadId,
        category: categoryMap[analysisResult.category] || 'follow_up',
        priorityScore: Math.min(100, Math.max(0, analysisResult.priorityScore || 50)),
        leadScore: Math.min(100, Math.max(0, analysisResult.leadScore || 50)),
        confidenceScore: Math.min(1, Math.max(0, analysisResult.confidenceScore || 0.5)),
        sentimentScore: Math.min(1, Math.max(0, analysisResult.sentimentScore || 0.5)),
        keyEntities: analysisResult.keyEntities || {},
        processingStatus: 'completed'
      }
    });

    // If high-priority email, queue for auto-reply generation
    if (analysis.priorityScore >= 80 || analysis.category === 'hot_lead') {
      await prisma.aIProcessingQueue.create({
        data: {
          emailId,
          threadId: actualThreadId,
          processingType: 'reply_generation',
          priority: analysis.priorityScore,
          status: 'queued'
        }
      });
    }

    return NextResponse.json({ analysis });

  } catch (error) {
    console.error('AI analysis error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: "Failed to analyze email",
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
    const threadIds = searchParams.get('threadIds');

    if (emailId) {
      // Get specific analysis
      const analysis = await prisma.emailAIAnalysis.findUnique({
        where: { emailId }
      });
      return NextResponse.json({ analysis });
    } else if (threadIds) {
      // Get analyses for specific threads
      const threadIdArray = threadIds.split(',').filter(id => id.trim());
      const analyses = await prisma.emailAIAnalysis.findMany({
        where: { 
          threadId: { in: threadIdArray }
        },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ analyses });
    } else {
      // Get recent analyses
      const analyses = await prisma.emailAIAnalysis.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      return NextResponse.json({ analyses });
    }

  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json({ error: "Failed to get analysis" }, { status: 500 });
  }
}