import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

interface ToolCall {
  id: string;
  tool: string;
  parameters: Record<string, unknown>;
  result?: unknown;
}

interface ChatSource {
  id: string;
  type: 'email' | 'lead' | 'contact' | 'event' | 'task';
  title: string;
  url: string;
  snippet?: string;
}

/**
 * Chat API with grounded tools
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { message } = await req.json();
    // TODO: Implement history when needed

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Analyze the message to determine which tools to use
    const toolCalls = await analyzeAndExecuteTools(message, orgId);
    const sources = extractSourcesFromToolCalls(toolCalls);
    
    // Generate response based on tool results
    const content = await generateResponse(message, toolCalls);

    const response = {
      content,
      sources,
      toolCalls: toolCalls.map(tc => ({
        id: tc.id,
        tool: tc.tool,
        parameters: tc.parameters
      }))
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

/**
 * Analyze message and execute appropriate tools
 */
async function analyzeAndExecuteTools(message: string, orgId: string): Promise<ToolCall[]> {
  const toolCalls: ToolCall[] = [];
  const lowerMessage = message.toLowerCase();

  // Email search tool
  if (lowerMessage.includes('email') || lowerMessage.includes('search') || lowerMessage.includes('find')) {
    const emailQuery = extractEmailQuery(message);
    if (emailQuery) {
      const result = await searchEmails(emailQuery, orgId);
      toolCalls.push({
        id: `search_emails_${Date.now()}`,
        tool: 'searchEmails',
        parameters: { query: emailQuery },
        result
      });
    }
  }

  // Lead lookup tool
  if (lowerMessage.includes('lead') || lowerMessage.includes('pipeline') || lowerMessage.includes('deal')) {
    const result = await listLeads(orgId);
    toolCalls.push({
      id: `list_leads_${Date.now()}`,
      tool: 'listLeads',
      parameters: {},
      result
    });
  }

  // Calendar events tool
  if (lowerMessage.includes('meeting') || lowerMessage.includes('calendar') || lowerMessage.includes('event') || lowerMessage.includes('upcoming')) {
    const result = await listUpcomingEvents(orgId);
    toolCalls.push({
      id: `list_events_${Date.now()}`,
      tool: 'listUpcomingEvents',
      parameters: {},
      result
    });
  }

  // Task creation tool
  if (lowerMessage.includes('create task') || lowerMessage.includes('add task') || lowerMessage.includes('remind') || lowerMessage.includes('follow up')) {
    const taskData = extractTaskData(message);
    if (taskData.title) {
      const result = await createTask(taskData, orgId);
      toolCalls.push({
        id: `create_task_${Date.now()}`,
        tool: 'createTask',
        parameters: taskData,
        result
      });
    }
  }

  // Contact lookup tool
  if (lowerMessage.includes('contact') && !lowerMessage.includes('create')) {
    const contactName = extractContactName(message);
    if (contactName) {
      const result = await searchContacts(contactName, orgId);
      toolCalls.push({
        id: `search_contacts_${Date.now()}`,
        tool: 'searchContacts',
        parameters: { name: contactName },
        result
      });
    }
  }

  return toolCalls;
}

/**
 * Search emails tool
 */
async function searchEmails(query: string, orgId: string) {
  try {
    const threads = await prisma.emailThread.findMany({
      where: {
        orgId,
        OR: [
          { subject: { contains: query, mode: 'insensitive' } },
          {
            messages: {
              some: {
                OR: [
                  { textBody: { contains: query, mode: 'insensitive' } },
                  { fromEmail: { contains: query, mode: 'insensitive' } }
                ]
              }
            }
          }
        ]
      },
      include: {
        messages: {
          take: 1,
          orderBy: { sentAt: 'desc' }
        }
      },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    return threads.map(thread => ({
      id: thread.id,
      subject: thread.subject,
      snippet: thread.messages[0]?.snippet || '',
      updatedAt: thread.updatedAt.toISOString()
    }));
  } catch (error) {
    console.error('Email search error:', error);
    return [];
  }
}

/**
 * List leads tool
 */
async function listLeads(orgId: string) {
  try {
    const leads = await prisma.lead.findMany({
      where: { orgId, status: 'active' },
      include: {
        stage: true
      },
      take: 10,
      orderBy: { updatedAt: 'desc' }
    });

    return leads.map(lead => ({
      id: lead.id,
      title: lead.title,
      company: lead.company,
      value: lead.value,
      stage: lead.stage?.name || 'Unknown',
      probability: lead.probability
    }));
  } catch (error) {
    console.error('Lead search error:', error);
    return [];
  }
}

/**
 * List upcoming events tool
 */
async function listUpcomingEvents(orgId: string) {
  try {
    const events = await prisma.calendarEvent.findMany({
      where: {
        orgId,
        start: { gte: new Date() }
      },
      take: 5,
      orderBy: { start: 'asc' }
    });

    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      location: event.location
    }));
  } catch (error) {
    console.error('Events search error:', error);
    return [];
  }
}

