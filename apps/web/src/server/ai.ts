import OpenAI from 'openai';
import { prisma } from './db';
import { decryptForOrg } from './crypto';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface EmailDraftOptions {
  type: 'reply' | 'follow-up' | 'introduction' | 'meeting-request';
  tone: 'professional' | 'warm' | 'casual' | 'urgent';
  context?: {
    threadSubject?: string;
    previousMessages?: string[];
    contactName?: string;
    companyName?: string;
  };
}

export class AIService {
  static async generateChatResponse(
    messages: ChatMessage[],
    orgId: string,
    options?: { useContext?: boolean }
  ): Promise<string> {
    try {
      let systemMessage = `You are Rivor, an AI assistant for real estate professionals. You help with email management, lead qualification, scheduling, and sales strategy. Keep responses helpful, professional, and actionable.`;

      // Add context if requested
      if (options?.useContext) {
        const context = await AIService.getOrgContext(orgId);
        systemMessage += `\n\nBusiness context:
- Recent emails: ${context.emailCount}
- Active leads: ${context.leadCount}
- Contacts: ${context.contactCount}
- Last activity: ${context.lastActivity}`;
      }

      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemMessage },
          ...messages
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';

    } catch (error) {
      console.error('OpenAI chat error:', error);
      return 'I apologize, but I encountered an error. Please try again later.';
    }
  }

  static async generateEmailDraft(
    options: EmailDraftOptions,
    orgId: string
  ): Promise<{
    subject: string;
    content: string;
    reasoning: string;
    confidence: number;
  }> {
    try {
      const { type, tone, context } = options;

      let prompt = `Generate a ${tone} ${type} email`;
      
      if (context?.threadSubject) {
        prompt += ` in response to: "${context.threadSubject}"`;
      }
      
      if (context?.contactName) {
        prompt += ` for ${context.contactName}`;
      }
      
      if (context?.companyName) {
        prompt += ` from ${context.companyName}`;
      }

      if (context?.previousMessages?.length) {
        prompt += `\n\nPrevious messages for context:\n${context.previousMessages.join('\n---\n')}`;
      }

      prompt += `\n\nProvide the response as JSON:
{
  "subject": "Email subject line",
  "content": "Email body content", 
  "reasoning": "Brief explanation of the approach taken",
  "confidence": number between 80-100
}

Make the email contextually appropriate, ${tone} in tone, and suitable for a real estate professional.`;

      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email writer for real estate professionals. Generate professional, contextually appropriate emails.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response generated');
      }

      try {
        const parsed = JSON.parse(response);
        return {
          subject: parsed.subject || 'Email Draft',
          content: parsed.content || 'Email content could not be generated.',
          reasoning: parsed.reasoning || 'Standard email generation approach',
          confidence: Math.min(100, Math.max(80, parsed.confidence || 85))
        };
      } catch (parseError) {
        return {
          subject: context?.threadSubject ? `RE: ${context.threadSubject}` : 'Email Draft',
          content: response,
          reasoning: 'Generated email content with fallback formatting',
          confidence: 80
        };
      }

    } catch (error) {
      console.error('OpenAI email draft error:', error);
      return {
        subject: 'Email Draft',
        content: 'I apologize, but I was unable to generate an email draft. Please try again.',
        reasoning: 'Error occurred during generation',
        confidence: 0
      };
    }
  }

  static async summarizeEmailThread(
    threadId: string,
    orgId: string
  ): Promise<{
    summary: string;
    keyPoints: string[];
    suggestedActions: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
  }> {
    try {
      // Get thread messages
      const thread = await prisma.emailThread.findUnique({
        where: { id: threadId },
        include: {
          messages: {
            orderBy: { sentAt: 'asc' },
            take: 10 // Limit to recent messages
          }
        }
      });

      if (!thread) {
        throw new Error('Thread not found');
      }

      // For now, return a placeholder summary since we need to implement decryption
      // In production, you would decrypt the messages and analyze them
      return {
        summary: `Email thread analysis for thread ${threadId}. This thread contains ${thread.messages.length} messages.`,
        keyPoints: [
          'Email thread identified',
          `${thread.messages.length} messages in conversation`,
          'Requires message decryption for detailed analysis'
        ],
        suggestedActions: [
          'Review message content',
          'Follow up with participants',
          'Set reminder for next action'
        ],
        sentiment: 'neutral'
      };

    } catch (error) {
      console.error('Thread summarization error:', error);
      return {
        summary: 'Unable to generate thread summary',
        keyPoints: [],
        suggestedActions: [],
        sentiment: 'neutral'
      };
    }
  }

  private static async getOrgContext(orgId: string): Promise<{
    emailCount: number;
    leadCount: number;
    contactCount: number;
    lastActivity: string;
  }> {
    try {
      const [emailCount, leadCount, contactCount] = await Promise.all([
        prisma.emailMessage.count({ where: { orgId } }),
        prisma.lead.count({ where: { orgId, status: 'active' } }),
        prisma.contact.count({ where: { orgId } })
      ]);

      const lastEmail = await prisma.emailMessage.findFirst({
        where: { orgId },
        orderBy: { sentAt: 'desc' }
      });

      return {
        emailCount,
        leadCount,
        contactCount,
        lastActivity: lastEmail ? `Email received ${new Date(lastEmail.sentAt).toLocaleDateString()}` : 'No recent activity'
      };
    } catch (error) {
      console.error('Error getting org context:', error);
      return {
        emailCount: 0,
        leadCount: 0,
        contactCount: 0,
        lastActivity: 'Unknown'
      };
    }
  }
}

// Legacy function for compatibility
export async function summarizeThread(orgId: string, threadId: string, type: 'short' | 'detailed' = 'short'): Promise<void> {
  try {
    const summary = await AIService.summarizeEmailThread(threadId, orgId);
    console.log(`Thread ${threadId} summarized:`, summary.summary);
  } catch (error) {
    console.error('Thread summarization error:', error);
  }
}