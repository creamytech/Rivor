import OpenAI from 'openai';
import { prisma } from '@/server/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatContext {
  type?: 'lead' | 'contact' | 'thread';
  id?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  reasoning?: string;
  actions?: Array<{
    type: string;
    label: string;
    data?: any;
  }>;
}

interface AIAction {
  type: 'create_task' | 'promote_lead' | 'schedule_meeting' | 'send_email' | 'update_lead' | 'create_contact';
  label: string;
  data?: any;
}

export class AIService {
  private async getCurrentUserOrg() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Not authenticated");
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        orgMembers: {
          include: { org: true }
        }
      }
    });

    if (!user?.orgMembers?.[0]?.org) {
      throw new Error("No organization found");
    }

    return user.orgMembers[0].org;
  }

  private async gatherContext(context?: ChatContext): Promise<string> {
    const org = await this.getCurrentUserOrg();
    let contextData = '';

    if (context?.type && context?.id) {
      switch (context.type) {
        case 'lead':
          const lead = await prisma.lead.findUnique({
            where: { id: context.id, orgId: org.id },
            include: {
              contact: true,
              stage: true,
              assignedTo: {
                include: { user: true }
              },
              tasks: {
                where: { done: false },
                orderBy: { dueAt: 'asc' }
              }
            }
          });
          if (lead) {
            contextData = `
LEAD CONTEXT:
- Title: ${lead.title || 'Untitled'}
- Status: ${lead.status}
- Priority: ${lead.priority}
- Stage: ${lead.stage?.name || 'No stage'}
- Probability: ${lead.probabilityPercent || 0}%
- Contact: ${lead.contact ? 'Has contact info' : 'No contact'}
- Assigned to: ${lead.assignedTo?.user.name || lead.assignedTo?.user.email || 'Unassigned'}
- Pending tasks: ${lead.tasks?.length || 0}
- Created: ${lead.createdAt}
- Last updated: ${lead.updatedAt}
`;
          }
          break;

        case 'contact':
          const contact = await prisma.contact.findUnique({
            where: { id: context.id, orgId: org.id },
            include: {
              leads: {
                include: {
                  stage: true,
                  tasks: {
                    where: { done: false }
                  }
                }
              },
              _count: { select: { leads: true } }
            }
          });
          if (contact) {
            contextData = `
CONTACT CONTEXT:
- Name: ${contact.nameEnc ? 'Available' : 'Not available'}
- Email: ${contact.emailEnc ? 'Available' : 'Not available'}
- Company: ${contact.companyEnc ? 'Available' : 'Not available'}
- Total leads: ${contact._count.leads}
- Active leads: ${contact.leads.filter(l => l.status !== 'closed').length}
- Pending tasks: ${contact.leads.reduce((sum, lead) => sum + (lead.tasks?.length || 0), 0)}
`;
          }
          break;

        case 'thread':
          const thread = await prisma.emailThread.findUnique({
            where: { id: context.id, orgId: org.id },
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 5
              },
              lead: {
                include: {
                  contact: true,
                  stage: true
                }
              },
              _count: { select: { messages: true, attachments: true } }
            }
          });
          if (thread) {
            contextData = `
EMAIL THREAD CONTEXT:
- Subject: ${thread.subjectEnc ? 'Available' : 'Not available'}
- Messages: ${thread._count.messages}
- Attachments: ${thread._count.attachments}
- Status: ${thread.status}
- Associated lead: ${thread.lead ? 'Yes' : 'No'}
${thread.lead ? `- Lead stage: ${thread.lead.stage?.name || 'No stage'}` : ''}
- Last message: ${thread.messages[0]?.sentAt || 'Unknown'}
`;
          }
          break;
      }
    }

    // Add general context about the organization
    const [leadsCount, tasksCount, eventsCount] = await Promise.all([
      prisma.lead.count({ where: { orgId: org.id } }),
      prisma.task.count({ where: { orgId: org.id, done: false } }),
      prisma.calendarEvent.count({ 
        where: { 
          orgId: org.id,
          start: { gte: new Date() },
          end: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    contextData += `
ORGANIZATION CONTEXT:
- Total leads: ${leadsCount}
- Pending tasks: ${tasksCount}
- Upcoming events (next 7 days): ${eventsCount}
`;

    return contextData;
  }

  private async getAvailableActions(): Promise<AIAction[]> {
    return [
      {
        type: 'create_task',
        label: 'Create follow-up task',
        data: { requiresLead: true }
      },
      {
        type: 'promote_lead',
        label: 'Promote lead to next stage',
        data: { requiresLead: true }
      },
      {
        type: 'schedule_meeting',
        label: 'Schedule meeting',
        data: { requiresContact: true }
      },
      {
        type: 'send_email',
        label: 'Send email',
        data: { requiresContact: true }
      },
      {
        type: 'update_lead',
        label: 'Update lead information',
        data: { requiresLead: true }
      },
      {
        type: 'create_contact',
        label: 'Create new contact',
        data: {}
      }
    ];
  }

  private async executeAction(action: AIAction, context?: ChatContext): Promise<string> {
    const org = await this.getCurrentUserOrg();
    
    switch (action.type) {
      case 'create_task':
        if (context?.type === 'lead' && context?.id) {
          // This would create a task linked to the lead
          return `I can create a follow-up task for this lead. What would you like the task to be about?`;
        }
        return `I can create a new task. What would you like the task to be about?`;

      case 'promote_lead':
        if (context?.type === 'lead' && context?.id) {
          const lead = await prisma.lead.findUnique({
            where: { id: context.id, orgId: org.id },
            include: { stage: true }
          });
          if (lead?.stage) {
            return `I can help promote this lead from "${lead.stage.name}" to the next stage. Would you like me to do that?`;
          }
        }
        return `I can help promote a lead to the next stage. Which lead would you like to promote?`;

      case 'schedule_meeting':
        return `I can help schedule a meeting. What time and date would work best?`;

      case 'send_email':
        return `I can help compose and send an email. What would you like to say?`;

      case 'update_lead':
        if (context?.type === 'lead' && context?.id) {
          return `I can help update this lead's information. What would you like to change?`;
        }
        return `I can help update lead information. Which lead would you like to update?`;

      case 'create_contact':
        return `I can help create a new contact. What information do you have about this person?`;

      default:
        return `I can help with that. Let me know what specific action you'd like me to take.`;
    }
  }

  async sendMessage(
    message: string,
    threadId?: string,
    context?: ChatContext
  ): Promise<ChatMessage> {
    try {
      // Gather context from database
      const contextData = await this.gatherContext(context);
      const availableActions = await this.getAvailableActions();

      // Create system prompt with context and capabilities
      const systemPrompt = `You are an AI assistant for a real estate CRM system called Rivor. You have access to:

${contextData}

AVAILABLE ACTIONS:
${availableActions.map(action => `- ${action.label} (${action.type})`).join('\n')}

CAPABILITIES:
- Access to leads, contacts, email threads, calendar events, and tasks
- Can create tasks, update leads, schedule meetings, send emails
- Can analyze data and provide insights
- Can help with lead management and follow-ups

RESPONSE FORMAT:
1. Provide a helpful, contextual response
2. Suggest relevant actions when appropriate
3. Be concise but thorough
4. Use the context provided to give personalized advice

Current user message: "${message}"

Respond as a helpful AI assistant with access to the CRM data.`;

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.';

      // Analyze response for potential actions
      const suggestedActions = this.analyzeResponseForActions(aiResponse, availableActions, context);

      return {
        id: `msg_${Date.now()}`,
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
        reasoning: `Analyzed user request in context of ${context?.type || 'general'} data. Suggested ${suggestedActions.length} relevant actions.`,
        actions: suggestedActions
      };

    } catch (error) {
      console.error('AI Service Error:', error);
      
      return {
        id: `msg_${Date.now()}`,
        content: 'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.',
        role: 'assistant',
        timestamp: new Date(),
        reasoning: 'Error occurred during AI processing',
        actions: []
      };
    }
  }

  private analyzeResponseForActions(
    response: string,
    availableActions: AIAction[],
    context?: ChatContext
  ): Array<{ type: string; label: string; data?: any }> {
    const actions: Array<{ type: string; label: string; data?: any }> = [];
    const lowerResponse = response.toLowerCase();

    // Simple keyword-based action detection
    if (lowerResponse.includes('task') || lowerResponse.includes('follow-up')) {
      actions.push({
        type: 'create_task',
        label: 'Create follow-up task'
      });
    }

    if (lowerResponse.includes('promote') || lowerResponse.includes('next stage')) {
      actions.push({
        type: 'promote_lead',
        label: 'Promote lead to next stage'
      });
    }

    if (lowerResponse.includes('meeting') || lowerResponse.includes('schedule')) {
      actions.push({
        type: 'schedule_meeting',
        label: 'Schedule meeting'
      });
    }

    if (lowerResponse.includes('email') || lowerResponse.includes('send')) {
      actions.push({
        type: 'send_email',
        label: 'Send email'
      });
    }

    if (lowerResponse.includes('update') || lowerResponse.includes('change')) {
      actions.push({
        type: 'update_lead',
        label: 'Update lead information'
      });
    }

    if (lowerResponse.includes('contact') || lowerResponse.includes('new person')) {
      actions.push({
        type: 'create_contact',
        label: 'Create new contact'
      });
    }

    return actions.slice(0, 3); // Limit to 3 most relevant actions
  }

  async getThread(threadId: string): Promise<{
    id: string;
    messages: ChatMessage[];
    context?: ChatContext;
  }> {
    // This would typically fetch from a chat history table
    // For now, return a basic structure
    return {
      id: threadId,
      messages: [
        {
          id: 'msg_1',
          content: 'Hello! I\'m your AI assistant for Rivor. I can help you manage leads, contacts, schedule meetings, and more. What would you like to work on today?',
          role: 'assistant',
          timestamp: new Date(Date.now() - 60000)
        }
      ],
      context: {
        type: 'lead',
        id: 'lead_123'
      }
    };
  }

  async executeSuggestedAction(
    actionType: string,
    context?: ChatContext,
    actionData?: any
  ): Promise<string> {
    const availableActions = await this.getAvailableActions();
    const action = availableActions.find(a => a.type === actionType);
    
    if (action) {
      return await this.executeAction(action, context);
    }
    
    return 'I\'m not sure how to execute that action. Could you please clarify what you\'d like me to do?';
  }
}

export const aiService = new AIService();
