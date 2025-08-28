import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';
import { getPersonalityForOrg, generatePersonalityPrompt, generateFallbackPrompt } from './personality';
import { createDraftNotification, getOrgUserId } from '../notifications';
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
      logger.warn(`Auto-draft attempt ${attempt} failed, retrying in ${delay}ms...`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt,
        maxRetries
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry logic error'); // This should never be reached
}

interface AutoDraftTrigger {
  category: string;
  minPriorityScore: number;
  minLeadScore: number;
}

// Define which email categories should trigger auto-drafting
const AUTO_DRAFT_TRIGGERS: AutoDraftTrigger[] = [
  { category: 'showing_request', minPriorityScore: 50, minLeadScore: 40 },
  { category: 'hot_lead', minPriorityScore: 60, minLeadScore: 50 },
  { category: 'seller_lead', minPriorityScore: 50, minLeadScore: 40 },
  { category: 'buyer_lead', minPriorityScore: 50, minLeadScore: 40 },
  { category: 'price_inquiry', minPriorityScore: 50, minLeadScore: 40 },
];

/**
 * Check if an AI analysis should trigger auto-drafting
 */
export function shouldAutoDraft(analysis: any): boolean {
  if (!analysis?.category || !analysis?.priorityScore || !analysis?.leadScore) {
    return false;
  }

  const trigger = AUTO_DRAFT_TRIGGERS.find(t => t.category === analysis.category);
  if (!trigger) {
    return false;
  }

  return analysis.priorityScore >= trigger.minPriorityScore && 
         analysis.leadScore >= trigger.minLeadScore;
}

/**
 * Generate an auto-draft reply for a high-priority email
 */
