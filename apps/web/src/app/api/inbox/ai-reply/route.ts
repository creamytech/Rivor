import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      emailId, 
      threadId, 
      fromName, 
      fromEmail, 
      subject, 
      body,
      agentName = session.user.name || 'Real Estate Agent',
      brokerage = 'Rivor Realty',
      agentPhone = '',
      agentEmail = session.user.email || ''
    } = await request.json();

    if (!emailId || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get existing AI analysis
    const analysis = await db.emailAIAnalysis.findUnique({
      where: { emailId }
    });

    if (!analysis) {
      return NextResponse.json({ error: "Email analysis not found. Please analyze email first." }, { status: 400 });
    }

    // Check if reply already exists
    const existingReply = await db.aISuggestedReply.findFirst({
      where: { 
        emailId,
        status: { in: ['pending', 'approved'] }
      }
    });

    if (existingReply) {
      return NextResponse.json({ reply: existingReply });
    }

    // Create reply generation prompt
    const prompt = REPLY_GENERATION_PROMPT
      .replace('{category}', analysis.category)
      .replace('{priorityScore}', analysis.priorityScore.toString())
      .replace('{leadScore}', analysis.leadScore.toString())
      .replace('{keyEntities}', JSON.stringify(analysis.keyEntities))
      .replace('{fromName}', fromName || 'Valued Client')
      .replace('{fromEmail}', fromEmail || 'Unknown')
      .replace('{subject}', subject)
      .replace('{body}', body)
      .replace('{agentName}', agentName)
      .replace('{brokerage}', brokerage)
      .replace('{agentPhone}', agentPhone)
      .replace('{agentEmail}', agentEmail);

    // Get appropriate template for this category
    const template = await db.aIEmailTemplate.findFirst({
      where: {
        category: analysis.category,
        isActive: true
      },
      orderBy: { successRate: 'desc' }
    });

    // Call OpenAI for reply generation
    const completion = await openai.chat.completions.create({
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

    const suggestedContent = completion.choices[0].message.content || '';

    // Calculate confidence score based on analysis quality and template availability
    let confidenceScore = analysis.confidenceScore;
    if (template) confidenceScore += 0.1; // Boost confidence if we have a good template
    if (analysis.priorityScore >= 80) confidenceScore += 0.05; // High priority emails get slight boost
    confidenceScore = Math.min(1, confidenceScore);

    // Save the suggested reply
    const reply = await db.aISuggestedReply.create({
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
      await db.aIEmailTemplate.update({
        where: { id: template.id },
        data: { usageCount: { increment: 1 } }
      });
    }

    // Update processing queue status
    await db.aIProcessingQueue.updateMany({
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
    return NextResponse.json({
      error: "Failed to generate reply",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');
    const status = searchParams.get('status');

    if (emailId) {
      // Get reply for specific email
      const reply = await db.aISuggestedReply.findFirst({
        where: { 
          emailId,
          ...(status && { status: status as any })
        },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ reply });
    } else {
      // Get pending replies
      const replies = await db.aISuggestedReply.findMany({
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { replyId, status, userModifications, feedbackType, comments } = await request.json();

    if (!replyId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update reply status
    const reply = await db.aISuggestedReply.update({
      where: { id: replyId },
      data: {
        status,
        userModifications,
        ...(status === 'sent' && { sentAt: new Date() })
      }
    });

    // Record feedback if provided
    if (feedbackType) {
      await db.aIFeedback.create({
        data: {
          replyId,
          feedbackType,
          userComments: comments
        }
      });

      // Update template success rate if reply was approved/sent
      if (status === 'approved' || status === 'sent') {
        const template = await db.aIEmailTemplate.findFirst({
          where: {
            category: reply.category.replace('-response', '')
          }
        });

        if (template) {
          const feedbackWeight = feedbackType === 'positive' ? 0.1 : feedbackType === 'negative' ? -0.05 : 0;
          const newSuccessRate = Math.min(1, Math.max(0, template.successRate + feedbackWeight));
          
          await db.aIEmailTemplate.update({
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