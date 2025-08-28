import OpenAI from 'openai';
import { prisma } from './db';
import { decryptForOrg } from './crypto';
import { getPersonalityForOrg, generatePersonalityPrompt, generateFallbackPrompt } from './ai/personality';

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
      // Get personality data for personalized chat responses
      const personality = await getPersonalityForOrg(orgId);
      
      let systemMessage: string;
      if (personality) {
        systemMessage = generatePersonalityPrompt(personality);
        systemMessage += '\n\nYou are helping with real estate CRM tasks like email management, lead qualification, scheduling, and sales strategy. Always respond as this agent would, maintaining their personal style and voice.';
      } else {
        systemMessage = `You are Rivor, an AI assistant for real estate professionals. You help with email management, lead qualification, scheduling, and sales strategy. Keep responses helpful, professional, and actionable.`;
      }

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

      // Get personality data for personalized email generation
      const personality = await getPersonalityForOrg(orgId);
      
      let systemPrompt: string;
      if (personality) {
        systemPrompt = generatePersonalityPrompt(personality);
        systemPrompt += '\n\nGenerate emails that sound exactly like this agent wrote them personally.';
      } else {
        systemPrompt = 'You are an expert email writer for real estate professionals. Generate professional, contextually appropriate emails.';
      }

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

Make the email contextually appropriate, ${tone} in tone, and suitable for a real estate professional.${personality ? ' Write exactly as the agent would write it - match their communication style, vocabulary, and patterns.' : ''}`;

      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
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
      // Get thread messages with decrypted content
      const thread = await prisma.emailThread.findUnique({
        where: { id: threadId, orgId },
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

      if (thread.messages.length === 0) {
        return {
          summary: 'No messages found in this thread',
          keyPoints: [],
          suggestedActions: [],
          sentiment: 'neutral'
        };
      }

      // Decrypt and collect message content
      let conversationText = '';
      const messageContents: string[] = [];

      for (const message of thread.messages) {
        try {
          const subject = message.subjectEnc 
            ? new TextDecoder().decode(await decryptForOrg(orgId, message.subjectEnc as unknown as Buffer, 'email:subject'))
            : '';
          
          const from = message.fromEnc 
            ? new TextDecoder().decode(await decryptForOrg(orgId, message.fromEnc as unknown as Buffer, 'email:from'))
            : '';
          
          let body = '';
          if (message.bodyRefEnc) {
            const bodyData = new TextDecoder().decode(await decryptForOrg(orgId, message.bodyRefEnc as unknown as Buffer, 'email:body'));
            
            // Try to parse structured body content
            try {
              const parsedBody = JSON.parse(bodyData);
              body = parsedBody.content || bodyData;
            } catch {
              body = bodyData;
            }
          }

          const messageContent = `From: ${from}\nSubject: ${subject}\nContent: ${body}\n---`;
          messageContents.push(messageContent);
          conversationText += messageContent + '\n';
        } catch (decryptError) {
          console.error('Failed to decrypt message:', decryptError);
          messageContents.push(`[Message from ${message.sentAt} - decryption failed]`);
        }
      }

      if (conversationText.trim().length === 0) {
        return {
          summary: 'Unable to decrypt message content for analysis',
          keyPoints: ['Messages could not be decrypted'],
          suggestedActions: ['Review encryption setup', 'Check message format'],
          sentiment: 'neutral'
        };
      }

      // Use OpenAI to analyze the conversation
      const prompt = `Analyze this email thread conversation and provide a JSON response with the following structure:
{
  "summary": "Brief 2-3 sentence summary of the conversation",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "suggestedActions": ["action 1", "action 2", "action 3"],
  "sentiment": "positive" | "neutral" | "negative"
}

Email thread conversation:
${conversationText}

Focus on:
- Main topics discussed
- Key decisions or outcomes
- Important dates, names, or details
- Overall tone and sentiment
- What actions might be needed next`;

      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email analyzer for real estate professionals. Provide concise, actionable insights.'
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
        throw new Error('No response from AI');
      }

      try {
        const analysis = JSON.parse(response);
        return {
          summary: analysis.summary || `Email thread with ${thread.messages.length} messages`,
          keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints : [`${thread.messages.length} messages analyzed`],
          suggestedActions: Array.isArray(analysis.suggestedActions) ? analysis.suggestedActions : ['Follow up with participants'],
          sentiment: ['positive', 'neutral', 'negative'].includes(analysis.sentiment) ? analysis.sentiment : 'neutral'
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          summary: response.slice(0, 200) + (response.length > 200 ? '...' : ''),
          keyPoints: [`${thread.messages.length} messages in conversation`],
          suggestedActions: ['Review conversation details', 'Follow up as needed'],
          sentiment: 'neutral'
        };
      }

    } catch (error) {
      console.error('Thread summarization error:', error);
      return {
        summary: 'Unable to generate thread summary due to error',
        keyPoints: ['Analysis failed'],
        suggestedActions: ['Try again later', 'Check system configuration'],
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