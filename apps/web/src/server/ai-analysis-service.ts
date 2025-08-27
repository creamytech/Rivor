import { prisma } from '@/lib/db-pool';
import { getThreadWithMessages } from './email';
import { logger } from '@/lib/logger';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to process HTML content with image detection
function stripHtml(html: string): string {
  if (!html) return '';
  
  // Check if HTML contains images using regex (server-side compatible)
  const imageRegex = /<img[^>]*>/gi;
  const hasImages = imageRegex.test(html);
  
  // If no images, strip all HTML and return text-only
  if (!hasImages) {
    let text = html.replace(/<[^>]*>/g, ' ');
    
    // Decode common HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
    
    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ')
      .trim();
      
    return text;
  }
  
  // If has images, preserve some HTML structure but clean it
  let cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/onclick\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
  
  return cleanHtml;
}

// Helper function to truncate content to stay within token limits
function truncateContent(text: string, maxLength: number = 6000): string {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  // Truncate at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
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

export interface AIAnalysisResult {
  category: string;
  priorityScore: number;
  leadScore: number;
  confidenceScore: number;
  sentimentScore: number;
  keyEntities: any;
}

/**
 * Analyze email with AI and store results in database
 */
export async function analyzeEmailWithAI(
  orgId: string,
  emailId: string,
  threadId?: string
): Promise<AIAnalysisResult | null> {
  try {
    logger.info('Starting AI analysis for email', {
      orgId,
      emailId,
      threadId,
      action: 'ai_analysis_start'
    });

    // Check if analysis already exists
    const existingAnalysis = await prisma.emailAIAnalysis.findUnique({
      where: { emailId }
    });

    if (existingAnalysis) {
      logger.info('Found existing AI analysis', {
        orgId,
        emailId,
        category: existingAnalysis.category,
        action: 'ai_analysis_exists'
      });
      return {
        category: existingAnalysis.category,
        priorityScore: existingAnalysis.priorityScore,
        leadScore: existingAnalysis.leadScore,
        confidenceScore: existingAnalysis.confidenceScore,
        sentimentScore: existingAnalysis.sentimentScore,
        keyEntities: existingAnalysis.keyEntities
      };
    }

    // Find the thread if not provided
    let actualThreadId = threadId;
    if (!actualThreadId) {
      const message = await prisma.emailMessage.findFirst({
        where: { id: emailId, orgId },
        select: { threadId: true }
      });
      
      if (message?.threadId) {
        actualThreadId = message.threadId;
      } else {
        logger.error('Message not found for AI analysis', {
          orgId,
          emailId,
          action: 'ai_analysis_message_not_found'
        });
        return null;
      }
    }

    // Get thread with decrypted messages
    const threadData = await getThreadWithMessages(orgId, actualThreadId);
    if (!threadData.thread || threadData.messages.length === 0) {
      logger.error('Thread or messages not found for AI analysis', {
        orgId,
        emailId,
        threadId: actualThreadId,
        action: 'ai_analysis_thread_not_found'
      });
      return null;
    }

    // Find the specific message or use the latest one
    const message = threadData.messages.find(m => m.id === emailId) || 
                   threadData.messages[threadData.messages.length - 1];
    const { subject, body, from } = message;

    // Clean and truncate content
    const cleanBody = stripHtml(body || '');
    const truncatedBody = truncateContent(cleanBody, 6000);
    const truncatedSubject = truncateContent(subject || '', 200);

    // Validate email data
    if (!truncatedSubject && !truncatedBody) {
      logger.warn('No content found for AI analysis', {
        orgId,
        emailId,
        action: 'ai_analysis_no_content'
      });
      return null;
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      logger.error('OpenAI API key not configured', {
        action: 'ai_analysis_no_api_key'
      });
      return null;
    }

    // Parse from field
    const fromParts = from.split(' ');
    const fromEmail = fromParts[fromParts.length - 1].replace(/[<>]/g, '') || from;
    const fromName = fromParts.slice(0, -1).join(' ') || fromEmail;
    
    // Create analysis prompt
    const prompt = ANALYSIS_PROMPT
      .replace('{fromName}', fromName || 'Unknown')
      .replace('{fromEmail}', fromEmail || 'Unknown') 
      .replace('{subject}', truncatedSubject)
      .replace('{body}', truncatedBody);

    // Call OpenAI for analysis
    logger.info('Calling OpenAI for email analysis', {
      orgId,
      emailId,
      estimatedTokens: Math.ceil(prompt.length / 4),
      action: 'ai_analysis_openai_call'
    });
    
    let completion;
    try {
      // Try gpt-4o-mini first
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a real estate email analysis expert. You must respond with ONLY valid JSON in this exact format:

{
  "category": "hot_lead|showing_request|price_inquiry|seller_lead|buyer_lead|follow_up|contract|marketing",
  "priorityScore": 1-100,
  "leadScore": 1-100, 
  "confidenceScore": 0.0-1.0,
  "sentimentScore": 0.0-1.0,
  "keyEntities": {
    "addresses": ["address1", "address2"],
    "priceRange": "price mentioned",
    "contacts": ["phone numbers"],
    "propertyType": "property type",
    "timeframes": ["dates mentioned"],
    "urgencyIndicators": ["urgent words"]
  }
}

Do not include any text outside the JSON. Focus on the key information and ignore HTML formatting.`
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });
    } catch (openaiError) {
      logger.warn('GPT-4o-mini failed, trying GPT-3.5-turbo', {
        orgId,
        emailId,
        error: openaiError instanceof Error ? openaiError.message : String(openaiError),
        action: 'ai_analysis_fallback'
      });
      
      // Fallback to gpt-3.5-turbo
      completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a real estate email analysis expert. You must respond with ONLY valid JSON in this exact format:

{
  "category": "hot_lead|showing_request|price_inquiry|seller_lead|buyer_lead|follow_up|contract|marketing",
  "priorityScore": 1-100,
  "leadScore": 1-100, 
  "confidenceScore": 0.0-1.0,
  "sentimentScore": 0.0-1.0,
  "keyEntities": {
    "addresses": ["address1", "address2"],
    "priceRange": "price mentioned",
    "contacts": ["phone numbers"],
    "propertyType": "property type",
    "timeframes": ["dates mentioned"],
    "urgencyIndicators": ["urgent words"]
  }
}

Do not include any text outside the JSON. Focus on the key information and ignore HTML formatting.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });
    }

    // Parse AI response
    let analysisResult: AIAnalysisResult;
    try {
      const rawResponse = completion.choices[0]?.message?.content || '';
      
      // Extract JSON from response
      let jsonStr = rawResponse;
      const jsonMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                       rawResponse.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      const parsed = JSON.parse(jsonStr);
      
      analysisResult = {
        category: parsed.category || 'follow_up',
        priorityScore: Math.min(100, Math.max(0, parsed.priorityScore || 50)),
        leadScore: Math.min(100, Math.max(0, parsed.leadScore || 50)),
        confidenceScore: Math.min(1, Math.max(0, parsed.confidenceScore || 0.5)),
        sentimentScore: Math.min(1, Math.max(0, parsed.sentimentScore || 0.5)),
        keyEntities: parsed.keyEntities || {}
      };
      
    } catch (parseError) {
      logger.error('Failed to parse AI response, using fallback', {
        orgId,
        emailId,
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
        rawResponse: completion.choices[0]?.message?.content?.substring(0, 200),
        action: 'ai_analysis_parse_error'
      });
      
      // Fallback analysis
      analysisResult = {
        category: 'follow_up',
        priorityScore: 50,
        leadScore: 50,
        confidenceScore: 0.5,
        sentimentScore: 0.5,
        keyEntities: {
          summary: 'AI response could not be parsed'
        }
      };
    }

    // Map category to database enum values
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

    // Save analysis to database
    const analysis = await prisma.emailAIAnalysis.create({
      data: {
        emailId,
        threadId: actualThreadId,
        category: categoryMap[analysisResult.category] || 'follow_up',
        priorityScore: analysisResult.priorityScore,
        leadScore: analysisResult.leadScore,
        confidenceScore: analysisResult.confidenceScore,
        sentimentScore: analysisResult.sentimentScore,
        keyEntities: analysisResult.keyEntities,
        processingStatus: 'completed'
      }
    });

    // Queue auto-reply generation for high-priority emails
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

    logger.info('AI analysis completed and saved', {
      orgId,
      emailId,
      category: analysis.category,
      priorityScore: analysis.priorityScore,
      leadScore: analysis.leadScore,
      confidence: analysis.confidenceScore,
      action: 'ai_analysis_complete'
    });

    return analysisResult;

  } catch (error) {
    logger.error('AI analysis failed', {
      orgId,
      emailId,
      error: error instanceof Error ? error.message : String(error),
      action: 'ai_analysis_failed'
    });
    return null;
  }
}