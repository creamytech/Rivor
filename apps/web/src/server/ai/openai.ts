import OpenAI from 'openai';
import { logger } from '@/lib/logger';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmailAnalysis {
  category: 'hot_lead' | 'showing_request' | 'price_inquiry' | 'seller_lead' | 'buyer_lead' | 'follow_up_required' | 'contract_legal' | 'marketing' | 'other';
  leadScore: number; // 1-100
  urgency: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  summary: string;
  keyPoints: string[];
  propertyDetails?: {
    address?: string;
    priceRange?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
  };
  contactIntent: 'buying' | 'selling' | 'renting' | 'information' | 'other';
  suggestedActions: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface AIReply {
  subject: string;
  content: string;
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  confidence: number;
  reasoning: string;
  template: string; // Template name used
}

/**
 * Analyze email content using OpenAI for real estate context
 */
export async function analyzeEmail(
  subject: string,
  content: string,
  senderEmail: string,
  senderName?: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>
): Promise<EmailAnalysis> {
  try {
    const systemPrompt = `You are an AI assistant specialized in real estate email analysis. Analyze incoming emails to help real estate agents prioritize and respond to leads effectively.

CATEGORIES:
- hot_lead: Urgent property inquiries with high buying/selling intent
- showing_request: Appointment scheduling, property viewing requests
- price_inquiry: Questions about listing prices, market values
- seller_lead: Potential property listings, selling inquiries
- buyer_lead: Property purchase interest, buyer qualification
- follow_up_required: Needs agent response, ongoing conversations
- contract_legal: Transaction documents, legal matters
- marketing: Promotional emails, newsletters, spam
- other: General inquiries, unrelated content

LEAD SCORING (1-100):
- 90-100: Immediate action required (ready to buy/sell, urgent timing)
- 70-89: High priority (qualified leads, specific property interest)
- 50-69: Medium priority (general interest, needs nurturing)
- 30-49: Low priority (early stage, research phase)
- 1-29: Minimal priority (unlikely to convert, spam)

URGENCY LEVELS:
- critical: Immediate response required (same day)
- high: Response needed within 24 hours
- medium: Response needed within 2-3 days
- low: Response can wait 3+ days

Respond with a JSON object containing your analysis.`;

    const userPrompt = `Please analyze this real estate email:

SENDER: ${senderName || 'Unknown'} <${senderEmail}>
SUBJECT: ${subject}
CONTENT: ${content}

${conversationHistory && conversationHistory.length > 0 ? `
CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}
` : ''}

Provide a comprehensive analysis focusing on real estate context, lead qualification, and urgency assessment.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1500
    });

    const analysisText = response.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error('No analysis received from OpenAI');
    }

    const analysis = JSON.parse(analysisText) as EmailAnalysis;
    
    logger.info('Email analysis completed', {
      senderEmail,
      category: analysis.category,
      leadScore: analysis.leadScore,
      urgency: analysis.urgency,
      confidence: analysis.confidence
    });

    return analysis;

  } catch (error) {
    logger.error('Email analysis failed', {
      error: error instanceof Error ? error.message : String(error),
      senderEmail
    });

    // Return default analysis on error
    return {
      category: 'other',
      leadScore: 50,
      urgency: 'medium',
      confidence: 0.1,
      summary: 'Email analysis failed - manual review required',
      keyPoints: ['Analysis error occurred'],
      contactIntent: 'other',
      suggestedActions: ['Review email manually'],
      sentiment: 'neutral'
    };
  }
}

/**
 * Generate AI-powered reply to email
 */
export async function generateReply(
  originalSubject: string,
  originalContent: string,
  senderEmail: string,
  senderName?: string,
  analysis?: EmailAnalysis,
  template?: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>,
  agentName: string = 'Real Estate Agent',
  agentSignature?: string
): Promise<AIReply> {
  try {
    const systemPrompt = `You are an AI assistant helping a real estate agent craft professional email responses. Generate appropriate, helpful, and engaging replies that:

1. Address the sender's specific questions or concerns
2. Maintain a professional yet personable tone
3. Include relevant real estate expertise
4. Encourage next steps (showing, consultation, etc.)
5. Build trust and rapport

AVAILABLE TEMPLATES:
- property_inquiry: Response to property questions
- showing_request: Scheduling property viewings
- price_discussion: Discussing pricing and market value
- seller_consultation: Initial seller conversations
- buyer_consultation: Working with potential buyers
- follow_up: Nurturing leads and maintaining contact
- information_request: Providing market information

TONE GUIDELINES:
- professional: Formal business communication
- friendly: Warm but professional
- casual: Relaxed, approachable
- formal: Very professional, for legal/contract matters

Always include agent contact information and encourage direct communication.`;

    const userPrompt = `Generate a reply to this email:

ORIGINAL EMAIL:
From: ${senderName || 'Unknown'} <${senderEmail}>
Subject: ${originalSubject}
Content: ${originalContent}

${analysis ? `
EMAIL ANALYSIS:
Category: ${analysis.category}
Lead Score: ${analysis.leadScore}/100
Urgency: ${analysis.urgency}
Contact Intent: ${analysis.contactIntent}
Key Points: ${analysis.keyPoints.join(', ')}
Summary: ${analysis.summary}
` : ''}

${template ? `PREFERRED TEMPLATE: ${template}` : ''}

${conversationHistory && conversationHistory.length > 0 ? `
CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}
` : ''}

AGENT INFO:
Name: ${agentName}
${agentSignature ? `Signature: ${agentSignature}` : ''}

Generate an appropriate reply that addresses their needs and moves the conversation forward. Respond with a JSON object containing the reply details.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1000
    });

    const replyText = response.choices[0]?.message?.content;
    if (!replyText) {
      throw new Error('No reply generated from OpenAI');
    }

    const reply = JSON.parse(replyText) as AIReply;
    
    logger.info('AI reply generated', {
      senderEmail,
      template: reply.template,
      confidence: reply.confidence,
      tone: reply.tone
    });

    return reply;

  } catch (error) {
    logger.error('AI reply generation failed', {
      error: error instanceof Error ? error.message : String(error),
      senderEmail
    });

    // Return default reply on error
    return {
      subject: `Re: ${originalSubject}`,
      content: `Hi ${senderName || 'there'},\n\nThank you for your email. I'll review your message and get back to you shortly with the information you need.\n\nBest regards,\n${agentName}`,
      tone: 'professional',
      confidence: 0.1,
      reasoning: 'AI generation failed - using fallback template',
      template: 'fallback'
    };
  }
}