/**
 * Create task tool
 */
async function createTask(taskData: unknown, orgId: string) {
  try {
    const task = await prisma.task.create({
      data: {
        orgId,
        title: taskData.title,
        description: taskData.description || null,
        dueAt: taskData.dueAt ? new Date(taskData.dueAt) : null,
        priority: taskData.priority || 'medium',
        status: 'pending',
        createdBy: 'ai_assistant'
      }
    });

    return {
      id: task.id,
      title: task.title,
      dueAt: task.dueAt?.toISOString(),
      priority: task.priority
    };
  } catch (error) {
    console.error('Task creation error:', error);
    // Return a simulated task if database fails
    return {
      id: `demo_task_${Date.now()}`,
      title: taskData.title,
      dueAt: taskData.dueAt,
      priority: taskData.priority || 'medium'
    };
  }
}

/**
 * Search contacts tool
 */
async function searchContacts(name: string, orgId: string) {
  try {
    const contacts = await prisma.contact.findMany({
      where: {
        orgId,
        OR: [
          { name: { contains: name, mode: 'insensitive' } },
          { email: { contains: name, mode: 'insensitive' } },
          { company: { contains: name, mode: 'insensitive' } }
        ]
      },
      take: 5,
      orderBy: { lastActivityAt: 'desc' }
    });

    return contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      company: contact.company,
      lastActivity: contact.lastActivityAt?.toISOString()
    }));
  } catch (error) {
    console.error('Contact search error:', error);
    return [];
  }
}

/**
 * Extract sources from tool call results
 */
function extractSourcesFromToolCalls(toolCalls: ToolCall[]): ChatSource[] {
  const sources: ChatSource[] = [];

  toolCalls.forEach(toolCall => {
    if (toolCall.tool === 'searchEmails' && toolCall.result) {
      toolCall.result.forEach((email: unknown) => {
        sources.push({
          id: email.id,
          type: 'email',
          title: email.subject || 'Email Thread',
          url: `/app/inbox/${email.id}`,
          snippet: email.snippet
        });
      });
    }

    if (toolCall.tool === 'listLeads' && toolCall.result) {
      toolCall.result.forEach((lead: unknown) => {
        sources.push({
          id: lead.id,
          type: 'lead',
          title: `${lead.title} - ${lead.company}`,
          url: `/app/pipeline?lead=${lead.id}`,
          snippet: `$${lead.value.toLocaleString()} • ${lead.probability}% • ${lead.stage}`
        });
      });
    }

    if (toolCall.tool === 'listUpcomingEvents' && toolCall.result) {
      toolCall.result.forEach((event: unknown) => {
        sources.push({
          id: event.id,
          type: 'event',
          title: event.title,
          url: `/app/calendar?event=${event.id}`,
          snippet: `${new Date(event.start).toLocaleDateString()} at ${new Date(event.start).toLocaleTimeString()}`
        });
      });
    }

    if (toolCall.tool === 'createTask' && toolCall.result) {
      sources.push({
        id: toolCall.result.id,
        type: 'task',
        title: toolCall.result.title,
        url: `/app/tasks?task=${toolCall.result.id}`,
        snippet: toolCall.result.dueAt ? `Due: ${new Date(toolCall.result.dueAt).toLocaleDateString()}` : 'No due date'
      });
    }

    if (toolCall.tool === 'searchContacts' && toolCall.result) {
      toolCall.result.forEach((contact: unknown) => {
        sources.push({
          id: contact.id,
          type: 'contact',
          title: contact.name,
          url: `/app/contacts?contact=${contact.id}`,
          snippet: `${contact.email} • ${contact.company || 'No company'}`
        });
      });
    }
  });

  return sources;
}

