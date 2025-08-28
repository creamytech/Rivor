import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { getThreadWithMessages } from '@/server/email';
import { getPersonalityForOrg, generatePersonalityPrompt, generateFallbackPrompt } from '@/server/ai/personality';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
});

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`⏳ AI Reply attempt ${attempt} failed, retrying in ${delay}ms...`);
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry logic error'); // This should never be reached
}

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

    // Get existing AI analysis
    console.log('🔍 Looking for AI analysis for email:', emailId);
    const analysis = await prisma.emailAIAnalysis.findUnique({
      where: { emailId }
    });

    if (!analysis) {
      console.log('❌ No AI analysis found for email:', emailId);
      return NextResponse.json({ error: "Email analysis not found. Please analyze email first." }, { status: 400 });
    }
    console.log('✅ Found AI analysis:', { 
      id: analysis.id, 
      category: analysis.category, 
      priorityScore: analysis.priorityScore,
      confidenceScore: analysis.confidenceScore 
    });

    // Check if reply already exists
    console.log('🔍 Checking for existing reply for email:', emailId);
    const existingReply = await prisma.aISuggestedReply.findFirst({
      where: { 
        emailId,
        status: { in: ['pending', 'approved'] }
      }
    });

    if (existingReply) {
      console.log('✅ Found existing reply:', { id: existingReply.id, status: existingReply.status });
      return NextResponse.json({ reply: existingReply });
    }
    console.log('💫 No existing reply found, proceeding with generation...');

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

    // Get personality data for personalized responses
    console.log('🧠 Getting personality data for orgId:', orgId);
    const personality = await getPersonalityForOrg(orgId);
    
    let systemPrompt: string;
    if (personality) {
      console.log('✅ Using personalized communication style:', personality.communicationStyle);
      systemPrompt = generatePersonalityPrompt(personality);
      systemPrompt += '\n\nFor this email reply, make sure to:';
    } else {
      console.log('⚠️ No personality data found, using generic prompt');
      systemPrompt = 'You are a professional real estate agent assistant.';
    }
    
    systemPrompt += `
- Generate email responses that are professional and helpful
- Specific to real estate scenarios  
- Include relevant next steps
- Compliant with real estate regulations
- Personalized to the client's needs and situation

${template ? `Use this template as inspiration but customize for the specific situation:\n${template.templateContent}` : ''}`;

    // Call OpenAI for reply generation
    console.log('🤖 Preparing OpenAI API call for reply generation...');
    console.log('📝 System prompt length:', systemPrompt.length);
    console.log('📝 User prompt length:', prompt.length);
    console.time(`openai-reply-${emailId}`);
    
    const systemMessage = {
      role: "system" as const,
      content: systemPrompt
    };

    const userMessage = {
      role: "user" as const,
      content: prompt
    };
    
    let completion;
    try {
      // Try gpt-4-turbo-preview with retry logic
      completion = await retryWithBackoff(async () => {
        console.log('🤖 Calling OpenAI API (gpt-4-turbo-preview) with retry logic...');
        return await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [systemMessage, userMessage],
          temperature: 0.7,
          max_tokens: 1500,
        });
      }, 3, 1500);
      console.timeEnd(`openai-reply-${emailId}`);
      console.log('✅ OpenAI reply response received (gpt-4-turbo-preview)');
    } catch (openaiError) {
      console.log('⚠️ GPT-4 failed for reply after retries, trying GPT-3.5-turbo...');
      console.log('Error details:', openaiError instanceof Error ? openaiError.message : openaiError);
      
      // Fallback to gpt-3.5-turbo with retry logic
      try {
        completion = await retryWithBackoff(async () => {
          console.log('🤖 Calling OpenAI API (gpt-3.5-turbo fallback) with retry logic...');
          return await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [systemMessage, userMessage],
            temperature: 0.7,
            max_tokens: 1500,
          });
        }, 3, 1500);
        console.timeEnd(`openai-reply-${emailId}`);
        console.log('✅ OpenAI reply response received (gpt-3.5-turbo fallback)');
      } catch (fallbackError) {
        console.error('❌ Both GPT-4 and GPT-3.5-turbo failed for reply generation after retries');
        console.error('Final error:', fallbackError instanceof Error ? fallbackError.message : fallbackError);
        throw new Error(`OpenAI API failed for reply generation: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }

    const suggestedContent = completion.choices[0]?.message?.content || '';
    console.log('📝 Generated reply content length:', suggestedContent.length);
    console.log('📝 Reply preview:', suggestedContent.substring(0, 100) + '...');

    if (!suggestedContent) {
      console.error('❌ No content generated by OpenAI for reply');
      throw new Error('OpenAI did not generate any reply content');
    }

    // Calculate confidence score based on analysis quality and template availability
    let confidenceScore = analysis.confidenceScore;
    if (template) confidenceScore += 0.1; // Boost confidence if we have a good template
    if (analysis.priorityScore >= 80) confidenceScore += 0.05; // High priority emails get slight boost
    confidenceScore = Math.min(1, confidenceScore);
    
    console.log('📊 Calculated confidence score:', confidenceScore);

    // Save the suggested reply
    console.log('💾 Saving suggested reply to database...');
    console.time(`database-reply-save-${emailId}`);
    const reply = await prisma.aISuggestedReply.create({
      data: {
        emailId,
        threadId: actualThreadId,
        suggestedContent,
        confidenceScore: confidenceScore, // Explicitly include confidenceScore
        category: `${analysis.category}-response`,
        status: 'pending'
      }
    });
    console.timeEnd(`database-reply-save-${emailId}`);
    console.log('✅ Suggested reply saved:', { replyId: reply.id, category: reply.category });

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
    console.error('❌ AI reply generation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      emailId,
      threadId: actualThreadId,
      orgId,
      userEmail: session?.user?.email
    });
    
    // Try to save a failed reply record for debugging
    try {
      if (emailId && actualThreadId) {
        await prisma.aISuggestedReply.create({
          data: {
            emailId,
            threadId: actualThreadId,
            suggestedContent: 'Reply generation failed',
            confidenceScore: 0.0,
            category: 'failed-response',
            status: 'rejected',
            metadata: {
              error: 'Reply generation failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            }
          }
        });
        console.log('🔍 Saved failed reply record for debugging');
      }
    } catch (saveError) {
      console.error('Failed to save error reply record:', saveError);
    }
    
    return NextResponse.json({
      error: "Failed to generate reply",
      details: error instanceof Error ? error.message : 'Unknown error',
      emailId,
      timestamp: new Date().toISOString()
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

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { replyId, status, userModifications, feedbackType, comments, autoSend } = await request.json();

    if (!replyId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If status is being changed to 'approved' and autoSend is true, send the email
    if ((status === 'approved' || status === 'sent') && autoSend) {
      try {
        // Send the email using the send-reply functionality
        const sendResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/inbox/send-reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Forward session cookies for authentication
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            replyId,
            customContent: userModifications
          })
        });

        if (!sendResponse.ok) {
          const errorData = await sendResponse.json().catch(() => ({}));
          throw new Error(`Failed to send email: ${errorData.details || 'Unknown error'}`);
        }

        const sendData = await sendResponse.json();
        
        // Return success with sent message info
        return NextResponse.json({
          reply: { id: replyId, status: 'sent', sentAt: sendData.sentAt },
          sent: true,
          messageId: sendData.messageId
        });

      } catch (sendError) {
        console.error('Failed to auto-send reply:', sendError);
        
        // Continue with status update even if send fails
        const reply = await prisma.aISuggestedReply.update({
          where: { id: replyId },
          data: {
            status: 'approved', // Keep as approved since send failed
            userModifications
          }
        });

        return NextResponse.json({
          reply,
          sent: false,
          error: `Status updated but failed to send: ${sendError instanceof Error ? sendError.message : 'Unknown error'}`
        });
      }
    }

    // Regular status update without sending
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