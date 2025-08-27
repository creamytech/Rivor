import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI analysis prompt for real estate emails
const ANALYSIS_PROMPT = `You are an AI assistant specialized in analyzing real estate emails for agents. 

Analyze the following email and provide a JSON response with:

1. category: One of ['hot-lead', 'showing-request', 'price-inquiry', 'seller-lead', 'buyer-lead', 'follow-up', 'contract', 'marketing']
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emailId, threadId, fromName, fromEmail, subject, body } = await request.json();

    if (!emailId || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if analysis already exists
    const existingAnalysis = await prisma.emailAIAnalysis.findUnique({
      where: { emailId }
    });

    if (existingAnalysis) {
      return NextResponse.json({ analysis: existingAnalysis });
    }

    // Create analysis prompt
    const prompt = ANALYSIS_PROMPT
      .replace('{fromName}', fromName || 'Unknown')
      .replace('{fromEmail}', fromEmail || 'Unknown') 
      .replace('{subject}', subject)
      .replace('{body}', body);

    // Call OpenAI for analysis
    const completion = await openai.chat.completions.create({
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

    let analysisResult;
    try {
      analysisResult = JSON.parse(completion.choices[0].message.content || '{}');
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return NextResponse.json({ error: "Failed to parse AI analysis" }, { status: 500 });
    }

    // Validate and save analysis to database
    const analysis = await prisma.emailAIAnalysis.create({
      data: {
        emailId,
        threadId: threadId || emailId,
        category: analysisResult.category || 'follow-up',
        priorityScore: Math.min(100, Math.max(0, analysisResult.priorityScore || 50)),
        leadScore: Math.min(100, Math.max(0, analysisResult.leadScore || 50)),
        confidenceScore: Math.min(1, Math.max(0, analysisResult.confidenceScore || 0.5)),
        sentimentScore: Math.min(1, Math.max(0, analysisResult.sentimentScore || 0.5)),
        keyEntities: analysisResult.keyEntities || {},
        processingStatus: 'completed'
      }
    });

    // If high-priority email, queue for auto-reply generation
    if (analysis.priorityScore >= 80 || analysis.category === 'hot-lead') {
      await prisma.aIProcessingQueue.create({
        data: {
          emailId,
          threadId: threadId || emailId,
          processingType: 'reply_generation',
          priority: analysis.priorityScore,
          status: 'queued'
        }
      });
    }

    return NextResponse.json({ analysis });

  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({ 
      error: "Failed to analyze email",
      details: error instanceof Error ? error.message : 'Unknown error'
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