export async function generateAutoDraft(
  orgId: string, 
  emailId: string, 
  analysis: any
): Promise<string | null> {
  try {
    logger.info('Generating auto-draft reply', {
      orgId,
      emailId,
      category: analysis.category,
      priorityScore: analysis.priorityScore,
      leadScore: analysis.leadScore
    });

    // Get the email message with decrypted content
    const emailMessage = await prisma.emailMessage.findUnique({
      where: { id: emailId },
      include: { thread: true }
    });

    if (!emailMessage) {
      logger.error('Email message not found for auto-draft', { emailId });
      return null;
    }

    // Get decrypted email content (we'll need to decrypt it)
    const { getThreadWithMessages } = await import('../email');
    const threadData = await getThreadWithMessages(orgId, emailMessage.threadId);
    const message = threadData.messages.find(m => m.id === emailId);

    if (!message) {
      logger.error('Could not decrypt email message for auto-draft', { emailId });
      return null;
    }

    // Get personality data for personalized responses
    const personality = await getPersonalityForOrg(orgId);
    
    let systemPrompt: string;
    if (personality) {
      systemPrompt = generatePersonalityPrompt(personality);
      systemPrompt += `\n\nYou are auto-drafting a reply to a ${analysis.category} email. Write exactly as this agent would respond, matching their communication style and approach.`;
    } else {
      systemPrompt = `You are a professional real estate agent assistant auto-drafting a reply to a ${analysis.category} email.`;
    }

    // Create category-specific response prompts
    let responseGuidance = '';
    switch (analysis.category) {
      case 'showing_request':
        responseGuidance = `This client wants to schedule a property showing. Your response should:
- Acknowledge their interest promptly and professionally
- Offer specific available time slots (suggest 2-3 options)
- Ask for their preferred time and contact method
- Mention you'll send property details and directions
- Express enthusiasm about showing them the property`;
        break;
        
      case 'hot_lead':
        responseGuidance = `This is a high-priority lead with immediate buying/selling intent. Your response should:
- Respond with urgency and excitement
- Acknowledge their specific needs/timeline
- Offer immediate consultation or meeting
- Demonstrate expertise and local market knowledge
- Include your direct contact information for quick follow-up`;
        break;
        
      case 'seller_lead':
        responseGuidance = `This client is interested in selling their property. Your response should:
- Thank them for considering you as their agent
- Mention you'll provide a comprehensive market analysis
- Offer to schedule a consultation to discuss their goals
- Highlight your recent sales success and local expertise
- Ask about their timeline and any specific concerns`;
        break;
        
      case 'buyer_lead':
        responseGuidance = `This is a potential buyer lead. Your response should:
- Welcome them and thank them for their interest
- Ask about their specific needs (budget, location, timeline)
- Offer to set up a buyer consultation
- Mention you'll send relevant listings that match their criteria
- Provide your direct contact for immediate assistance`;
        break;
        
      case 'price_inquiry':
        responseGuidance = `This client is asking about pricing/offers. Your response should:
- Address their pricing questions professionally
- Mention you'll provide detailed market analysis
- Explain your expertise in pricing strategy
- Offer to discuss their specific situation in detail
- Show confidence in your ability to get them the best deal`;
        break;
        
      default:
        responseGuidance = `Respond professionally and helpfully to their inquiry.`;
    }

    const prompt = `You are auto-drafting a reply to this real estate email:

FROM: ${message.from}
SUBJECT: ${message.subject}
CONTENT: ${message.body?.substring(0, 2000) || ''}

AI ANALYSIS:
- Category: ${analysis.category}
- Priority Score: ${analysis.priorityScore}/100
- Lead Score: ${analysis.leadScore}/100
- Key Intent: ${analysis.keyEntities?.contactIntent || 'Not specified'}
- Summary: ${analysis.keyEntities?.summary || 'No summary available'}

${responseGuidance}

Write a professional, personalized email reply that:
1. Addresses their specific request/need
2. Shows enthusiasm and professionalism
3. Includes a clear next step or call-to-action
4. Matches the agent's communication style
5. Is ready to send with minimal editing

Keep the response concise but comprehensive (2-3 paragraphs maximum).`;

    // Generate the auto-draft with retry logic
    const completion = await retryWithBackoff(async () => {
      logger.info('Generating auto-draft with OpenAI API...', { emailId, category: analysis.category });
      return await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
      });
    }, 3, 1500); // 3 retries with 1.5s base delay for auto-drafts

    const draftContent = completion.choices[0]?.message?.content;
    if (!draftContent) {
      logger.error('Failed to generate auto-draft content', { emailId });
      return null;
    }

    logger.info('Auto-draft generated successfully', {
      orgId,
      emailId,
      category: analysis.category,
      contentLength: draftContent.length
    });

    return draftContent;

  } catch (error) {
    logger.error('Failed to generate auto-draft', {
      orgId,
      emailId,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Create an auto-draft entry in the database
 */
export async function createAutoDraft(
  orgId: string,
  emailId: string,
  threadId: string,
  draftContent: string,
  analysis: any
): Promise<string | null> {
  try {
    // Check if auto-draft already exists for this email
    console.log(`🔍 Checking for existing auto-draft for email: ${emailId}`);
    const existingDraft = await prisma.aISuggestedReply.findFirst({
      where: {
        emailId,
        status: 'draft'
      }
    });

    if (existingDraft) {
      console.log(`✅ Auto-draft already exists for email ${emailId}:`, { 
        draftId: existingDraft.id, 
        category: existingDraft.category,
        status: existingDraft.status
      });
      logger.info('Auto-draft already exists for email', { emailId });
      return existingDraft.id;
    }
    console.log(`💫 No existing auto-draft found for email ${emailId}, creating new one...`);

    // Create auto-draft
    const draft = await prisma.aISuggestedReply.create({
      data: {
        emailId,
        threadId,
        suggestedContent: draftContent,
        confidenceScore: analysis.confidenceScore || 0.8,
        category: `${analysis.category}-auto-draft`,
        status: 'draft', // Special status for auto-drafts
        metadata: JSON.stringify({
          autoDrafted: true,
          originalCategory: analysis.category,
          priorityScore: analysis.priorityScore,
          leadScore: analysis.leadScore,
          createdAt: new Date().toISOString()
        })
      }
    });

    console.log(`✅ Auto-draft created successfully:`, {
      draftId: draft.id,
      emailId,
      threadId,
      category: draft.category,
      status: draft.status,
      contentLength: draft.suggestedContent.length,
      confidenceScore: draft.confidenceScore
    });
    
    logger.info('Auto-draft created successfully', {
      draftId: draft.id,
      emailId,
      category: analysis.category
    });

    return draft.id;

  } catch (error) {
    logger.error('Failed to create auto-draft record', {
      emailId,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Process an email analysis and create auto-draft if needed
 */
export async function processAutoDraft(
  orgId: string,
  emailId: string,
  analysis: any
): Promise<{ drafted: boolean; draftId?: string; notificationId?: string }> {
  if (!shouldAutoDraft(analysis)) {
    return { drafted: false };
  }

  try {
    // Generate draft content
    const draftContent = await generateAutoDraft(orgId, emailId, analysis);
    if (!draftContent) {
      return { drafted: false };
    }

    // Get thread ID and email info
    const emailMessage = await prisma.emailMessage.findUnique({
      where: { id: emailId },
      select: { threadId: true }
    });

    if (!emailMessage) {
      return { drafted: false };
    }

    // Create draft record
    const draftId = await createAutoDraft(
      orgId,
      emailId,
      emailMessage.threadId,
      draftContent,
      analysis
    );

    if (!draftId) {
      return { drafted: false };
    }

    // Create notification for the draft
    let notificationId: string | null = null;
    try {
      // Get email details for notification
      const { getThreadWithMessages } = await import('../email');
      const threadData = await getThreadWithMessages(orgId, emailMessage.threadId);
      const message = threadData.messages.find(m => m.id === emailId) || threadData.messages[0];

      // Get user ID for the organization
      const userId = await getOrgUserId(orgId);
      if (userId && message) {
        notificationId = await createDraftNotification(
          orgId,
          userId,
          draftId,
          message.subject || 'Email',
          message.from || 'Unknown',
          analysis.category
        );
      }
    } catch (notificationError) {
      logger.error('Failed to create draft notification', {
        draftId,
        error: notificationError instanceof Error ? notificationError.message : String(notificationError)
      });
      // Don't fail the draft creation if notification fails
    }

    return { 
      drafted: true, 
      draftId,
      notificationId: notificationId || undefined
    };

  } catch (error) {
    logger.error('Auto-draft processing failed', {
      orgId,
      emailId,
      error: error instanceof Error ? error.message : String(error)
    });
    return { drafted: false };
  }
}