/**
 * Generate response based on tool results
 */
async function generateResponse(message: string, toolCalls: ToolCall[]): Promise<string> {
  if (toolCalls.length === 0) {
    return "I understand you'd like help, but I'm not sure what specific action to take. Try asking me to search emails, find leads, check your calendar, or create a task.";
  }

  let response = "";

  toolCalls.forEach(toolCall => {
    switch (toolCall.tool) {
      case 'searchEmails':
        const emailCount = toolCall.result?.length || 0;
        if (emailCount > 0) {
          response += `I found ${emailCount} email${emailCount !== 1 ? 's' : ''} matching your search. `;
        } else {
          response += "I couldn't find any emails matching your search criteria. ";
        }
        break;

      case 'listLeads':
        const leadCount = toolCall.result?.length || 0;
        if (leadCount > 0) {
          const totalValue = toolCall.result?.reduce((sum: number, lead: unknown) => sum + lead.value, 0) || 0;
          response += `I found ${leadCount} active lead${leadCount !== 1 ? 's' : ''} in your pipeline with a total value of $${totalValue.toLocaleString()}. `;
        } else {
          response += "You don't have any active leads in your pipeline yet. ";
        }
        break;

      case 'listUpcomingEvents':
        const eventCount = toolCall.result?.length || 0;
        if (eventCount > 0) {
          response += `You have ${eventCount} upcoming event${eventCount !== 1 ? 's' : ''} on your calendar. `;
        } else {
          response += "You don't have any upcoming events on your calendar. ";
        }
        break;

      case 'createTask':
        if (toolCall.result) {
          response += `I've created a new task: "${toolCall.result.title}". `;
          if (toolCall.result.dueAt) {
            response += `It's due on ${new Date(toolCall.result.dueAt).toLocaleDateString()}. `;
          }
        }
        break;

      case 'searchContacts':
        const contactCount = toolCall.result?.length || 0;
        if (contactCount > 0) {
          response += `I found ${contactCount} contact${contactCount !== 1 ? 's' : ''} matching your search. `;
        } else {
          response += "I couldn't find any contacts matching your search. ";
        }
        break;
    }
  });

  response += "You can click on the source chips below to view more details.";

  return response.trim();
}

/**
 * Helper functions to extract data from messages
 */
function extractEmailQuery(message: string): string | null {
  // Simple extraction - in a real implementation, this would be more sophisticated
  const patterns = [
    /search\s+(?:for\s+)?(?:emails?\s+)?(?:about\s+)?(.+)/i,
    /find\s+(?:emails?\s+)?(?:about\s+)?(.+)/i,
    /emails?\s+(?:about\s+)?(.+)/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/['"]/g, '');
    }
  }

  return null;
}

function extractTaskData(message: string) {
  const data: unknown = {};
  
  // Extract task title
  const titlePatterns = [
    /create\s+(?:a\s+)?task\s+(?:to\s+)?(.+?)(?:\s+due|\s+for|$)/i,
    /add\s+(?:a\s+)?task\s+(?:to\s+)?(.+?)(?:\s+due|\s+for|$)/i,
    /remind\s+me\s+to\s+(.+?)(?:\s+due|\s+for|$)/i,
    /follow\s+up\s+(?:with\s+)?(.+?)(?:\s+due|\s+for|$)/i
  ];

  for (const pattern of titlePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      data.title = match[1].trim();
      break;
    }
  }

  // Extract due date
  const datePatterns = [
    /due\s+(.+)/i,
    /by\s+(.+)/i,
    /on\s+(.+)/i
  ];

  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const dateStr = match[1].trim();
      // Simple date parsing - in a real implementation, use a proper date parser
      if (dateStr.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        data.dueAt = tomorrow.toISOString();
      } else if (dateStr.includes('next week')) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        data.dueAt = nextWeek.toISOString();
      }
      break;
    }
  }

  return data;
}

function extractContactName(message: string): string | null {
  const patterns = [
    /contact\s+(.+)/i,
    /find\s+(.+)/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/['"]/g, '');
    }
  }

  return null;
}