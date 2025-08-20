import OpenAI from 'openai';
import { prisma } from '@/lib/db-pool';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface EmailDraftOptions {
  type: 'reply' | 'follow-up' | 'introduction' | 'meeting-request';
  tone: 'professional' | 'warm' | 'casual' | 'urgent';
  context?: {
    leadId?: string;
    contactName?: string;
    propertyAddress?: string;
    previousEmail?: string;
    meetingDate?: string;
    [key: string]: any;
  };
}

export interface EmailDraft {
  subject: string;
  body: string;
  type: string;
  tone: string;
  suggestions?: string[];
}

export class AIService {
  static async generateEmailDraft(options: EmailDraftOptions, orgId: string): Promise<EmailDraft> {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    const { type, tone, context = {} } = options;

    // Gather context if leadId is provided
    let leadContext = '';
    if (context.leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: context.leadId, orgId },
        include: {
          contact: true,
          stage: true,
          tasks: {
            where: { done: false },
            take: 5
          }
        }
      });

      if (lead) {
        leadContext = `
Lead Information:
- Title: ${lead.title || 'Untitled Lead'}
- Stage: ${lead.stage?.name || 'No stage'}
- Priority: ${lead.priority}
- Status: ${lead.status}
- Probability: ${lead.probabilityPercent || 0}%
- Contact: ${lead.contact ? 'Available' : 'Not available'}
- Pending tasks: ${lead.tasks?.length || 0}
        `;
      }
    }

    // Build the system prompt based on email type
    const systemPrompt = this.buildSystemPrompt(type, tone, leadContext, context);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a ${type} email with a ${tone} tone.` }
        ],
        max_tokens: 800,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the response to extract subject and body
      const emailDraft = this.parseEmailResponse(response, type, tone);
      
      return emailDraft;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate email draft');
    }
  }

  private static buildSystemPrompt(
    type: string, 
    tone: string, 
    leadContext: string, 
    context: any
  ): string {
    let basePrompt = `You are an AI assistant for a real estate CRM system. Generate professional emails for real estate agents.

${leadContext}

Additional Context:
- Contact Name: ${context.contactName || 'Not specified'}
- Property Address: ${context.propertyAddress || 'Not specified'}
- Meeting Date: ${context.meetingDate || 'Not specified'}

Email Type: ${type}
Tone: ${tone}

Guidelines:
- Keep emails concise but professional
- Include relevant real estate context
- Use appropriate salutations and closings
- Include clear calls to action when appropriate
- Format as: SUBJECT: [subject line] | BODY: [email body]
`;

    switch (type) {
      case 'reply':
        basePrompt += `
- This is a response to a previous email
- Address the specific points mentioned
- Maintain continuity in the conversation
${context.previousEmail ? `- Previous email context: ${context.previousEmail}` : ''}
`;
        break;
      case 'follow-up':
        basePrompt += `
- This is a follow-up email to maintain engagement
- Reference previous interactions
- Provide value and next steps
- Be persistent but respectful
`;
        break;
      case 'introduction':
        basePrompt += `
- This is an introductory email to a new contact
- Establish credibility and value proposition
- Keep it warm but professional
- Include clear next steps
`;
        break;
      case 'meeting-request':
        basePrompt += `
- This is requesting a meeting or showing
- Provide specific time options if possible
- Explain the purpose and value of meeting
- Make it easy for them to respond
`;
        break;
    }

    switch (tone) {
      case 'professional':
        basePrompt += '\n- Use formal language and business terminology';
        break;
      case 'warm':
        basePrompt += '\n- Use friendly, approachable language while maintaining professionalism';
        break;
      case 'casual':
        basePrompt += '\n- Use conversational, relaxed language';
        break;
      case 'urgent':
        basePrompt += '\n- Convey urgency while remaining professional';
        break;
    }

    return basePrompt;
  }

  private static parseEmailResponse(response: string, type: string, tone: string): EmailDraft {
    // Try to parse the structured format first
    const subjectMatch = response.match(/SUBJECT:\s*([^\|]+)/i);
    const bodyMatch = response.match(/BODY:\s*([\s\S]+)/i);

    let subject = '';
    let body = '';

    if (subjectMatch && bodyMatch) {
      subject = subjectMatch[1].trim();
      body = bodyMatch[1].trim();
    } else {
      // Fallback parsing
      const lines = response.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        // First line might be subject
        subject = lines[0].replace(/^(subject:|re:|fw:)/i, '').trim();
        // Rest is body
        body = lines.slice(1).join('\n').trim();
      } else {
        subject = `${this.capitalizeFirst(type)} - Follow Up`;
        body = response.trim();
      }
    }

    // Generate suggestions
    const suggestions = this.generateSuggestions(type, tone);

    return {
      subject: subject || `${this.capitalizeFirst(type)} - Follow Up`,
      body: body || 'I apologize, but I encountered an issue generating the email content. Please try again.',
      type,
      tone,
      suggestions
    };
  }

  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private static generateSuggestions(type: string, tone: string): string[] {
    const suggestions: string[] = [];

    switch (type) {
      case 'reply':
        suggestions.push('Consider adding specific details about next steps');
        suggestions.push('Include attachments if relevant (property details, contracts, etc.)');
        break;
      case 'follow-up':
        suggestions.push('Add a specific call-to-action');
        suggestions.push('Consider including market updates or property recommendations');
        break;
      case 'introduction':
        suggestions.push('Include your credentials and recent success stories');
        suggestions.push('Attach a market report or property guide');
        break;
      case 'meeting-request':
        suggestions.push('Provide 2-3 specific time options');
        suggestions.push('Include meeting agenda or talking points');
        break;
    }

    if (tone === 'urgent') {
      suggestions.push('Consider following up with a phone call');
    }

    return suggestions;
  }

  static async summarizeContent(content: string, context: string): Promise<string> {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for a real estate CRM. Provide concise, actionable summaries focused on ${context} data.`
          },
          {
            role: 'user',
            content: `Summarize the following ${context} information: ${content}`
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      });

      return completion.choices[0]?.message?.content || 'Unable to generate summary.';
    } catch (error) {
      console.error('OpenAI summarization error:', error);
      throw new Error('Failed to generate summary');
    }
  }

  static async generateInsights(data: any, type: string): Promise<string[]> {
    if (!openai) {
      return ['AI insights unavailable - OpenAI API key not configured'];
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a real estate data analyst. Generate 3-5 actionable insights from ${type} data. Focus on trends, opportunities, and recommendations.`
          },
          {
            role: 'user',
            content: `Analyze this ${type} data and provide insights: ${JSON.stringify(data)}`
          }
        ],
        max_tokens: 400,
        temperature: 0.4
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) return ['No insights available'];

      // Split response into bullet points
      return response
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-•\d+\.]\s*/, '').trim())
        .filter(line => line.length > 10);
    } catch (error) {
      console.error('OpenAI insights error:', error);
      return ['Failed to generate insights'];
    }
  }
}

// Re-export the ai-service for compatibility
export { aiService } from './ai-service';