/**
 * Batch analyze multiple emails efficiently
 */
export async function batchAnalyzeEmails(
  emails: Array<{
    id: string;
    subject: string;
    content: string;
    senderEmail: string;
    senderName?: string;
  }>
): Promise<Map<string, EmailAnalysis>> {
  const results = new Map<string, EmailAnalysis>();
  
  // Process in chunks to avoid rate limits
  const chunkSize = 5;
  for (let i = 0; i < emails.length; i += chunkSize) {
    const chunk = emails.slice(i, i + chunkSize);
    
    const chunkPromises = chunk.map(async (email) => {
      try {
        const analysis = await analyzeEmail(
          email.subject,
          email.content,
          email.senderEmail,
          email.senderName
        );
        results.set(email.id, analysis);
      } catch (error) {
        logger.error('Batch email analysis failed for email', {
          emailId: email.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    await Promise.all(chunkPromises);
    
    // Add small delay between chunks to respect rate limits
    if (i + chunkSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  logger.info('Batch email analysis completed', {
    totalEmails: emails.length,
    successfulAnalyses: results.size
  });
  
  return results;
}

/**
 * Extract property information from email content
 */
export async function extractPropertyInfo(content: string): Promise<{
  addresses: string[];
  priceRanges: string[];
  propertyTypes: string[];
  features: string[];
}> {
  try {
    const systemPrompt = `Extract real estate property information from email content. Look for:
- Property addresses
- Price ranges or specific prices
- Property types (single family, condo, townhouse, etc.)
- Key features (bedrooms, bathrooms, square footage, lot size, etc.)

Return a JSON object with arrays for each category.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Extract property information from this email content:\n\n${content}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 500
    });

    const extractionText = response.choices[0]?.message?.content;
    if (!extractionText) {
      throw new Error('No extraction received from OpenAI');
    }

    return JSON.parse(extractionText);

  } catch (error) {
    logger.error('Property extraction failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      addresses: [],
      priceRanges: [],
      propertyTypes: [],
      features: []
    };
  }
}