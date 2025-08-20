import { getOpenAILazy } from '@/lib/dynamic-imports';
import { prisma } from '@/server/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';

// Initialize OpenAI client lazily
let openaiInstance: any = null;

const getOpenAI = async () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  
  if (!openaiInstance) {
    const OpenAI = await getOpenAILazy();
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  return openaiInstance;
};

interface ChatContext {
  type?:
    | 'lead'
    | 'contact'
    | 'thread'
    | 'pipeline'
    | 'inbox'
    | 'calendar'
    | 'contacts';
  id?: string;
}

interface ChatMessage {
  id: string;
  threadId: string;
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

    if (context?.type) {
      switch (context.type) {
        case 'lead':
          if (context.id) {
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
          }
          break;

        case 'contact':
          if (context.id) {
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
          }
          break;

        case 'thread':
          if (context.id) {
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
          }
          break;

        case 'pipeline':
          const stages = await prisma.pipelineStage.findMany({
            where: { orgId: org.id },
            include: { _count: { select: { leads: true } } },
            orderBy: { order: 'asc' }
          });
          contextData = `PIPELINE CONTEXT:\n${stages
            .map(s => `- ${s.name}: ${s._count.leads} leads`)
            .join('\n')}`;
          break;

        case 'inbox':
          const [totalThreads, unreadThreads, latestThread] = await Promise.all([
            prisma.emailThread.count({ where: { orgId: org.id } }),
            prisma.emailThread.count({ where: { orgId: org.id, unread: true } }),
            prisma.emailThread.findFirst({
              where: { orgId: org.id },
              orderBy: { updatedAt: 'desc' },
              select: { updatedAt: true }
            })
          ]);
          contextData = `INBOX CONTEXT:\n- Total threads: ${totalThreads}\n- Unread threads: ${unreadThreads}\n- Last activity: ${latestThread?.updatedAt || 'Unknown'}`;
          break;

        case 'calendar':
          const upcomingEvents = await prisma.calendarEvent.findMany({
            where: { orgId: org.id, start: { gte: new Date() } },
            orderBy: { start: 'asc' },
            take: 5,
            select: { start: true, end: true }
          });
          contextData = `CALENDAR CONTEXT:\n- Upcoming events: ${upcomingEvents.length}\n${upcomingEvents
            .map(e => `- Event starting ${e.start}`)
            .join('\n')}`;
          break;

        case 'contacts':
          const [totalContacts, recentContacts] = await Promise.all([
            prisma.contact.count({ where: { orgId: org.id } }),
            prisma.contact.findMany({
              where: { orgId: org.id },
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { createdAt: true }
            })
          ]);
          contextData = `CONTACTS CONTEXT:\n- Total contacts: ${totalContacts}\n- Recent contacts: ${recentContacts.length}`;
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
    let thread: { id: string } | null = null;
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error('Not authenticated');
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          orgMembers: { include: { org: true } }
        }
      });

      const org = user?.orgMembers?.[0]?.org;
      if (!user || !org) {
        throw new Error('No organization found');
      }

      if (threadId) {
        thread = await prisma.chatThread.findFirst({
          where: { id: threadId, orgId: org.id }
        });
      }
      if (!thread) {
        thread = await prisma.chatThread.create({
          data: {
            orgId: org.id,
            userId: user.id,
            contextType: context?.type,
            contextId: context?.id
          }
        });
      }

      await prisma.chatMessage.create({
        data: {
          threadId: thread.id,
          role: 'user',
          content: message
        }
      });

      const contextData = await this.gatherContext(context);
      const availableActions = await this.getAvailableActions();

      const systemPrompt = `You are an AI assistant for a real estate CRM system called Rivor. You have access to:

${contextData}

AVAILABLE ACTIONS:
${availableActions.map(action => `- ${action.label} (${action.type})`).join('\\n')}

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

      let aiResponse = 'I apologize, but I encountered an error processing your request.';
      
      const openai = await getOpenAI();
      if (!openai) {
        aiResponse = 'AI service is currently unavailable. The OpenAI API key is not configured. Please check your environment variables.';
      } else {
        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Use gpt-4o-mini for better cost efficiency
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            max_tokens: 1000,
            temperature: 0.7
          });

          aiResponse = completion.choices[0]?.message?.content || 'I received an empty response from the AI service.';
        } catch (openaiError: any) {
          console.error('OpenAI API Error:', openaiError);
          if (openaiError.status === 401) {
            aiResponse = 'Authentication failed with OpenAI. Please check your API key configuration.';
          } else if (openaiError.status === 429) {
            aiResponse = 'Rate limit exceeded. Please try again in a moment.';
          } else if (openaiError.status === 500) {
            aiResponse = 'OpenAI service is experiencing issues. Please try again later.';
          } else {
            aiResponse = `OpenAI API error: ${openaiError.message || 'Unknown error occurred'}`;
          }
        }
      }

      const suggestedActions = this.analyzeResponseForActions(
        aiResponse,
        availableActions,
        context
      );

      const savedMessage = await prisma.chatMessage.create({
        data: {
          threadId: thread.id,
          role: 'assistant',
          content: aiResponse,
          reasoning: `Analyzed user request in context of ${context?.type || 'general'} data. Suggested ${suggestedActions.length} relevant actions.`
        }
      });

      return {
        id: savedMessage.id,
        threadId: thread.id,
        content: savedMessage.content,
        role: 'assistant',
        timestamp: savedMessage.createdAt,
        reasoning: savedMessage.reasoning || undefined,
        actions: suggestedActions
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        id: `msg_${Date.now()}`,
        threadId: threadId || thread?.id || 'unknown',
        content:
          'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.',
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
    const thread = await prisma.chatThread.findUnique({
      where: { id: threadId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    if (!thread) {
      throw new Error('Thread not found');
    }
    return {
      id: thread.id,
      messages: thread.messages.map(m => ({
        id: m.id,
        threadId: thread.id,
        content: m.content,
        role: m.role as 'user' | 'assistant',
        timestamp: m.createdAt,
        reasoning: m.reasoning || undefined,
      })),
      context: thread.contextType
        ? { type: thread.contextType as ChatContext['type'], id: thread.contextId || undefined }
        : undefined,
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
